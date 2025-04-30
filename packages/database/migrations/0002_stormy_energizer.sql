ALTER TABLE `organizations` ADD `updated_at` text DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `organizations` ADD `deleted_at` text;