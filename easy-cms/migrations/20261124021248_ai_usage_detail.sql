-- Easy CMS migration 20261124021248_ai_usage_detail (sqlite)
-- Generated from the config; review before deploying.
ALTER TABLE `ecms_ai_usage` ADD `attempts` real;
--> statement-breakpoint
ALTER TABLE `ecms_ai_usage` ADD `image_bytes` real;
--> statement-breakpoint
ALTER TABLE `ecms_ai_usage` ADD `prompt_hash` text;
