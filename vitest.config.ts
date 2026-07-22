import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    environmentMatchGlobs: [["src/ui/content/**", "jsdom"]],
    clearMocks: true,
  },
});
