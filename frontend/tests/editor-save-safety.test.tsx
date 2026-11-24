import React, { useLayoutEffect, useState } from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import { Editor } from "../src/pages/Editor";
import { exportScene, restoreAppState } from "@excalidraw/excalidraw";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/api";
import { reloadAndReconcile } from "../src/pages/editor/reconcileSave";
import { useEditorPersistence } from "../src/pages/editor/useEditorPersistence";
import { useEditorSceneLoader } from "../src/pages/editor/useEditorSceneLoader";
import { useEditorCollaboration } from "../src/pages/editor/useEditorCollaboration";
import { api as pollingClient } from "../src/api/client";
import { reconcileElements } from "../src/utils/sync";
const { route } = vi.hoisted(() => ({ route: { id: "drawing" } }));
vi.mock("react-router-dom", () => ({
  useParams: () => route,
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));
vi.mock("@excalidraw/excalidraw", async () => ({
  ...(await (await import("./helpers/excalidrawRestore")).loadExcalidrawRestore()),
  exportScene: vi.fn(),
  CaptureUpdateAction: { IMMEDIATELY: "IMMEDIATELY", NEVER: "NEVER" },
}));
vi.mock("../src/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../src/api", () => ({
  getDrawing: vi.fn(),
  saveDrawing: vi.fn(),
  isAxiosError: (error: any) => Boolean(error.response),
}));
vi.mock("../src/utils/imageCompression", () => ({
  compressExcalidrawFiles: vi.fn(async (files) => ({ files, changed: false })),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const ref = <T,>(current: T) => ({ current });
const element = (id: string, version = 1, extra = {}) => ({
  id,
  type: "rectangle",
  version,
  versionNonce: version,
  updated: version,
  ...extra,
});
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
};
const appState = { viewBackgroundColor: "#ffffff" };
let renderer: ReactTestRenderer | undefined;
const makeHarness = (initial = [element("local")]) => {
  let live: any[] = initial;
  const editor = {
    getSceneElementsIncludingDeleted: () => live,
    getFiles: () => ({}),
    getAppState: () => appState,
    addFiles: vi.fn(),
    updateScene: vi.fn(({ elements }) => {
      live = elements;
    }),
  };
  const refs = {
    lastAcceptedAppState: ref<Record<string, unknown>>(appState),
    currentDrawingVersion: ref<number | null>(1),
    debouncedSave: ref(null),
    excalidrawAPI: ref<any>(editor),
    isSyncing: ref(false),
    isUnmounting: ref(false),
    localSceneRevision: ref(1),
    savedSceneRevision: ref(0),
    lastPersistedElements: ref<readonly any[]>(initial),
    lastPersistedFiles: ref({}),
    lastSyncedFiles: ref({}),
    latestAppState: ref(appState),
    latestElements: ref<readonly any[]>(initial),
    latestFiles: ref<any>({}),
    saveQueue: ref(Promise.resolve()),
    suspiciousBlankLoad: ref(false),
    uploadedRefs: ref({}),
  };
  let persistence!: ReturnType<typeof useEditorPersistence>;
  function Harness({
    drawingId = "drawing",
    canEdit = true,
  }: {
    drawingId?: string;
    canEdit?: boolean;
  }) {
    const nextPersistence = useEditorPersistence({
      drawingId,
      canEdit,
      refs,
      user: null,
      normalizeImageElementStatus: (elements = []) => elements,
      resolveSafeSnapshot: (snapshot = []) => ({
        snapshot,
        prevented: false,
        staleEmptySnapshot: false,
        staleNonRenderableSnapshot: false,
      }),
    });
    useLayoutEffect(() => {
      persistence = nextPersistence;
    });
    return null;
  }
  return {
    refs,
    editor,
    Harness,
    setLive: (elements: any[], localEdit = true) => {
      live = elements;
      refs.latestElements.current = elements;
      if (localEdit) refs.localSceneRevision.current++;
    },
    get persistence() {
      return persistence;
    },
  };
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(api.saveDrawing).mockResolvedValue({ version: 2 } as never);
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const mount = async (Harness: React.ComponentType) => {
  await act(async () => {
    renderer = create(<Harness />);
  });
};
const stubCollaborationGlobals = () => {
  vi.stubGlobal("window", Object.assign(new EventTarget(), {
    location: { origin: "http://localhost" },
  }));
  vi.stubGlobal("document", new EventTarget());
  vi.stubGlobal("requestAnimationFrame", (run: FrameRequestCallback) =>
    setTimeout(() => run(Date.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
};
const me = { id: "same-user", name: "User", initials: "U", color: "red" };
function CollaborationSession({ h }: { h: ReturnType<typeof makeHarness> }) {
  useEditorCollaboration({
    drawingId: "drawing", me, isReady: true,
    excalidrawAPI: h.refs.excalidrawAPI,
    latestElementsRef: h.refs.latestElements,
    latestFilesRef: h.refs.latestFiles,
    lastSyncedFilesRef: h.refs.lastSyncedFiles,
    lastSyncedElementOrderRef: React.useRef(null),
    recordElementVersion: React.useCallback(() => {}, []),
    onAccessDenied: React.useCallback(() => {}, []),
  });
  return <h.Harness />;
}
const makeLoader = (h: ReturnType<typeof makeHarness>): Parameters<typeof useEditorSceneLoader>[0] => ({
  id: "drawing",
  user: null,
  isReady: false,
  canEdit: true,
  debouncedSaveLibrary: vi.fn(),
  location: { pathname: "/editor/drawing", hash: "", search: "" },
  navigate: vi.fn(),
  refs: {
    ...h.refs,
    elementVersionMap: ref(new Map()),
    initialSceneElements: ref([]),
    lastSyncedElementOrder: ref(null),
    hasSceneChangesSinceLoad: ref(false),
    isBootstrappingScene: ref(true),
    hasHydratedInitialScene: ref(false),
  },
  setAccessLevel: vi.fn(),
  setDrawingName: vi.fn(),
  setIsReady: vi.fn(),
  setIsSceneLoading: vi.fn(),
  setLoadError: vi.fn(),
  recordElementVersion: vi.fn(),
  normalizeImageElementStatus: (elements = []) => elements,
  setInitialData: (scene) => {
    if (!scene) return;
    const restored = restoreAppState(scene.appState, null);
    h.editor.getAppState = () => restored;
    h.refs.excalidrawAPI.current = h.editor;
  },
});
describe("delayed scene-save acknowledgement", () => {
  it("saves a newer grid toggle and element edit after polling its own unacknowledged commit", async () => {
    stubCollaborationGlobals();
    const original = element("local", 1, { x: 0 });
    const edited = { ...original, x: 100 };
    const h = makeHarness([original]);
    const local = { ...appState, gridModeEnabled: false, gridSize: 20 };
    h.refs.lastAcceptedAppState.current = { ...local };
    h.editor.getAppState = () => local;
    h.editor.updateScene.mockImplementation((scene) => {
      if (scene.elements) h.setLive(scene.elements, false);
      Object.assign(local, scene.appState);
    });
    let stored = { version: 1, elements: [original], appState: { ...local }, files: {} };
    const ack = deferred<{ version: number }>();
    vi.mocked(api.getDrawing).mockImplementation(async () => structuredClone(stored) as never);
    const polledVersions: number[] = [];
    vi.mocked(pollingClient.get).mockImplementation(async (url) => {
      if (url.endsWith("/events")) return { data: { events: [] } };
      polledVersions.push(stored.version);
      return { data: structuredClone(stored) };
    });
    vi.mocked(api.saveDrawing).mockImplementation(async (_id, write) => {
      expect(write.version).toBe(stored.version);
      stored = {
        ...stored,
        version: stored.version + 1,
        elements: structuredClone(write.elements) as typeof stored.elements,
        appState: structuredClone(write.appState) as typeof local,
      };
      return (stored.version === 2 ? ack.promise : { version: stored.version }) as never;
    });
    await mount(() => <CollaborationSession h={h} />);
    const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
    local.gridModeEnabled = true;
    h.persistence.debouncedSave("drawing", [original], local, {});
    await tick(1100);
    expect(stored).toMatchObject({ version: 2, appState: { gridModeEnabled: true } });
    expect(h.refs.savedSceneRevision.current).toBe(0);

    local.gridModeEnabled = false;
    h.setLive([edited]);
    h.persistence.debouncedSave("drawing", [edited], local, {});
    await tick(5000);
    expect(h.editor.getSceneElementsIncludingDeleted()).toEqual([edited]);
    expect(stored.version).toBe(2);
    expect(polledVersions).toContain(2);
    const versionBeforeAck = h.refs.currentDrawingVersion.current;
    await act(async () => {
      ack.resolve({ version: 2 });
      await h.refs.saveQueue.current;
    });

    expect(stored.version).toBe(3);
    expect(stored.elements).toEqual([edited]);
    expect(h.refs.savedSceneRevision.current).toBe(h.refs.localSceneRevision.current);
    expect([local.gridModeEnabled, stored.appState.gridModeEnabled]).toEqual([false, false]);
    expect(versionBeforeAck).toBe(1);
  });
});
describe("persisted scene settings", () => {
  it.each([
    ["first", "autosave"], ["first", "queued explicit save"],
    ["last", "autosave"], ["last", "queued explicit save"],
  ])("applies peer settings only on reload or retry when saving the background %s via %s", async (order, mode) => {
    stubCollaborationGlobals();
    const rectangle = element("initial");
    const ellipse = element("peer", 1, { type: "ellipse" });
    const localShape = element("local-only", 1, { type: "diamond" });
    const initial = { viewBackgroundColor: "#ffffff", gridSize: 20, gridModeEnabled: false };
    const a = makeHarness([rectangle]);
    const b = makeHarness([rectangle]);
    const aState = { ...initial, gridStep: 5 };
    const bState = { ...initial, gridStep: 8 };
    for (const [h, local] of [[a, aState], [b, bState]] as const) {
      h.refs.lastAcceptedAppState.current = initial;
      h.editor.getAppState = () => local;
      h.editor.updateScene.mockImplementation((scene) => {
        if (scene.elements) h.setLive(scene.elements, false);
        Object.assign(local, scene.appState);
      });
    }
    let stored = {
      version: 1, elements: [rectangle], appState: initial, files: {}, accessLevel: "owner",
    };
    const commits: Array<[number | undefined, number]> = [];
    const previewCommits: number[] = [];
    if (mode !== "autosave") {
      vi.mocked(exportScene).mockResolvedValueOnce({ outerHTML: "<svg />" } as never);
    }
    vi.mocked(api.getDrawing).mockImplementation(async () => structuredClone(stored) as never);
    vi.mocked(api.saveDrawing).mockImplementation(async (_id, write) => {
      if (write.version !== stored.version) {
        commits.push([write.version, 409]);
        throw { response: { status: 409 } };
      }
      if (write.preview) {
        stored.version++;
        previewCommits.push(stored.version);
        return { version: stored.version } as never;
      }
      stored = {
        ...stored,
        version: stored.version + 1,
        elements: structuredClone(write.elements) as typeof stored.elements,
        appState: structuredClone(write.appState) as typeof initial,
      };
      commits.push([write.version, 200]);
      return { version: stored.version } as never;
    });
    vi.mocked(pollingClient.get).mockImplementation(async (url) => ({
      data: url.endsWith("/events") ? { events: [] } : structuredClone(stored),
    }));
    await mount(() => <><CollaborationSession h={a} /><CollaborationSession h={b} /></>);
    const tick = (ms: number) => act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
    const saveA = () => {
      if (mode === "autosave") {
        a.persistence.debouncedSave("drawing", a.editor.getSceneElementsIncludingDeleted(), aState, {});
      } else {
        // Ctrl+S shares the scene save queue but also renders and writes a
        // version-guarded preview after the scene save completes.
        void a.persistence.enqueueSceneSave("drawing", a.editor.getSceneElementsIncludingDeleted(), aState, {}, {
          suppressErrors: false,
        }).then(() => a.persistence.savePreviewRef.current?.(
          "drawing", a.refs.lastPersistedElements.current, aState, {}, {
            expectedVersion: a.refs.currentDrawingVersion.current,
            useSuppliedSnapshot: true,
          },
        ));
      }
    };
    await tick(20);
    aState.viewBackgroundColor = "#fffce8";
    bState.gridModeEnabled = true;
    bState.gridSize = 40;
    b.setLive([rectangle, ellipse]);
    if (order === "first") {
      a.setLive([rectangle, localShape]);
      saveA();
    } else {
      // A previous preview write advances only the version, forcing B to retry
      // before A starts its own save against the now-stale local version.
      stored.version++;
    }
    b.persistence.debouncedSave("drawing", [rectangle, ellipse], bState, {});
    await tick(1300);
    expect(commits).toEqual(order === "first"
      ? [[1, 200], [1, 409], [mode === "autosave" ? 2 : 3, 200]]
      : [[1, 409], [2, 200]]);
    expect(a.editor.getSceneElementsIncludingDeleted()).toEqual(
      order === "first" ? [rectangle, localShape] : [rectangle],
    );
    await tick(4700);
    expect(a.editor.getSceneElementsIncludingDeleted()).toEqual(
      expect.arrayContaining([rectangle, ellipse]),
    );
    expect(a.editor.getAppState()).toMatchObject({
      viewBackgroundColor: "#fffce8", gridModeEnabled: false, gridSize: 20, gridStep: 5,
    });

    if (order === "last") {
      a.setLive([rectangle, ellipse, localShape]);
      saveA();
      await tick(1300);
      expect(commits.slice(-2)).toEqual([[1, 409], [3, 200]]);
      expect(b.editor.getAppState()).toMatchObject({ viewBackgroundColor: "#ffffff" });
    } else {
      expect(b.editor.getAppState()).toMatchObject({
        viewBackgroundColor: "#fffce8", gridModeEnabled: true, gridSize: 40, gridStep: 8,
      });
      const reloaded = makeHarness();
      const loader = makeLoader(reloaded);
      function ReloadedSession() {
        useEditorSceneLoader(loader);
        return null;
      }
      await act(async () => renderer?.unmount());
      await mount(ReloadedSession);
      expect(reloaded.editor.getAppState()).toMatchObject({
        viewBackgroundColor: "#fffce8", gridModeEnabled: true, gridSize: 40,
      });
    }
    expect(previewCommits).toEqual(mode === "autosave" ? [] : [order === "first" ? 3 : 5]);
    expect(stored.appState).toEqual({
      viewBackgroundColor: "#fffce8", gridModeEnabled: true, gridSize: 40,
      gridStep: order === "first" ? 8 : 5,
    });
    expect(stored.elements).toHaveLength(3);
    expect(stored.elements).toEqual(expect.arrayContaining([rectangle, ellipse, localShape]));
    if (order === "last") {
      expect(a.editor.getAppState()).toMatchObject({ ...stored.appState, gridStep: 5 });
    }
  });
});
describe("conflict reconciliation", () => {
  it.each([
    ["stickynote", "baseHeight", 100, 140],
    ["text", "baseFontSize", 20, 28],
  ])(
    "preserves a live %s %s edit made during a conflict reload",
    async (type, field, before, after) => {
      const original = element("local", 1, { type, [field]: before });
      const edited = { ...original, [field]: after };
      const h = makeHarness([original]);
      const response = deferred<any>();
      vi.mocked(api.getDrawing).mockReturnValueOnce(response.promise);
      const read = reloadAndReconcile(h.refs, "drawing", [original], {});
      h.setLive([edited]);
      response.resolve({ version: 2, elements: [original], files: {} });
      expect((await read)!.elements).toEqual([edited]);
      expect(h.editor.getSceneElementsIncludingDeleted()).toEqual([edited]);
    },
  );
  it("keeps edits and peer additions received while the HTTP read is pending", async () => {
    const h = makeHarness();
    const response = deferred<any>();
    vi.mocked(api.getDrawing).mockReturnValue(response.promise);
    const reconciling = reloadAndReconcile(
      h.refs,
      "drawing",
      [element("local")],
      {},
    );
    h.setLive([element("local", 3), element("arrived-during-read")]);
    response.resolve({ version: 4, elements: [element("remote")], files: {} });
    const merged = await reconciling;
    expect(merged!.elements).toEqual(
      expect.arrayContaining([
        element("local", 3),
        element("arrived-during-read"),
        element("remote"),
      ]),
    );
    expect(h.refs.latestElements.current).toEqual(merged!.elements);
  });
  it("preserves live geometry changed during an HTTP read even when revision metadata is unchanged", async () => {
    const original = element("local", 1, { x: 0 });
    const h = makeHarness([original]);
    const response = deferred<any>();
    vi.mocked(api.getDrawing).mockReturnValue(response.promise);
    const read = reloadAndReconcile(h.refs, "drawing", [original], {});
    const moved = element("local", 1, { x: 100 });
    h.setLive([moved]);
    response.resolve({ version: 2, elements: [original], files: {} });
    expect((await read)!.elements).toEqual([moved]);
  });
  it("keeps a newer deletion tombstone over an old HTTP response", async () => {
    const h = makeHarness();
    vi.mocked(api.getDrawing).mockImplementation(async () => {
      h.setLive([element("local", 3, { isDeleted: true })]);
      return {
        version: 4,
        elements: [element("local", 2)],
        files: {},
      } as never;
    });
    expect(
      (await reloadAndReconcile(h.refs, "drawing", [element("local")], {}))!
        .elements,
    ).toEqual([element("local", 3, { isDeleted: true })]);
  });
});
describe("serialized saves", () => {
  it("retries a legacy drawing with the local background and peer grid size, not the peer grid step", async () => {
    const h = makeHarness();
    const loader = makeLoader(h);
    vi.mocked(api.getDrawing).mockResolvedValueOnce({
      version: 1,
      accessLevel: "owner",
      elements: [element("local")],
      files: {},
      appState,
    } as never);
    function Harness() {
      useEditorSceneLoader(loader);
      return <h.Harness />;
    }
    await mount(Harness);
    const restored = h.editor.getAppState();
    expect(restored).toMatchObject({ gridSize: 20 });
    h.editor.getAppState = () => ({
      ...restored,
      viewBackgroundColor: "#ff0000",
      gridStep: 5,
    });
    vi.mocked(api.saveDrawing).mockRejectedValueOnce({
      response: { status: 409 },
    });
    vi.mocked(api.getDrawing).mockResolvedValueOnce({
      version: 2,
      elements: [element("peer")],
      files: {},
      appState: { viewBackgroundColor: "#ffffff", gridSize: 40, gridStep: 8 },
    } as never);

    await act(async () => {
      const save = h.persistence.enqueueSceneSave(
        "drawing", [element("local")], appState, {},
      );
      await vi.advanceTimersByTimeAsync(500);
      await save;
    });

    expect(api.saveDrawing).toHaveBeenNthCalledWith(
      2,
      "drawing",
      expect.objectContaining({
        version: 2,
        elements: expect.arrayContaining([element("local"), element("peer")]),
        appState: expect.objectContaining({
          viewBackgroundColor: "#ff0000",
          gridSize: 40,
          gridStep: 5,
        }),
      }),
    );
  });
  it("rebases a queued pre-conflict scene before using the advanced server version", async () => {
    const h = makeHarness();
    await mount(h.Harness);
    const firstSave = deferred<any>();
    vi.mocked(api.saveDrawing).mockReturnValueOnce(firstSave.promise);
    vi.mocked(api.getDrawing).mockResolvedValue({
      version: 2,
      elements: [element("peer")],
      files: {},
    } as never);
    const first = h.persistence.enqueueSceneSave(
      "drawing",
      [element("local")],
      appState,
      {},
    );
    await act(async () => {});
    h.setLive([element("local", 2)]);
    const second = h.persistence.enqueueSceneSave(
      "drawing",
      [element("local", 2)],
      appState,
      {},
    );
    firstSave.reject({ response: { status: 409 } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await first;
      await second;
    });
    expect(api.saveDrawing).toHaveBeenLastCalledWith(
      "drawing",
      expect.objectContaining({
        elements: expect.arrayContaining([
          element("local", 2),
          element("peer"),
        ]),
      }),
    );
  });
  it("finishes the old drawing's newest unsaved edit after direct navigation without borrowing the next drawing's state or permission", async () => {
    const sessions = new Map<string, ReturnType<typeof makeHarness>>();
    function DrawingSession({ id, canEdit }: { id: string; canEdit: boolean }) {
      const [h] = useState(() => makeHarness());
      useLayoutEffect(() => {
        sessions.set(id, h);
      });
      return <h.Harness drawingId={id} canEdit={canEdit} />;
    }
    // Use the actual route component's boundary key: removing it makes this
    // regression reuse A's hook state and lose the queued save on navigation.
    const shallow = new ShallowRenderer();
    route.id = "drawing";
    shallow.render(<Editor />);
    const firstKey = shallow.getRenderOutput().key;
    await act(async () => {
      renderer = create(<DrawingSession key={firstKey} id="drawing" canEdit />);
    });
    const a = sessions.get("drawing")!;
    const response = deferred<any>();
    vi.mocked(api.saveDrawing).mockReturnValueOnce(response.promise);
    const pending = a.persistence.enqueueSceneSave(
      "drawing",
      [element("local")],
      appState,
      {},
    );
    await act(async () => {});
    const finalEdit = [element("local", 5)];
    a.setLive(finalEdit);
    a.persistence.debouncedSave("drawing", finalEdit, appState, {});
    route.id = "other";
    shallow.render(<Editor />);
    await act(async () => {
      renderer!.update(
        <DrawingSession
          key={shallow.getRenderOutput().key}
          id="other"
          canEdit={false}
        />,
      );
    });
    const b = sessions.get("other")!;
    b.setLive([element("other", 10)]);
    b.refs.currentDrawingVersion.current = 10;
    b.refs.lastPersistedElements.current = [element("other", 10)];
    response.resolve({ version: 2 });
    await act(async () => {
      await pending;
      await a.refs.saveQueue.current;
    });
    expect(api.saveDrawing).toHaveBeenLastCalledWith(
      "drawing",
      expect.objectContaining({ elements: finalEdit, version: 2 }),
    );
    expect(
      vi.mocked(api.saveDrawing).mock.calls.every(([id]) => id === "drawing"),
    ).toBe(true);
    expect(b.refs.currentDrawingVersion.current).toBe(10);
    expect(b.refs.lastPersistedElements.current).toEqual([
      element("other", 10),
    ]);
    expect(b.refs.latestElements.current).toEqual([element("other", 10)]);
    expect(b.editor.updateScene).not.toHaveBeenCalled();
  });
  it("does not let an old drawing's response change another drawing's refs", async () => {
    const h = makeHarness();
    await mount(h.Harness);
    const response = deferred<any>();
    vi.mocked(api.saveDrawing).mockReturnValueOnce(response.promise);
    const save = h.persistence.enqueueSceneSave(
      "drawing",
      [element("local")],
      appState,
      {},
    );
    await act(async () => {});
    await act(async () => {
      renderer!.update(<h.Harness drawingId="other" />);
    });
    h.setLive([element("other")]);
    h.refs.currentDrawingVersion.current = 10;
    h.refs.lastPersistedElements.current = [element("other")];
    response.resolve({ version: 2 });
    await act(async () => {
      await save;
    });
    expect(h.refs.currentDrawingVersion.current).toBe(10);
    expect(h.refs.lastPersistedElements.current).toEqual([element("other")]);
    expect(h.editor.updateScene).not.toHaveBeenCalled();
  });
});
describe("concurrent element tie breaking", () => {
  it("converges independently of delivery order for equal version edits with different nonces", () => {
    const a = element("shape", 3, { versionNonce: 10, x: 10 });
    const b = element("shape", 3, { versionNonce: 20, x: 20 });
    expect(reconcileElements([a], [b])).toEqual(reconcileElements([b], [a]));
  });
  it("retains newer geometry when an older equal-version update arrives", () => {
    const newer = element("shape", 3, { updated: 10, x: 10 });
    expect(
      reconcileElements([newer], [element("shape", 3, { updated: 2, x: 2 })]),
    ).toEqual([newer]);
  });
});
