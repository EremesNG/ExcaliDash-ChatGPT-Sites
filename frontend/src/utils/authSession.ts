// Bumped synchronously whenever the signed-in account changes (including in
// another tab). Deferred writes capture it and are dropped if it moved, so they
// never run under the next account's credentials.
let authSessionGeneration = 0;

export const getAuthSessionGeneration = (): number => authSessionGeneration;

export const bumpAuthSessionGeneration = (): void => {
  authSessionGeneration++;
};

let drawingCacheUserId: string | null = null;

export const getDrawingCacheUserId = () => drawingCacheUserId;

export const updateDrawingCacheUserId = (userId: string | null, force = false) => {
  if (!force && userId === drawingCacheUserId) return false;
  drawingCacheUserId = userId;
  bumpAuthSessionGeneration();
  return true;
};

export const accountDrawingKey = (key: string) =>
  `${JSON.stringify(drawingCacheUserId)}:${key}`;

export const assertAuthSession = (started: number) => {
  if (started !== getAuthSessionGeneration()) {
    throw new DOMException("The authenticated account changed", "AbortError");
  }
};
