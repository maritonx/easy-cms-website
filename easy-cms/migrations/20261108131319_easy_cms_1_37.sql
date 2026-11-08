-- Easy CMS migration 20261108131319_easy_cms_1_37 (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_social_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`title` text,
	`text` text,
	`link` text,
	`image` integer,
	`source` integer,
	`delivery` text,
	`next_at` text
);

--> statement-breakpoint
CREATE INDEX `ecms_social_posts_created_at_idx` ON `ecms_social_posts` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_social_posts_image_idx` ON `ecms_social_posts` (`image`);
--> statement-breakpoint
CREATE INDEX `ecms_social_posts_source_idx` ON `ecms_social_posts` (`source`);
--> statement-breakpoint
CREATE INDEX `ecms_social_posts_next_at_idx` ON `ecms_social_posts` (`next_at`);
--> statement-breakpoint
CREATE TABLE `ecms_social_posts__channels` (
	`id` text PRIMARY KEY NOT NULL,
	`_parent_id` integer NOT NULL,
	`_order` integer NOT NULL,
	`connection` text,
	`text` text
);

--> statement-breakpoint
CREATE INDEX `ecms_social_posts__channels__parent_id_idx` ON `ecms_social_posts__channels` (`_parent_id`);
