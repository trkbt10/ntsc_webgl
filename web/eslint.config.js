import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist/", "dist-lib/", "_build/", "public/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Timer/subscription patterns legitimately setState in effect init
      "react-hooks/set-state-in-effect": "off",
      // Not using React Compiler
      "react-hooks/preserve-manual-memoization": "off",
      // Existing hooks use ref-sync-in-render pattern (useCamera, useCanvasRecorder)
      "react-hooks/refs": "warn",
      // Pipeline object is mutable by design (onFpsUpdate callback)
      "react-hooks/immutability": "off",
    },
  },
);
