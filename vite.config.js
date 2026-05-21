import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

const stripRouteTreeTypesPlugin = {
  name: "strip-route-tree-types",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith("routeTree.gen.js")) {
      return null;
    }

    // TanStack Start can append TS-only registration blocks even when routes are JS.
    const withoutTypeImports = code.replace(/^import type .*$/gm, "");
    const withoutDeclareModule = withoutTypeImports.replace(
      /declare module ['\"]@tanstack\/react-start['\"][\s\S]*?\n\}/m,
      "",
    );

    return {
      code: withoutDeclareModule,
      map: null,
    };
  },
};

// Redirect TanStack Start's bundled server entry to src/server.jsx (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this - wrangler.jsonc main alone is insufficient.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = {};
  for (const [key, value] of Object.entries(env)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define: envDefine,
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    server: { host: "::", port: 8080 },
    plugins: [
      tailwindcss(),
      tanstackStart({
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      react(),
      ...(command === "build" ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
      stripRouteTreeTypesPlugin,
    ],
  };
});
