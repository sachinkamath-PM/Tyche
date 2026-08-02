import { listResumes, saveResume } from "../../../lib/resume-storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function GET() {
  return Response.json({ resumes: await listResumes() });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "A resume file is required." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Upload a PDF or DOCX up to 10 MB." }, { status: 400 });
  }

  const resume = await saveResume({
    file,
    title: String(form.get("title") || file.name),
  });

  return Response.json({ resume }, { status: 201 });
}
