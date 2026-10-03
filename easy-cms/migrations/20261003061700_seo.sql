-- Easy CMS migration 20261003061700_seo (sqlite)
-- Generated from the config; review before deploying.
ALTER TABLE `ecms_posts` ADD `meta_title` text;
--> statement-breakpoint
ALTER TABLE `ecms_posts` ADD `meta_description` text;
--> statement-breakpoint
ALTER TABLE `ecms_posts` ADD `meta_image` integer;
--> statement-breakpoint
ALTER TABLE `ecms_posts` ADD `meta_noindex` integer;
--> statement-breakpoint
CREATE INDEX `ecms_posts_meta_image_idx` ON `ecms_posts` (`meta_image`);
