-- Easy CMS migration 20261030154612_easy_cms_1_25 (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_bulk_operations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`collection` text,
	`action` text,
	`query` text,
	`folder` text,
	`transfer_to` text,
	`user` text,
	`state` text,
	`total` real,
	`done` real,
	`skipped` real,
	`failed` real,
	`after` text,
	`problems` text,
	`error` text,
	`lease_until` text,
	`finished_at` text
);

--> statement-breakpoint
CREATE INDEX `ecms_bulk_operations_created_at_idx` ON `ecms_bulk_operations` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_bulk_operations_user_idx` ON `ecms_bulk_operations` (`user`);
--> statement-breakpoint
CREATE INDEX `ecms_bulk_operations_state_idx` ON `ecms_bulk_operations` (`state`);
