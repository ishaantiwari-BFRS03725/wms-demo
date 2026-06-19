# Dockerfile Design — WMS Demo

**Date:** 2026-06-15
**Status:** Approved

## Goal

Containerize the WMS Demo (TanStack Start SSR + Nitro) as a production Node.js server image, while preserving the existing Cloudflare Workers build path for normal deployments.

## Architecture

Multi-stage Docker build:

1. **Builder stage** (`node:22-alpine`) — installs all dependencies and compiles the app with Nitro's `node-server` preset, producing `.output/`
2. **Runtime stage** (`node:22-alpine`) — copies only `.output/` from the builder; no source code, no dev dependencies

## Key Design Decisions

- **Dual build paths**: A new `build:server` npm script (`NITRO_PRESET=node-server vite build`) is added alongside the existing `build` script (Cloudflare). This keeps Cloudflare deployments untouched.
- **Nitro preset**: `node-server` produces `.output/server/index.mjs` — a self-contained Node.js HTTP server.
- **Port**: `3000` (Nitro default). Overridable at runtime via the `PORT` environment variable.

## Files Changed / Created

| File | Action |
|------|--------|
| `package.json` | Add `"build:server"` script |
| `Dockerfile` | Create (multi-stage) |
| `.dockerignore` | Create |

## Dockerfile Stages

```
Stage 1: builder
  FROM node:22-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build:server

Stage 2: runtime
  FROM node:22-alpine
  WORKDIR /app
  COPY --from=builder /app/.output ./.output
  EXPOSE 3000
  CMD ["node", ".output/server/index.mjs"]
```

## .dockerignore

Excludes: `node_modules`, `.output`, `.nitro`, `docs`, `artefacts`, `*.html` wireframes, `.git`

## Testing

Build verified by running `docker build -t wms-demo .` and confirming a zero exit code.
