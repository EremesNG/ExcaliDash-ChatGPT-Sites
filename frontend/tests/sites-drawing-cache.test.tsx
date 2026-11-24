import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { PreferencesProvider, usePreference } from "../src/context/PreferencesContext";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, axios } from "../src/api/client";
import { getDrawing, getDrawingPreview, saveDrawing } from "../src/api/drawings";
import { setDrawingCacheAccount } from "../src/utils/drawingCacheAccount";
import { loadDrawing, prefetchDrawing } from "../src/utils/drawingPrefetch";
import {
  drawingPreviewGeneration,
  readExactCachedPreview,
  readLatestCachedPreview,
  writeCachedPreview,
} from "../src/components/drawing-card/previewCache";

const drawing = (id: string, name: string) => ({
  id, name, accessLevel: "owner", version: 1, elements: [],
  createdAt: 1000, updatedAt: 1000, hasPreview: true,
});

let renderer: ReactTestRenderer | undefined;

const mountSitesAuth = async (providePreferences = false) => {
  let user = "A";
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("sessionStorage", storage);
  vi.stubGlobal("window", Object.assign(new EventTarget(), { localStorage: storage }));
  vi.spyOn(axios, "get").mockImplementation(async (url) =>
    url.endsWith("/auth/status")
      ? { data: { authEnabled: true, authMode: "oidc_enforced" } }
      : { data: { user: { id: user, email: "", name: user } } },
  );
  function AuthProbe() {
    const auth = useAuth();
    return <output onClick={auth.retryAuthStatus}>{auth.user?.id}</output>;
  }
  function PreferenceProbe() {
    const [append, setAppend] = usePreference("appendDroppedDrawings", false);
    return <button onClick={() => setAppend(!append)}>{append ? "append" : "replace"}</button>;
  }
  await act(async () => {
    renderer = create(
      <MemoryRouter>
        <AuthProvider>
          <AuthProbe />
          {providePreferences && <PreferencesProvider><PreferenceProbe /></PreferencesProvider>}
        </AuthProvider>
      </MemoryRouter>,
    );
  });
  expect(renderer!.root.findByType("output").children).toEqual(["A"]);
  return {
    switchUser: async (next: string) => {
      user = next;
      await act(async () => { await renderer!.root.findByType("output").props.onClick(); });
      expect(renderer!.root.findByType("output").children).toEqual([next]);
    },
  };
};

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
  setDrawingCacheAccount(null);
  vi.restoreAllMocks();
});

describe("Sites drawing transport", () => {
  it("saves the append preference and reads the new account's value after switching", async () => {
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: { preferences: {} } })
      .mockResolvedValueOnce({ data: { preferences: { appendDroppedDrawings: false } } });
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: { preferences: { appendDroppedDrawings: true } } });
    const { switchUser } = await mountSitesAuth(true);
    const button = () => renderer!.root.findByType("button");
    expect(button().children).toEqual(["replace"]);
    await act(async () => { button().props.onClick(); });
    expect(put.mock.calls[0]?.slice(0, 2)).toEqual(["/auth/preferences", { appendDroppedDrawings: true }]);
    expect(button().children).toEqual(["append"]);
    await switchUser("B");
    expect(get).toHaveBeenCalledTimes(2);
    expect(button().children).toEqual(["replace"]);
  });

  it("revalidates an omitted-preview representation and rejects an invalid drawing", async () => {
    setDrawingCacheAccount("A");
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ status: 200, data: drawing("board", "A"), headers: { etag: '"tag"' } })
      .mockResolvedValueOnce({ status: 304, headers: {} })
      .mockResolvedValueOnce({ status: 200, data: "<html>", headers: {} });
    await expect(getDrawing("board", { omitPreview: true })).resolves.toMatchObject({ name: "A", hasPreview: true });
    await expect(getDrawing("board", { omitPreview: true })).resolves.toMatchObject({ name: "A" });
    expect(get.mock.calls[1]?.[1]).toMatchObject({ params: { omitPreview: 1 }, headers: { "If-None-Match": '"tag"' } });
    await expect(getDrawing("board")).rejects.toThrow();
    expect(get.mock.calls[2]?.[1]?.headers?.["If-None-Match"]).toBeUndefined();
  });

  it("requests minimal save metadata and retries unsupported gzip as JSON", async () => {
    const put = vi.spyOn(api, "put")
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 415 } })
      .mockResolvedValueOnce({ data: { id: "board", version: 2, updatedAt: 1000 } });
    const name = "a".repeat(70_000);
    await expect(saveDrawing("board", { name, expectedVersion: 1 })).resolves.toEqual({ id: "board", version: 2, updatedAt: 1000 });
    expect(put).toHaveBeenNthCalledWith(1, "/drawings/board", expect.any(Blob), { headers: { "Content-Type": "application/json", Prefer: "return=minimal", "Content-Encoding": "gzip" } });
    expect(put).toHaveBeenNthCalledWith(2, "/drawings/board", JSON.stringify({ name, expectedVersion: 1 }), { headers: { "Content-Type": "application/json", Prefer: "return=minimal" } });
  });

  it("discards A's previews, prefetches and validators across an account switch", async () => {
    const { switchUser } = await mountSitesAuth();
    const started = drawingPreviewGeneration();
    writeCachedPreview("board", "board:1", "A preview", started);
    let finishA!: (value: unknown) => void;
    let finishPreviewA!: (value: unknown) => void;
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ status: 200, data: drawing("board", "A"), headers: { etag: '"A"' } })
      .mockImplementationOnce(() => new Promise((resolve) => { finishA = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { finishPreviewA = resolve; }))
      .mockResolvedValueOnce({ status: 200, data: drawing("board", "B"), headers: { etag: '"B"' } });
    prefetchDrawing("board");
    await expect(loadDrawing("board")).resolves.toMatchObject({ name: "A" });
    prefetchDrawing("board");
    const pendingA = expect(loadDrawing("board")).rejects.toMatchObject({ name: "AbortError" });
    const pendingPreviewA = expect(getDrawingPreview("board")).rejects.toMatchObject({ name: "AbortError" });
    expect(get.mock.calls[1]?.[1]?.headers?.["If-None-Match"]).toBe('"A"');

    await switchUser("B");
    expect(readExactCachedPreview("board:1")).toBeNull();
    expect(readLatestCachedPreview("board")).toBeNull();
    expect(writeCachedPreview("board", "board:1", "late A preview", started)).toBe(false);
    await expect(loadDrawing("board")).resolves.toMatchObject({ name: "B" });
    expect(get).toHaveBeenCalledTimes(4);
    expect(get.mock.calls[3]?.[1]?.headers?.["If-None-Match"]).toBeUndefined();
    finishA({ status: 200, data: drawing("board", "late A"), headers: { etag: '"late-A"' } });
    finishPreviewA({ status: 200, data: { preview: "late A" } });
    await Promise.all([pendingA, pendingPreviewA]);
    get.mockResolvedValueOnce({ status: 304, headers: {} });
    await expect(loadDrawing("board")).resolves.toMatchObject({ name: "B" });
    expect(get.mock.calls[4]?.[1]?.headers?.["If-None-Match"]).toBe('"B"');
  });
});
