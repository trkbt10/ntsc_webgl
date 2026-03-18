import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => {
  // npm run build:lib  → library mode (npm publish)
  // npm run build:demo → demo page (GitHub Pages)
  if (mode === "lib") {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, "src/lib/index.ts"),
          formats: ["es"],
          fileName: "index",
        },
        outDir: "dist-lib",
      },
      plugins: [
        dts({
          tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
        }),
      ],
    };
  }

  // Default: demo page build
  return {
    base: "./",
    server: {
      fs: {
        allow: [resolve(__dirname, "..")],
      },
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
    assetsInclude: ["**/*.wasm"],
  };
});
