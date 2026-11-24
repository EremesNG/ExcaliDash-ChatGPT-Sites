import { describe, expect, it, vi } from "vitest";
import { SCENE_RASTER_IMAGE_ID } from "../src/utils/previewSvg";
import { renderPreviewSvg } from "../src/utils/renderPreview";

const scene = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `e${i}`,
    type: "rectangle",
    x: i,
    y: 0,
    width: 10,
    height: 10,
  }));

const fakeCanvas = (dataUrl = "data:image/webp;base64,AAAA") => ({
  width: 640,
  height: 400,
  toDataURL: vi.fn(() => dataUrl),
});

const exports = (svg = "<svg>vector</svg>", canvas = fakeCanvas()) => ({
  exportScene: vi.fn(async ({ type }) => type === "canvas" ? canvas : { outerHTML: svg }) as any,
});

describe("renderPreviewSvg", () => {
  it("keeps small scenes as vector SVG", async () => {
    const ex = exports();
    const out = await renderPreviewSvg(ex, {
      elements: scene(10),
      appState: {},
      files: {},
    });
    expect(out).toBe("<svg>vector</svg>");
    expect(ex.exportScene.mock.calls.map(([opts]) => opts.type)).toEqual(["svg"]);
  });

  it("rasterizes large scenes into a single tagged image", async () => {
    const ex = exports();
    const out = await renderPreviewSvg(ex, {
      elements: scene(1500),
      appState: {},
      files: {},
    });
    expect(ex.exportScene).toHaveBeenCalledOnce();
    expect(ex.exportScene).toHaveBeenCalledWith(
      expect.objectContaining({ type: "canvas", config: expect.objectContaining({ maxWidthOrHeight: 640 }) }),
    );
    expect(out).toContain(`id="${SCENE_RASTER_IMAGE_ID}"`);
    expect(out).toContain('href="data:image/webp;base64,AAAA"');
    expect(out).toContain('viewBox="0 0 640 400"');
  });

  it("ignores deleted elements when choosing the path", async () => {
    const ex = exports();
    const elements = scene(1500).map((el, i) => ({
      ...el,
      isDeleted: i >= 100,
    }));
    await renderPreviewSvg(ex, { elements, appState: {}, files: {} });
    expect(ex.exportScene.mock.calls.map(([opts]) => opts.type)).toEqual(["svg"]);
  });

  it("rasterizes an oversized vector preview", async () => {
    const ex = exports(`<svg>${"x".repeat(600 * 1024)}</svg>`);
    const out = await renderPreviewSvg(ex, {
      elements: scene(10),
      appState: {},
      files: {},
    });
    expect(out).toContain(SCENE_RASTER_IMAGE_ID);
  });

  it("falls back to vector when the canvas cannot be encoded", async () => {
    const canvas = fakeCanvas();
    canvas.toDataURL.mockImplementation(() => {
      throw new DOMException("tainted", "SecurityError");
    });
    const ex = exports("<svg>vector</svg>", canvas);
    const out = await renderPreviewSvg(ex, {
      elements: scene(1500),
      appState: {},
      files: {},
    });
    expect(out).toBe("<svg>vector</svg>");
  });
});
