import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/**/*.test.ts",
      "services/**/*.test.ts",
      "chain/**/*.test.ts",
      "tests/**/*.test.ts"
    ],
    testTimeout: 15000,
    coverage: { enabled: false }
  }
});
