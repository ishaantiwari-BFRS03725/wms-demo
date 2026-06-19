# SPA Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate from TanStack Start (SSR) to plain TanStack Router (SPA) so the app can be served as static files via nginx — no Node.js server required.

**Architecture:** Remove `@tanstack/react-start` and its Nitro SSR layer entirely. Wire up a standard Vite + `@tanstack/react-router` SPA with a `src/main.tsx` entry point and a root `index.html`. Serve built `dist/` via nginx in Docker.

**Tech Stack:** Vite 7, React 19, TanStack Router v1, Tailwind v4, nginx:alpine, Docker multi-stage build.

## Global Constraints

- All 70+ route files in `src/routes/` are untouched.
- All mock data in `src/lib/wms/` is untouched.
- All components in `src/components/` are untouched.
- `src/router.tsx` is untouched.
- No new runtime dependencies — only removals.
- Build output goes to `dist/` (standard Vite default).

---

### Task 1: Delete SSR-only files and remove SSR dependencies

**Files:**
- Delete: `src/server.ts`
- Delete: `src/start.ts`
- Delete: `src/lib/error-page.ts`
- Delete: `src/lib/error-capture.ts`
- Delete: `src/lib/config.server.ts`
- Delete: `src/lib/api/example.functions.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: cleaned `package.json` with no `@tanstack/react-start`, `@lovable.dev/vite-tanstack-config`, or `nitro` entries; none of the deleted files are imported anywhere in the remaining codebase.

- [ ] **Step 1: Delete the six SSR-only source files**

```bash
rm src/server.ts src/start.ts src/lib/error-page.ts src/lib/error-capture.ts src/lib/config.server.ts src/lib/api/example.functions.ts
```

- [ ] **Step 2: Remove SSR packages from package.json**

Open `package.json`. In `dependencies`, remove the line:
```
"@tanstack/react-start": "...",
```
In `devDependencies`, remove these two lines:
```
"@lovable.dev/vite-tanstack-config": "...",
"nitro": "...",
```
Also remove the `"build:server"` script (it's an alias for the SSR build; after migration `build` covers everything):
```json
"build:dev": "vite build --mode development",
"preview": "vite preview",
```
Remove only `"build:server": "vite build",` — leave all other scripts intact.

- [ ] **Step 3: Reinstall to sync the lockfile**

```bash
npm install
```

Expected: lockfile updates, no errors. The three removed packages are no longer listed in `node_modules`.

- [ ] **Step 4: Verify no remaining imports of deleted files**

```bash
grep -r "react-start\|error-page\|error-capture\|config\.server\|example\.functions\|start\.ts\|server\.ts" src/ --include="*.ts" --include="*.tsx"
```

Expected: no output (zero matches).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git rm src/server.ts src/start.ts src/lib/error-page.ts src/lib/error-capture.ts src/lib/config.server.ts src/lib/api/example.functions.ts
git commit -m "chore: remove TanStack Start SSR layer and server-only files"
```

---

### Task 2: Replace vite.config.ts

**Files:**
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: `@vitejs/plugin-react`, `@tanstack/router-plugin/vite`, `@tailwindcss/vite`, `vite-tsconfig-paths` — all already in `devDependencies`.
- Produces: standard Vite config that outputs to `dist/` on `vite build`.

- [ ] **Step 1: Replace vite.config.ts entirely**

Overwrite `vite.config.ts` with:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss(), tsconfigPaths()],
  server: { allowedHosts: true },
});
```

- [ ] **Step 2: Verify the config parses**

```bash
npx vite --version
```

Expected: prints the Vite version with no import errors.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "chore: replace lovable vite config with standard vite + tanstack router plugin"
```

---

### Task 3: Create index.html and src/main.tsx

**Files:**
- Create: `index.html` (project root)
- Create: `src/main.tsx`

**Interfaces:**
- Produces: Vite SPA entry point. `index.html` references `src/main.tsx` which renders `<RouterProvider>` into `#root`.
- Consumes: `getRouter()` from `src/router.tsx` (unchanged).

- [ ] **Step 1: Create index.html at the project root**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shiprocket WMS</title>
    <meta name="description" content="Shiprocket Warehouse Management System" />
    <meta name="author" content="Shiprocket" />
    <meta property="og:title" content="Shiprocket WMS" />
    <meta property="og:description" content="Shiprocket Warehouse Management System" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create src/main.tsx**

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

- [ ] **Step 3: Commit**

```bash
git add index.html src/main.tsx
git commit -m "chore: add SPA entry point (index.html + main.tsx)"
```

---

### Task 4: Update src/routes/__root.tsx

**Files:**
- Modify: `src/routes/__root.tsx`

**Interfaces:**
- Consumes: `src/styles.css` (imported directly, not as `?url`).
- Produces: a plain React root route with no SSR APIs. `RootComponent` renders `<QueryClientProvider>` + `<Outlet>` + `<Toaster>` directly. `NotFoundComponent` and `ErrorComponent` are unchanged.

The current file uses these SSR-only TanStack Start APIs that must be removed:
- `HeadContent` — renders SSR head tags; not needed in SPA (head is in `index.html`)
- `Scripts` — injects hydration scripts; not needed in SPA
- `shellComponent` — wraps full `<html>` document; not needed in SPA
- `head()` — sets meta/link tags via SSR; replaced by `index.html` head content
- `import appCss from "../styles.css?url"` — SSR CSS URL injection; replaced by direct import

- [ ] **Step 1: Rewrite __root.tsx**

Replace the entire file content with:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import "../styles.css";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={4000}
        toastOptions={{ classNames: { toast: "min-w-[320px] text-sm" } }}
      />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Start dev server and spot-check**

```bash
npm run dev
```

Open `http://localhost:3000` (or whichever port Vite picks). Navigate to `/orders` and one dynamic route like `/orders/ORD-001` — both should render without a blank screen or console errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "chore: remove SSR shell/head APIs from root route, import CSS directly"
```

---

### Task 5: Add nginx.conf and update Dockerfile

**Files:**
- Create: `nginx.conf` (project root)
- Modify: `Dockerfile`

**Interfaces:**
- Produces: a two-stage Docker build where the builder runs `npm run build` → `dist/`, and the runner is `nginx:alpine` serving `dist/` with SPA fallback routing. nginx listens on port 80.

- [ ] **Step 1: Create nginx.conf at the project root**

Create `nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
}
```

- [ ] **Step 2: Replace Dockerfile**

Overwrite `Dockerfile` with:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Verify the build produces dist/**

```bash
npm run build
```

Expected: `dist/` directory created containing `index.html` and hashed JS/CSS assets. No errors.

- [ ] **Step 4: Commit**

```bash
git add nginx.conf Dockerfile
git commit -m "chore: replace Node SSR container with nginx static file server"
```

---

### Task 6: Update docker-compose.yml and k8s/deployment.yaml

**Files:**
- Modify: `docker-compose.yml`
- Modify: `k8s/deployment.yaml`

**Interfaces:**
- Produces: docker-compose maps host port 3000 to container port 80. k8s deployment declares containerPort 80. k8s Service's targetPort is 80. Health probes hit port 80 (path `/` unchanged).

- [ ] **Step 1: Update docker-compose.yml**

In `docker-compose.yml`, make these changes:

Change port mapping from:
```yaml
ports:
  - "3000:3000"
```
to:
```yaml
ports:
  - "3000:80"
```

Change healthcheck from:
```yaml
test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
```
to:
```yaml
test: ["CMD", "wget", "-qO-", "http://localhost/"]
```

- [ ] **Step 2: Update k8s/deployment.yaml**

Change `containerPort` from:
```yaml
ports:
  - containerPort: 3000
```
to:
```yaml
ports:
  - containerPort: 80
```

Change the Service's `targetPort` from:
```yaml
ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```
to:
```yaml
ports:
  - protocol: TCP
    port: 80
    targetPort: 80
```

Liveness and readiness probe `port:` fields also need updating from `3000` to `80`:
```yaml
livenessProbe:
  httpGet:
    path: /
    port: 80
readinessProbe:
  httpGet:
    path: /
    port: 80
```

- [ ] **Step 3: Smoke-test with docker compose**

```bash
docker compose build && docker compose up -d
```

Then:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

Expected: `200`

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/orders
```

Expected: `200` (nginx SPA fallback serves index.html for unknown paths)

```bash
docker compose down
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml k8s/deployment.yaml
git commit -m "chore: update docker-compose and k8s manifests to target nginx port 80"
```
