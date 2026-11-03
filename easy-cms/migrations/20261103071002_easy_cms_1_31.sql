-- Easy CMS migration 20261103071002_easy_cms_1_31 (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_saved_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`collection` text,
	`user` text,
	`kind` text,
	`name` text,
	`shared` integer,
	`state` text,
	`target` text
);

--> statement-breakpoint
CREATE INDEX `ecms_saved_views_created_at_idx` ON `ecms_saved_views` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_saved_views_collection_idx` ON `ecms_saved_views` (`collection`);
--> statement-breakpoint
CREATE INDEX `ecms_saved_views_user_idx` ON `ecms_saved_views` (`user`);
