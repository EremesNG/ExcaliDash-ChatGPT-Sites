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
  // Compare the values Excalidraw would restore, not legacy nulls or omissions.
  const nextBase: Record<string, unknown> = getCanonicalSceneAppState(base);
  const localState = getCanonicalSceneAppState(local);
  const remoteState = remote as Record<string, unknown>;
  const canonicalRemote = getCanonicalSceneAppState(remoteState);
  for (const key of RECONCILED_APP_STATE_KEYS) {
    if (!Object.hasOwn(remoteState, key)) continue;
    const value = canonicalRemote[key];
    const localChanged = localState[key] !== nextBase[key];
    if (!localChanged && localState[key] !== value) {
      patch[key] = value;
    }
    // Track what the peer committed, not the merged view with unsaved edits.
    nextBase[key] = value;
  }
  return { nextBase, patch };
};
