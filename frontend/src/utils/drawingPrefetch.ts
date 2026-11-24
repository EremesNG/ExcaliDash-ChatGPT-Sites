import { accountDrawingKey, getDrawingCacheUserId } from "./authSession";
import { getDrawing } from "../api";

type PendingDrawing = {
  request: ReturnType<typeof getDrawing>;
  controller: AbortController;
};

const pendingDrawings = new Map<string, PendingDrawing>();
let generation = 0;

const requestDrawing = (id: string, signal?: AbortSignal) => {
  const started = generation;
  return getDrawing(id, { omitPreview: true, signal }).then((drawing) => {
    signal?.throwIfAborted();
    if (started !== generation) {
      throw new DOMException("The drawing session changed", "AbortError");
    }
    return drawing;
  });
};

export const loadDrawing = (id: string) =>
  pendingDrawings.get(accountDrawingKey(id))?.request ?? requestDrawing(id);

// A card click can hand an in-flight request to the editor. Completed
// responses are removed so each subsequent open checks access again.
export const prefetchDrawing = (id: string) => {
  if (!getDrawingCacheUserId()) return;
  const key = accountDrawingKey(id);
  if (pendingDrawings.has(key)) return;
  const controller = new AbortController();
  const request = requestDrawing(id, controller.signal).finally(() => {
    if (pendingDrawings.get(key)?.controller === controller) {
      pendingDrawings.delete(key);
    }
  });
  pendingDrawings.set(key, { request, controller });
  void request.catch(() => undefined);
};

export const invalidatePrefetchedDrawing = (id: string) => {
  const key = accountDrawingKey(id);
  pendingDrawings.get(key)?.controller.abort();
  pendingDrawings.delete(key);
};

export const clearDrawingPrefetchCache = () => {
  generation++;
  for (const { controller } of pendingDrawings.values()) controller.abort();
  pendingDrawings.clear();
};
