-- Easy CMS migration 20261017110723_post_language (sqlite)
-- Generated from the config; review before deploying.
ALTER TABLE `ecms_posts` ADD `language` text;
--> statement-breakpoint
-- Posts written before the field existed are in English.
UPDATE `ecms_posts` SET `language` = 'en' WHERE `language` IS NULL;
