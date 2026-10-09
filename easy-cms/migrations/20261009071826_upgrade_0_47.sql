-- Easy CMS migration 20261009071826_upgrade_0_47 (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_database_backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`state` text,
	`trigger` text,
	`filename` text,
	`size` real,
	`started_at` text,
	`finished_at` text,
	`error` text,
	`author` text,
	`downloaded_by` text,
	`downloaded_at` text
);

--> statement-breakpoint
CREATE INDEX `ecms_database_backups_created_at_idx` ON `ecms_database_backups` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_database_backups_state_idx` ON `ecms_database_backups` (`state`);
--> statement-breakpoint
CREATE INDEX `ecms_database_backups_started_at_idx` ON `ecms_database_backups` (`started_at`);
