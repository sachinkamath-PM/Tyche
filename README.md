# Tyche

Tyche is a browser-based career workspace for organising resume variants, checking ATS readiness, tailoring a resume to a job description, drafting cover-letter records, and reviewing contextual copilot suggestions.

The current repository is an interactive product MVP. It demonstrates the complete user journey with local demo data and deterministic rules; it does not yet parse resume content, call a language model, or provide a production applicant account.

## Who it is for

- Job seekers who want a clearer workflow for managing role-specific resumes.
- Product and design teams validating ATS, tailoring, and career-copilot experiences.
- Engineers extending the MVP with document parsing, durable storage, identity, and model-backed generation.

## What the MVP includes

- A dashboard with resume performance, recent activity, and guided next steps.
- A local resume library with role and focus filters.
- PDF, DOC, and DOCX selection with size and file-signature validation.
- A deterministic ATS evaluation experience and improvement report.
- Job-description-based resume variant creation.
- Cover-letter workflow and a session-level letter library.
- **Ask Tyche**, a contextual copilot with evidence-bound, reviewable resume edits.
- Stale-proposal protection before applying a copilot rewrite.
- Browser-local persistence for accepted resume metadata and claim edits.
- Responsive Next.js UI, production metadata, and a standalone Docker build.

## Typical user workflows

### Add and evaluate a resume

1. Select **Upload resume** and choose a supported file up to 10 MB.
2. Tyche verifies the file signature locally and saves only a metadata record.
3. Open **ATS evaluator**, choose the resume, and run the evaluation.
4. Review the readiness score and the deterministic improvement categories.

The file contents are not uploaded or stored by this MVP, and the current ATS result is illustrative rather than a real document analysis.

### Create a tailored version

1. Open **Tailor resume**.
2. Select a base resume and paste the target job description.
3. Create a role-specific version.
4. Return to **My resumes** to review the newly saved variant.

The current implementation copies the local resume record into a labelled variant. A production version still needs document parsing, evidence matching, and generated content.

### Review a copilot proposal

1. Open **Ask Tyche** from the current workspace.
2. Ask about ATS readiness, the target role, or a verified resume claim.
3. Review the source claim and proposed wording.
4. Apply only if the original claim still matches the proposal context.

Tyche refuses to draft a claim when the selected local upload has no verified experience text.

## Important product boundaries

- ATS scores and findings are deterministic demo outputs, not predictions of an employer's screening system.
- Original resume files are validated in the browser and then discarded; their contents are not extracted.
- Resume metadata is stored in `localStorage` on one browser only.
- Cover letters are session records; the MVP does not generate or export a letter document.
- No login, cloud sync, database, collaboration, email, job-board integration, or analytics.
- No external AI provider is called, and no API key is required.
- Do not use the demo as the only copy of application materials.

## Technology and architecture

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind PostCSS pipeline with product styling in `app/globals.css`
- Browser `localStorage` for accepted resume metadata
- Next.js standalone output for container deployment
- Node's built-in test runner for product-contract checks

```text
app/
  TycheApp.tsx       Main navigation, dashboard, and career workflows
  TycheCopilot.tsx   Contextual Q&A and reviewable claim proposals
  globals.css        Responsive product styles
  layout.tsx         Metadata and social sharing configuration
  page.tsx           Route entry and path selection
public/              Icons and social preview image
tests/               Local-data, upload-validation, and proposal-safety tests
Dockerfile           Multi-stage standalone Next.js image
```

## Run locally

### Requirements

- Node.js 22.13 or newer
- pnpm 11 through Corepack

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3000>.

No environment file is required for the current MVP. `NEXT_PUBLIC_APP_URL` is optional and only changes the metadata base URL used for social links.

## Validate changes

```bash
pnpm lint
pnpm test
pnpm build
```

The tests verify browser-local persistence, supported file signatures, demo-data labelling, safe copilot proposal application, and cover-letter workflow behaviour.

## Docker

```bash
docker build -t tyche .
docker run --rm -p 3000:3000 tyche
```

Open <http://localhost:3000>. The image runs as a non-root user and serves Next.js standalone output. The declared `.data` volume is reserved for a future server-side storage adapter; the current application still stores its accepted metadata in the visitor's browser.

## Path to production

Before treating Tyche as a production career service, add and validate:

1. User identity, consent, account recovery, and deletion.
2. Encrypted object storage for original documents and a durable metadata database.
3. Safe DOCX/PDF parsing, malware scanning, and retention controls.
4. Evidence-grounded ATS analysis and generation through server-side APIs.
5. Resume and cover-letter editing, preview, version history, and export.
6. Observability, rate limiting, accessibility testing, and deployment CI.

Keep model credentials and document-processing secrets on the server. Generated claims should remain traceable to user-provided evidence and require explicit review before they change a resume.

## Current status

Tyche is a functional product prototype for validating the end-to-end career workflow. It is not yet a production document processor, ATS evaluator, or AI writing service.
