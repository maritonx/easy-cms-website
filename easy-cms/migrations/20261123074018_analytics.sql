-- Easy CMS migration 20261123074018_analytics (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_consent_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`consent_id` text,
	`analytics` integer,
	`marketing` integer,
	`version` text
);

--> statement-breakpoint
CREATE INDEX `ecms_consent_records_created_at_idx` ON `ecms_consent_records` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_consent_records_consent_id_idx` ON `ecms_consent_records` (`consent_id`);
