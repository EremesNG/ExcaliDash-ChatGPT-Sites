import { isDefaultPreviewBackground, SCENE_RASTER_IMAGE_ID } from "./previewSvg";
/**
 * Dashboard thumbnail rendering.
 *
 * Small scenes and scenes with photos keep a vector SVG. Large vector-only
 * scenes are rendered once to a small WebP and wrapped in a one-<image> SVG: rough.js
 * emits several paths per shape, so a 5,000-element drawing produced a ~15 MB
 * SVG that was uploaded every 30 s, sanitized on the server and parsed by
 * every dashboard visit. The wrapper keeps the server's SVG-only contract.
 */
import { blobToDataUrl } from "./dataUrls";
import {
  assertCurrentPreviewThumbnailGeneration,
  buildPreviewFiles,
  previewThumbnailGeneration,
} from "./previewThumbnails";

/** Live elements above which vector-only scenes skip SVG export. */
const RASTER_ELEMENT_THRESHOLD = 1000;
/** Larger vector previews without images are re-rendered as a raster. */
const MAX_VECTOR_PREVIEW_CHARS = 512 * 1024;
/** Longest edge of the raster thumbnail: ~2x a dashboard card. */
const RASTER_MAX_PX = 640;

type ExcalidrawExports = Pick<
  typeof import("@excalidraw/excalidraw"),
  "exportScene"
>;

export type RenderPreviewArgs = {
  elements: readonly any[];
  appState: Record<string, any>;
  files: Record<string, any>;
  exportPadding?: number;
};

const previewConfig = (appState: RenderPreviewArgs["appState"], padding = 10) => ({
  padding,
  theme: "light" as const,
  canvasBackgroundColor: isDefaultPreviewBackground(appState.viewBackgroundColor)
    ? false as const
    : appState.viewBackgroundColor,
});

const liveCount = (elements: readonly any[]) =>
  elements.reduce((n, el) => (el && !el.isDeleted ? n + 1 : n), 0);

// toBlob encodes off the main thread; toDataURL blocks it for tens of ms on
// a full thumbnail.
const encodeWebp = async (canvas: HTMLCanvasElement): Promise<string> => {
  if (typeof canvas.toBlob === "function") {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (blob) return blobToDataUrl(blob);
  }
  return canvas.toDataURL("image/webp", 0.85);
};

const renderRaster = async (
  excalidraw: ExcalidrawExports,
  { elements, appState, files, exportPadding }: RenderPreviewArgs,
): Promise<string> => {
  const canvas = await excalidraw.exportScene({
    type: "canvas",
    data: { elements, appState, files },
    config: { ...previewConfig(appState, exportPadding), maxWidthOrHeight: RASTER_MAX_PX },
  });
  // Throws on a tainted canvas (e.g. cross-origin S3 redirects); the caller
  // falls back to the vector path.
  const dataUrl = await encodeWebp(canvas);
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Canvas could not be encoded");
  }
  const { width, height } = canvas;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<image id="${SCENE_RASTER_IMAGE_ID}" href="${dataUrl}" x="0" y="0" width="${width}" height="${height}"></image>` +
    `</svg>`
  );
};

export const renderPreviewSvg = async (
  excalidraw: ExcalidrawExports,
  args: RenderPreviewArgs,
  serializeVector?: (svg: SVGSVGElement) => string,
): Promise<string> => {
  const generation = previewThumbnailGeneration();
  const hasImages = args.elements.some(
    (el) => el?.type === "image" && !el.isDeleted,
  );
  // Keep images separate so dark mode can theme the shapes and counter-filter
  // the images independently.
  if (!hasImages && liveCount(args.elements) > RASTER_ELEMENT_THRESHOLD) {
    try {
      const raster = await renderRaster(excalidraw, args);
      assertCurrentPreviewThumbnailGeneration(generation);
      return raster;
    } catch {
      assertCurrentPreviewThumbnailGeneration(generation);
      // Fall through to the vector preview.
    }
  }
  // Thumbnail-sized images: embedding originals made previews tens of MB.
  const previewFiles = await buildPreviewFiles(args.elements, args.files);
  const svg = await excalidraw.exportScene({
    type: "svg",
    data: { elements: args.elements, appState: args.appState, files: previewFiles as typeof args.files },
    config: { ...previewConfig(args.appState, args.exportPadding), embedScene: false },
  });
  assertCurrentPreviewThumbnailGeneration(generation);
  const vector = serializeVector ? serializeVector(svg) : svg.outerHTML;
  if (!hasImages && vector.length > MAX_VECTOR_PREVIEW_CHARS) {
    try {
      const raster = await renderRaster(excalidraw, args);
      assertCurrentPreviewThumbnailGeneration(generation);
      return raster;
    } catch {
      assertCurrentPreviewThumbnailGeneration(generation);
      // Keep the vector if the canvas cannot be encoded.
    }
  }
  return vector;
};
