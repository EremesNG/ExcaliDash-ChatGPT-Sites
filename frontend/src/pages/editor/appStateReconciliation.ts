import { restoreAppState } from "@excalidraw/excalidraw";

// Only share drawing settings. Sites owns gridStep and theme via account
// preferences, and passes the preferred language as `langCode`, not scene data.
const RECONCILED_APP_STATE_KEYS = [
  "viewBackgroundColor",
  "gridSize",
  "gridModeEnabled",
] as const;

export const getCanonicalSceneAppState = (appState: Record<string, unknown>) => {
  const sceneSettings = Object.fromEntries(
    RECONCILED_APP_STATE_KEYS.map((key) => [key, appState[key] ?? undefined]),
  );
  const restored = restoreAppState(sceneSettings, null);
  return {
    viewBackgroundColor: restored.viewBackgroundColor,
    gridSize: restored.gridSize,
    gridModeEnabled: restored.gridModeEnabled,
  };
};

export const mergePersistedAppState = (
  base: Record<string, unknown>,
  local: Record<string, unknown>,
  remote: unknown,
) => {
  const patch: Record<string, unknown> = {};
  if (!remote || typeof remote !== "object" || Array.isArray(remote)) {
    return { nextBase: base, patch };
  }
  const prototype = Object.getPrototypeOf(remote);
  if (prototype !== Object.prototype && prototype !== null) {
    return { nextBase: base, patch };
  }
  // A valid remote snapshot replaces persisted settings: omitted keys restore to defaults.
  const baseState = getCanonicalSceneAppState(base);
  const localState = getCanonicalSceneAppState(local);
  const remoteState = getCanonicalSceneAppState(remote as Record<string, unknown>);
  for (const key of RECONCILED_APP_STATE_KEYS) {
    const localChanged = localState[key] !== baseState[key];
    if (!localChanged && localState[key] !== remoteState[key]) {
      patch[key] = remoteState[key];
    }
  }
  // Track what the peer committed, not the merged view with unsaved edits.
  return { nextBase: remoteState, patch };
};
