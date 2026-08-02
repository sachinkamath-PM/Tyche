import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const resumes = sqliteTable("resumes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().default("anonymous"),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  objectKey: text("object_key").notNull().unique(),
  contentType: text("content_type").notNull(),
  fileSize: integer("file_size").notNull(),
  focus: text("focus").notNull().default("Unsorted"),
  atsScore: integer("ats_score"),
  parentResumeId: integer("parent_resume_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_resumes_user_updated").on(table.userId, table.updatedAt)]);

export const coverLetters = sqliteTable("cover_letters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().default("anonymous"),
  resumeId: integer("resume_id").notNull().references(() => resumes.id),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull().default(""),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_cover_letters_user_resume").on(table.userId, table.resumeId)]);
