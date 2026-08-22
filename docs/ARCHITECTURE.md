# Tyche web and Windows architecture

## One product surface

Tyche keeps one React/Next.js application in `app/`. The normal build produces the BuildQuick-hosted web application. A desktop build sets `TYCHE_DESKTOP=1`, producing the same routes as a static export in `out/`.

The Electron main process serves that export from a random loopback port. The renderer is sandboxed with Node integration disabled. Navigation, new windows, and requests outside that exact loopback origin are blocked.

## Runtime boundary

```text
Shared React UI
    |
    | window.tycheDesktop (desktop only)
    v
Sandboxed preload bridge
    |
    | allowlisted IPC calls
    v
Electron main process
    |-- SQLite metadata and extracted claims
    |-- original PDF/DOCX/TXT files
    `-- local document extraction
```

The public web build has no desktop bridge and falls back to browser-local metadata. This prevents a web deployment from silently writing uploads to a BuildQuick server.

## Local data contract

Desktop data lives under `%LOCALAPPDATA%\BuildQuick\Tyche`:

- `tyche.db` stores resume metadata, extracted claims, checksums, scores, and update timestamps.
- `uploads/` stores original files using internal ids rather than user-controlled paths.
- uploads are bounded to 10 MB, checked by extension and signature, written to a temporary file, and atomically renamed.
- each original file receives a SHA-256 digest recorded in SQLite.

No application content is sent over the network. The desktop runtime cancels all requests except its own random `127.0.0.1` origin.

## Updating both editions

1. Make product interface and shared calculation changes in `app/`.
2. Put Windows-only persistence or OS integrations in `desktop/`.
3. Extend `app/desktop-bridge.d.ts` and `desktop/preload.cjs` together when adding an IPC capability.
4. Run `pnpm test`.
5. Run `pnpm build` for the web target.
6. Run `pnpm desktop:build-ui` for the desktop target.
7. Run `pnpm desktop:make` only for a release candidate.

Every pull request should validate steps 4–6. A release tag can deploy the web build and produce the Windows installer from the same commit, preventing copied UI or domain logic from drifting.

## Planned production hardening

- Add a BuildQuick Windows icon and Authenticode code-signing certificate.
- Add schema-versioned migrations as the SQLite model expands.
- Add export, deletion, and backup/restore controls in the interface.
- Add encrypted-at-rest storage as an optional policy using a key protected by Windows credentials.
- Keep any future cloud assistant disabled by default and visibly separate from local processing.
