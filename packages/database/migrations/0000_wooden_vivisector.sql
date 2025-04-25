CREATE TABLE `content_meta` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text,
	`meta_key` text NOT NULL,
	`meta_value` text,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_content_meta_key` ON `content_meta` (`content_id`,`meta_key`);--> statement-breakpoint
CREATE TABLE `content_taxonomies` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text,
	`taxonomy_id` text,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taxonomy_id`) REFERENCES `taxonomies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `content` (
	`id` text PRIMARY KEY NOT NULL,
	`short_id` text NOT NULL,
	`type` text DEFAULT 'post' NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text,
	`status` text DEFAULT 'draft',
	`author_id` text,
	`deleted_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`published_at` text,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_short_id_unique` ON `content` (`short_id`);--> statement-breakpoint
CREATE INDEX `idx_content_slug` ON `content` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_content_author_id` ON `content` (`author_id`);--> statement-breakpoint
CREATE TABLE `media_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`media_id` text,
	`parent_id` text NOT NULL,
	`parent_table` text NOT NULL,
	`role` text,
	`created_by` text,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_media_attachments_parent` ON `media_attachments` (`parent_id`,`parent_table`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`file_path` text NOT NULL,
	`mime_type` text NOT NULL,
	`alt_text` text,
	`width` integer,
	`height` integer,
	`size` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`created_by` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`menu_id` text NOT NULL,
	`label` text NOT NULL,
	`url` text,
	`parent_id` text,
	`position` integer DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX `idx_menu_items_menu_id` ON `menu_items` (`menu_id`);--> statement-breakpoint
CREATE TABLE `menus` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `menus_name_unique` ON `menus` (`name`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`url` text NOT NULL,
	`contact_email` text,
	`contact_phone` text,
	`address` text,
	`social_links` text,
	`json_ld` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text,
	`revision_content` text NOT NULL,
	`revised_by` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`revised_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `seo` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text,
	`meta_title` text,
	`meta_description` text,
	`canonical_url` text,
	`meta_keywords` text,
	`og_title` text,
	`og_description` text,
	`og_image` text,
	`twitter_card` text,
	`schema_type` text,
	`schema_headline` text,
	`schema_description` text,
	`schema_image` text,
	`override_json_ld` text,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seo_content_id_unique` ON `seo` (`content_id`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`site_name` text NOT NULL,
	`site_url` text NOT NULL,
	`site_logo` text,
	`type` text DEFAULT 'Organization',
	`organization_id` text,
	`json_ld` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `taxonomies` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`parent_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `taxonomies_slug_unique` ON `taxonomies` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_taxonomies_slug` ON `taxonomies` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'subscriber',
	`first_name` text,
	`last_name` text,
	`json_ld` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);