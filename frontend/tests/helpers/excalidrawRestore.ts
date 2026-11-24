import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

// The browser package contains extensionless ESM imports that native Node
// cannot resolve. Bundle its public restore export, not a copy of its logic.
export const loadExcalidrawRestore = async () => {
  const { outputFiles } = await build({
    stdin: {
      contents: 'export { restoreAppState } from "@excalidraw/excalidraw";',
      resolveDir: fileURLToPath(new URL("../../", import.meta.url)),
    },
    bundle: true,
    write: false,
    format: "cjs",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
  });
  // Keep the package's required browser globals out of the test environment.
  const module = { exports: {} };
  runInNewContext(outputFiles[0].text, {
    module,
    DOMException,
    crypto,
    TextEncoder,
    TextDecoder,
    Element: class {},
    window: {},
    document: {},
    navigator: {},
  });
  return module.exports as Pick<typeof import("@excalidraw/excalidraw"), "restoreAppState">;
};
