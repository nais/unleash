import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Global test timeout (15 seconds for integration tests)
    testTimeout: 15000,
    hookTimeout: 15000,

    // Enable globals (describe, it, expect, vi, etc.)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },

    // Resolve workspace aliases
    alias: {
      "@nais/unleash-shared": path.resolve(
        __dirname,
        "packages/shared/src/index.ts",
      ),
    },

    // Inline deps to handle CJS/ESM interop correctly
    deps: {
      interopDefault: true,
    },
  },
});
