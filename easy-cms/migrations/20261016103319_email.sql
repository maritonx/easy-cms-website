-- Easy CMS migration 20261016103319_email (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_email_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`message` text,
	`attempts` real,
	`next_attempt_at` text,
	`state` text,
	`error` text
);

--> statement-breakpoint
CREATE INDEX `ecms_email_deliveries_created_at_idx` ON `ecms_email_deliveries` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_email_deliveries_next_attempt_at_idx` ON `ecms_email_deliveries` (`next_attempt_at`);
--> statement-breakpoint
CREATE INDEX `ecms_email_deliveries_state_idx` ON `ecms_email_deliveries` (`state`);
