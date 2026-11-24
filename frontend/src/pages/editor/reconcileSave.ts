import type { MutableRefObject } from "react";
import * as api from "../../api";
import { reconcileElements } from "../../utils/sync";
import {
  filesNeedRehydration,
  rehydrateFilesFromUrls,
} from "../../utils/rehydrateFiles";
import { mergePersistedAppState } from "./appStateReconciliation";

type ReconcileRefs = {
  currentDrawingVersion: MutableRefObject<number | null>;
  lastAcceptedAppState: MutableRefObject<Record<string, unknown>>;
  latestAppState: MutableRefObject<Record<string, unknown> | null>;
  excalidrawAPI: MutableRefObject<any>;
  isSyncing: MutableRefObject<boolean>;
  latestElements: MutableRefObject<readonly any[]>;
  latestFiles: MutableRefObject<any>;
  lastSyncedFiles: MutableRefObject<Record<string, any>>;
};

/**
 * On a save version conflict, reload the authoritative server scene and merge
 * it with the local edits (reconcileElements + a files union) rather than
 * blindly re-sending stale state over a newer version — the old blind retry
 * could clobber another client's concurrent work. The merged scene is pushed
 * back into the live editor so what the user sees matches what gets saved.
 */
export const reloadAndReconcile = async (
  refs: ReconcileRefs,
  drawingId: string,
  localElements: readonly any[],
  localFiles: Record<string, any>,
  isCurrent: () => boolean = () => true,
  sampledAppState?: Record<string, unknown>,
): Promise<{
  elements: readonly any[];
  files: Record<string, any>;
  appState: Record<string, any>;
} | null> => {
  if (!isCurrent()) return null;
  const remote = await api.getDrawing(drawingId, { omitPreview: true });
  if (!isCurrent()) return null;
  const storedRemoteFiles =
    (remote.files as Record<string, any> | undefined) || {};
  const remoteFiles = filesNeedRehydration(storedRemoteFiles)
    ? await rehydrateFilesFromUrls(storedRemoteFiles)
    : storedRemoteFiles;
  if (!isCurrent()) return null;
  const editor = refs.excalidrawAPI.current;
  const liveElements =
    editor?.getSceneElementsIncludingDeleted?.() ?? refs.latestElements.current;
  const remoteElements = Array.isArray(remote.elements) ? remote.elements : [];
  const mergedElements = reconcileElements(
    reconcileElements(localElements, liveElements),
    remoteElements,
    editor?.getAppState?.(),
    true,
  );
  const mergedFiles = {
    ...remoteFiles,
    ...localFiles,
    ...refs.latestFiles.current,
    ...editor?.getFiles?.(),
  };
  const localAppState =
    editor?.getAppState?.() ?? refs.latestAppState.current ?? sampledAppState ?? {};
  // A local preview acknowledgement may have advanced the version during the read.
  const acceptsRemote = remote.version >= (refs.currentDrawingVersion.current ?? 0);
  const { nextBase, patch } = mergePersistedAppState(
    refs.lastAcceptedAppState.current,
    localAppState,
    acceptsRemote ? remote.appState : undefined,
  );
  if (acceptsRemote) {
    refs.currentDrawingVersion.current = remote.version;
    refs.lastAcceptedAppState.current = nextBase;
  }
  const mergedAppState = { ...localAppState, ...patch };
  if (editor) {
    refs.isSyncing.current = true;
    try {
      if (typeof editor.addFiles === "function") {
        editor.addFiles(Object.values(mergedFiles));
      }
      if (typeof editor.updateScene === "function") {
        editor.updateScene({
          elements: mergedElements,
          ...(Object.keys(patch).length > 0
            ? { appState: patch }
            : {}),
          captureUpdate: "NEVER",
        });
      }
    } finally {
      refs.isSyncing.current = false;
    }
  }
  refs.latestAppState.current = mergedAppState;
  refs.latestElements.current = mergedElements;
  refs.latestFiles.current = mergedFiles;
  refs.lastSyncedFiles.current = mergedFiles;
  return {
    elements: mergedElements,
    files: mergedFiles,
    appState: mergedAppState,
  };
};
