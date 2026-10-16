-- Easy CMS migration 20261016100726_sso (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_user_identities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user` integer,
	`provider` text,
	`subject` text,
	`email` text,
	`last_used_at` text
);

--> statement-breakpoint
CREATE INDEX `ecms_user_identities_created_at_idx` ON `ecms_user_identities` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_user_identities_user_idx` ON `ecms_user_identities` (`user`);
--> statement-breakpoint
CREATE INDEX `ecms_user_identities_provider_idx` ON `ecms_user_identities` (`provider`);
--> statement-breakpoint
CREATE INDEX `ecms_user_identities_subject_idx` ON `ecms_user_identities` (`subject`);
