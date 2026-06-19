// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Force Nitro to output a self-contained Node.js server (.output/server/index.mjs)
  // for Docker/self-hosted deployments. Without this, @lovable.dev/vite-tanstack-config
  // skips its Nitro plugin outside the Lovable sandbox and outputs to dist/ instead.
  // The Cloudflare build path is unaffected: when isSandbox=true the plugin forcibly
  // resets the preset to "cloudflare-module" regardless of what is set here.
  nitro: { preset: "node-server" },
  vite: {
    server: {
      // Allow ngrok / tunnels and any other external host to hit the dev server
      // without Vite rejecting the request.
      allowedHosts: true,
    },
  },
});
