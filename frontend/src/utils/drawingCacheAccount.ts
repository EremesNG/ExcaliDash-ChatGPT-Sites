import { updateDrawingCacheUserId } from "./authSession";
import { clearDrawingValidators } from "../api/drawings";
import { clearDrawingPreviewCache } from "../components/drawing-card/previewCache";
import { clearDashboardDataCache } from "../pages/dashboard/useDashboardData";
import { clearDrawingPrefetchCache } from "./drawingPrefetch";
import { clearPreviewThumbnailCache } from "./previewThumbnails";

export const setDrawingCacheAccount = (userId: string | null, force = false) => {
  if (!updateDrawingCacheUserId(userId, force)) return;
  clearDrawingValidators();
  clearDrawingPrefetchCache();
  clearDashboardDataCache();
  clearPreviewThumbnailCache();
  clearDrawingPreviewCache();
};
