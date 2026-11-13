-- Easy CMS migration 20261113155433_contact_form (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_forms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text,
	`slug` text,
	`fields` text,
	`submit_label` text,
	`confirmation_type` text,
	`confirmation_message` text,
	`redirect_url` text
);

--> statement-breakpoint
CREATE INDEX `ecms_forms_status_idx` ON `ecms_forms` (`status`);
--> statement-breakpoint
CREATE INDEX `ecms_forms_created_at_idx` ON `ecms_forms` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_forms_slug_unique` ON `ecms_forms` (`slug`);
--> statement-breakpoint
CREATE TABLE `ecms_forms__emails` (
	`id` text PRIMARY KEY NOT NULL,
	`_parent_id` integer NOT NULL,
	`_order` integer NOT NULL,
	`to` text,
	`cc` text,
	`bcc` text,
	`reply_to` text,
	`from` text,
	`subject` text,
	`message` text
);

--> statement-breakpoint
CREATE INDEX `ecms_forms__emails__parent_id_idx` ON `ecms_forms__emails` (`_parent_id`);
--> statement-breakpoint
CREATE TABLE `ecms_form_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`form` integer,
	`summary` text,
	`data` text,
	`locale` text,
	`page` text,
	`rate_key` text
);

--> statement-breakpoint
CREATE INDEX `ecms_form_submissions_created_at_idx` ON `ecms_form_submissions` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_form_submissions_form_idx` ON `ecms_form_submissions` (`form`);
--> statement-breakpoint
CREATE INDEX `ecms_form_submissions_rate_key_idx` ON `ecms_form_submissions` (`rate_key`);
