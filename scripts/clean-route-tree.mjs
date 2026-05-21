import fs from "node:fs";
import path from "node:path";

const routeTreePath = path.resolve(process.cwd(), "src/routeTree.gen.js");

if (!fs.existsSync(routeTreePath)) {
  process.exit(0);
}

const source = fs.readFileSync(routeTreePath, "utf8");
const withoutTypeImports = source.replace(/^import type .*$/gm, "");
const cleaned = withoutTypeImports.replace(
  /declare module ['\"]@tanstack\/react-start['\"][\s\S]*?\n\}/m,
  "",
);

if (cleaned !== source) {
  fs.writeFileSync(routeTreePath, cleaned, "utf8");
}