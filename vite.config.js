import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

function includeHtmlPartials() {
  const includePattern = /<include\s+src="([^"]+)"\s*><\/include>/g;

  function resolveIncludes(html, htmlFilePath, seen = new Set()) {
    return html.replace(includePattern, (_, includeSrc) => {
      const includeFilePath = path.resolve(path.dirname(htmlFilePath), includeSrc);
      if (seen.has(includeFilePath)) {
        throw new Error(`Circular include detected: ${includeFilePath}`);
      }
      if (!fs.existsSync(includeFilePath)) {
        throw new Error(`Include file not found: ${includeFilePath}`);
      }
      const includeContent = fs.readFileSync(includeFilePath, "utf8");
      const nextSeen = new Set(seen);
      nextSeen.add(includeFilePath);
      return resolveIncludes(includeContent, includeFilePath, nextSeen);
    });
  }

  return {
    name: "html-partial-include",
    transformIndexHtml(html, ctx) {
      if (!ctx?.filename) {
        return html;
      }
      return resolveIncludes(html, ctx.filename);
    }
  };
}

function getHtmlInputs() {
  const pagesDir = path.resolve("src/pages");
  if (!fs.existsSync(pagesDir)) {
    return {};
  }

  const htmlFiles = fs
    .readdirSync(pagesDir)
    .filter((fileName) => fileName.endsWith(".html"));

  return Object.fromEntries(
    htmlFiles.map((fileName) => [fileName.replace(/\.html$/, ""), path.resolve(pagesDir, fileName)])
  );
}

export default defineConfig({
  root: "src/pages",
  plugins: [includeHtmlPartials()],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: getHtmlInputs()
    }
  }
});
