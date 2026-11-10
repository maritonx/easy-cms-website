-- Easy CMS migration 20261110070045_easy_cms_1_42 (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_email_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`to` text,
	`cc` text,
	`bcc` real,
	`subject` text,
	`tag` text,
	`state` text,
	`attempts` real,
	`error` text,
	`adapter` text,
	`sent_at` text,
	`provider_id` text,
	`delivery` text,
	`delivery_at` text
);

--> statement-breakpoint
CREATE INDEX `ecms_email_log_created_at_idx` ON `ecms_email_log` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_email_log_tag_idx` ON `ecms_email_log` (`tag`);
--> statement-breakpoint
CREATE INDEX `ecms_email_log_state_idx` ON `ecms_email_log` (`state`);
--> statement-breakpoint
CREATE INDEX `ecms_email_log_provider_id_idx` ON `ecms_email_log` (`provider_id`);
--> statement-breakpoint
CREATE INDEX `ecms_email_log_delivery_idx` ON `ecms_email_log` (`delivery`);
--> statement-breakpoint
CREATE TABLE `ecms_email_suppressions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`address` text,
	`reason` text,
	`detail` text,
	`source` text
);

--> statement-breakpoint
CREATE INDEX `ecms_email_suppressions_created_at_idx` ON `ecms_email_suppressions` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_email_suppressions_address_unique` ON `ecms_email_suppressions` (`address`);
--> statement-breakpoint
CREATE TABLE `ecms_admin_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`key` text,
	`value` text
);

--> statement-breakpoint
CREATE INDEX `ecms_admin_settings_created_at_idx` ON `ecms_admin_settings` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_admin_settings_key_unique` ON `ecms_admin_settings` (`key`);
--> statement-breakpoint
ALTER TABLE `ecms_database_backups` ADD `copies` text;
