import { desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { resumes } from "../../../db/schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function userId(request: Request) {
  return request.headers.get("oai-authenticated-user-id") ?? "anonymous";
}

export async function GET(request: Request) {
  const rows = await getDb().select().from(resumes).where(eq(resumes.userId, userId(request))).orderBy(desc(resumes.updatedAt)).limit(100);
  return Response.json({ resumes: rows });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "A resume file is required." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) return Response.json({ error: "Upload a PDF or DOCX up to 10 MB." }, { status: 400 });

  const owner = userId(request);
  const key = `${owner}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  await env.RESUMES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  try {
    const [record] = await getDb().insert(resumes).values({
      userId: owner,
      title: String(form.get("title") || file.name),
      filename: file.name,
      objectKey: key,
      contentType: file.type,
      fileSize: file.size,
    }).returning();
    return Response.json({ resume: record }, { status: 201 });
  } catch (error) {
    await env.RESUMES.delete(key);
    throw error;
  }
}
