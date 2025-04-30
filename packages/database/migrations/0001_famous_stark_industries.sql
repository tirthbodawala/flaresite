DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `users` ADD `deleted_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email_deleted_unique` ON `users` (`email`,`deleted_at`);