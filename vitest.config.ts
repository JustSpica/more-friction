import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    environmentMatchGlobs: [["src/content/**", "jsdom"]],
    clearMocks: true,
  },
});
