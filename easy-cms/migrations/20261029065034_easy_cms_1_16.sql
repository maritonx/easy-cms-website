-- Easy CMS migration 20261029065034_easy_cms_1_16 (sqlite)
-- Generated from the config; review before deploying.
CREATE INDEX `ecms_posts_cover_status_idx` ON `ecms_posts` (`cover`,`status`);
--> statement-breakpoint
CREATE INDEX `ecms_posts_meta_image_status_idx` ON `ecms_posts` (`meta_image`,`status`);
--> statement-breakpoint
CREATE INDEX `ecms_showcase_image_status_idx` ON `ecms_showcase` (`image`,`status`);
--> statement-breakpoint
DROP INDEX `ecms_posts_cover_idx`;
--> statement-breakpoint
DROP INDEX `ecms_posts_meta_image_idx`;
--> statement-breakpoint
DROP INDEX `ecms_showcase_image_idx`;
