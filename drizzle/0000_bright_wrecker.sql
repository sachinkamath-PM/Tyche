CREATE TABLE `cover_letters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text DEFAULT 'anonymous' NOT NULL,
	`resume_id` integer NOT NULL,
	`job_title` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_cover_letters_user_resume` ON `cover_letters` (`user_id`,`resume_id`);--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text DEFAULT 'anonymous' NOT NULL,
	`title` text NOT NULL,
	`filename` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`focus` text DEFAULT 'Unsorted' NOT NULL,
	`ats_score` integer,
	`parent_resume_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resumes_object_key_unique` ON `resumes` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_resumes_user_updated` ON `resumes` (`user_id`,`updated_at`);