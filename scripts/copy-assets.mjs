// Copies non-TypeScript assets into dist/ after `tsc` runs.
// tsc only emits .js from src/**/*.ts; static files (html, css, json manifest,
// DNR rule sets) must be placed next to the compiled code with the same layout
// the manifest references. No bundler, so this keeps paths predictable.
import { cp, mkdir, readdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(projectRoot, "src");
const distDir = join(projectRoot, "dist");

const ASSET_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
]);

async function copySrcAssets(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      await copySrcAssets(absolute);
      continue;
    }
    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    if (!ASSET_EXTENSIONS.has(extension)) continue;
    const target = join(distDir, relative(srcDir, absolute));
    await mkdir(dirname(target), { recursive: true });
    await copyFile(absolute, target);
  }
}

async function main() {
  await mkdir(distDir, { recursive: true });
  await copyFile(join(projectRoot, "manifest.json"), join(distDir, "manifest.json"));

  const rulesDir = join(projectRoot, "rules");
  if (existsSync(rulesDir)) {
    await cp(rulesDir, join(distDir, "rules"), { recursive: true });
  }

  await copySrcAssets(srcDir);
  console.log("copy-assets: static files copied to dist/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
