-- Easy CMS migration 20261123100244_ga4_server (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_analytics_hits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`event` text,
	`order` text,
	`body` text,
	`state` text,
	`attempts` real,
	`next_attempt_at` text,
	`error` text
);

--> statement-breakpoint
CREATE INDEX `ecms_analytics_hits_created_at_idx` ON `ecms_analytics_hits` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_analytics_hits_order_idx` ON `ecms_analytics_hits` (`order`);
--> statement-breakpoint
CREATE INDEX `ecms_analytics_hits_state_idx` ON `ecms_analytics_hits` (`state`);
--> statement-breakpoint
CREATE INDEX `ecms_analytics_hits_next_attempt_at_idx` ON `ecms_analytics_hits` (`next_attempt_at`);
