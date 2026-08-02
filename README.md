# Tyche

Tyche is a standalone Next.js web application for creating ATS-ready resumes, tailoring them to job descriptions, organizing role-specific variants, and producing cover letters.

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

The app uses Next.js standalone output and can run on any Node-compatible host, including a VPS, Railway, Render, AWS, Google Cloud, Azure, or a Docker container. It can also be adapted for Vercel.

### Docker

```bash
docker build -t tyche .
docker run -p 3000:3000 -v tyche-data:/app/.data tyche
```

## Storage

The included development adapter stores uploaded resumes in `.data/uploads` and keeps metadata in a JSON index. This makes the project fully independent for local development and traditional server hosting. Mount `.data` as a persistent volume when deploying with Docker, Railway, Render, or a VPS.

Before a horizontally scaled or serverless production launch, replace `lib/resume-storage.ts` with an object-storage and database adapter such as:

- AWS S3 + PostgreSQL
- Cloudflare R2 + PostgreSQL
- Supabase Storage + Postgres
- Azure Blob Storage + Azure Database for PostgreSQL

The UI and upload API do not need to change when the adapter is replaced.

## AI integration

ATS evaluation, resume tailoring, and cover-letter generation currently demonstrate the full product workflow. Connect those actions to your preferred model through server-side API routes before production launch. Never expose model API keys to the browser.
