# Tyche

Tyche is a local-first career workspace for creating ATS-ready resumes, tailoring them to job descriptions, organizing role-specific variants, and producing cover letters. The same React product surface builds as both the BuildQuick web product and a standalone Windows application.

## Run locally

Requirements: Node.js 22 or newer.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Production build

```bash
pnpm build
pnpm start
```

The app uses Next.js standalone output and can run on any Node-compatible host, including a VPS, Railway, Render, AWS, Google Cloud, Azure, or a Docker container. It can also be adapted for Vercel.

## Windows desktop application

The Windows edition has no cloud data dependency. It stores original uploads and application records under:

```text
%LOCALAPPDATA%\BuildQuick\Tyche\
├── tyche.db
└── uploads\
```

PDF, DOCX, and UTF-8 TXT extraction happens inside the desktop process. ATS scoring is deterministic and runs on-device. The desktop runtime rejects non-local network requests, does not load remote analytics, and exposes only a narrow IPC bridge to the renderer.

Build and open the local desktop application:

```bash
pnpm desktop:preview
```

Create the Windows installer:

```bash
pnpm desktop:make
```

The installer is written to `release/Tyche-Setup-<version>.exe`. A production release should add an Authenticode certificate before public distribution.

### Docker

```bash
docker build -t tyche .
docker run -p 3000:3000 tyche
```

## Storage

The web demo keeps local resume metadata in browser storage and does not upload original files. The Windows application retains the original bytes in its local uploads folder, records a SHA-256 checksum, and stores structured resume records in SQLite using WAL journaling and atomic file moves.

Hosted persistence is deliberately absent from this edition. If BuildQuick later adds accounts or cloud sync, that must be introduced as an explicit web storage adapter without changing the desktop-local default.

## Shared web and desktop development

Product UI changes belong in `app/` and automatically reach both targets. Desktop-only filesystem, database, and process code belongs in `desktop/`. `next.config.ts` selects a standalone server build for the web target and a static export for the Electron target.

Keep domain calculations in shared TypeScript where they do not require privileged access. Add privileged local capabilities through the typed bridge declared in `app/desktop-bridge.d.ts`; do not import Node modules into React components.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the runtime boundaries and update workflow.

## AI integration

Resume extraction and ATS scoring require no external model. Any future cloud-AI integration must be separately opt-in because sending resume or job-description text to a provider would no longer be fully local processing. Never expose model API keys to the browser.
