-- Easy CMS migration 20261112023938_easy_cms_1_43 (sqlite)
-- Generated from the config; review before deploying.
ALTER TABLE `ecms_sessions` ADD `method` text;
--> statement-breakpoint
CREATE INDEX `ecms_sessions_method_idx` ON `ecms_sessions` (`method`);
