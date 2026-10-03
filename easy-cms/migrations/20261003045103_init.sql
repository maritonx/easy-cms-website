-- Easy CMS migration 20261003045103_init (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`email` text,
	`name` text,
	`role` text,
	`active` integer,
	`password_hash` text
);

--> statement-breakpoint
CREATE INDEX `ecms_users_created_at_idx` ON `ecms_users` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_users_email_unique` ON `ecms_users` (`email`);
--> statement-breakpoint
CREATE TABLE `ecms_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`filename` text,
	`original_name` text,
	`mime_type` text,
	`filesize` real,
	`width` real,
	`height` real,
	`sizes` text,
	`alt` text
);

--> statement-breakpoint
CREATE INDEX `ecms_media_created_at_idx` ON `ecms_media` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_media_filename_unique` ON `ecms_media` (`filename`);
--> statement-breakpoint
CREATE TABLE `ecms_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text,
	`slug` text,
	`excerpt` text,
	`category` text,
	`published_at` text,
	`author` text,
	`cover_text` text,
	`cover` integer,
	`featured` integer,
	`body` text
);

--> statement-breakpoint
CREATE INDEX `ecms_posts_status_idx` ON `ecms_posts` (`status`);
--> statement-breakpoint
CREATE INDEX `ecms_posts_created_at_idx` ON `ecms_posts` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_posts_slug_unique` ON `ecms_posts` (`slug`);
--> statement-breakpoint
CREATE INDEX `ecms_posts_cover_idx` ON `ecms_posts` (`cover`);
--> statement-breakpoint
CREATE TABLE `ecms_releases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`version` text,
	`title` text,
	`date` text,
	`kind` text,
	`summary` text,
	`needs_migration` integer
);

--> statement-breakpoint
CREATE INDEX `ecms_releases_status_idx` ON `ecms_releases` (`status`);
--> statement-breakpoint
CREATE INDEX `ecms_releases_created_at_idx` ON `ecms_releases` (`created_at`);
--> statement-breakpoint
CREATE TABLE `ecms_releases__changes` (
	`id` text PRIMARY KEY NOT NULL,
	`_parent_id` integer NOT NULL,
	`_order` integer NOT NULL,
	`text` text
);

--> statement-breakpoint
CREATE INDEX `ecms_releases__changes__parent_id_idx` ON `ecms_releases__changes` (`_parent_id`);
--> statement-breakpoint
CREATE TABLE `ecms_releases__packages` (
	`id` text PRIMARY KEY NOT NULL,
	`_parent_id` integer NOT NULL,
	`_order` integer NOT NULL,
	`name` text
);

--> statement-breakpoint
CREATE INDEX `ecms_releases__packages__parent_id_idx` ON `ecms_releases__packages` (`_parent_id`);
--> statement-breakpoint
CREATE TABLE `ecms_showcase` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`name` text,
	`url` text,
	`description` text,
	`image` integer,
	`order` real
);

--> statement-breakpoint
CREATE INDEX `ecms_showcase_status_idx` ON `ecms_showcase` (`status`);
--> statement-breakpoint
CREATE INDEX `ecms_showcase_created_at_idx` ON `ecms_showcase` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_showcase_image_idx` ON `ecms_showcase` (`image`);
--> statement-breakpoint
CREATE TABLE `ecms_showcase__stack` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`_parent_id` integer NOT NULL,
	`_order` integer NOT NULL,
	`value` text
);

--> statement-breakpoint
CREATE INDEX `ecms_showcase__stack__parent_id_idx` ON `ecms_showcase__stack` (`_parent_id`);
--> statement-breakpoint
CREATE INDEX `ecms_showcase__stack_value_idx` ON `ecms_showcase__stack` (`value`);
--> statement-breakpoint
CREATE TABLE `ecms_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`token_hash` text,
	`user` integer,
	`expires_at` text
);

--> statement-breakpoint
CREATE INDEX `ecms_sessions_created_at_idx` ON `ecms_sessions` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_sessions_token_hash_unique` ON `ecms_sessions` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `ecms_sessions_user_idx` ON `ecms_sessions` (`user`);
--> statement-breakpoint
CREATE INDEX `ecms_sessions_expires_at_idx` ON `ecms_sessions` (`expires_at`);
--> statement-breakpoint
CREATE TABLE `ecms_login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`key` text
);

--> statement-breakpoint
CREATE INDEX `ecms_login_attempts_created_at_idx` ON `ecms_login_attempts` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_login_attempts_key_idx` ON `ecms_login_attempts` (`key`);
--> statement-breakpoint
CREATE TABLE `ecms_document_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`parent` text,
	`doc` real,
	`status` text,
	`latest` integer,
	`author` real,
	`snapshot` text
);

--> statement-breakpoint
CREATE INDEX `ecms_document_versions_created_at_idx` ON `ecms_document_versions` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_document_versions_parent_idx` ON `ecms_document_versions` (`parent`);
--> statement-breakpoint
CREATE INDEX `ecms_document_versions_doc_idx` ON `ecms_document_versions` (`doc`);
--> statement-breakpoint
CREATE INDEX `ecms_document_versions_latest_idx` ON `ecms_document_versions` (`latest`);
--> statement-breakpoint
CREATE TABLE `ecms_scheduled_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`parent` text,
	`doc` real,
	`action` text,
	`run_at` text,
	`state` text,
	`error` text,
	`author` real
);

--> statement-breakpoint
CREATE INDEX `ecms_scheduled_jobs_created_at_idx` ON `ecms_scheduled_jobs` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_scheduled_jobs_parent_idx` ON `ecms_scheduled_jobs` (`parent`);
--> statement-breakpoint
CREATE INDEX `ecms_scheduled_jobs_doc_idx` ON `ecms_scheduled_jobs` (`doc`);
--> statement-breakpoint
CREATE INDEX `ecms_scheduled_jobs_run_at_idx` ON `ecms_scheduled_jobs` (`run_at`);
--> statement-breakpoint
CREATE INDEX `ecms_scheduled_jobs_state_idx` ON `ecms_scheduled_jobs` (`state`);
--> statement-breakpoint
CREATE TABLE `ecms_globals` (
	`slug` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`status` text,
	`updated_at` text NOT NULL
);

