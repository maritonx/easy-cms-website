-- Easy CMS migration 20261113144325_roadmap_levels (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_roadmap_levels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`level` real,
	`title` text,
	`title_th` text,
	`summary` text,
	`summary_th` text,
	`status` text,
	`next` integer
);

--> statement-breakpoint
CREATE INDEX `ecms_roadmap_levels_created_at_idx` ON `ecms_roadmap_levels` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_roadmap_levels_level_unique` ON `ecms_roadmap_levels` (`level`);
--> statement-breakpoint
CREATE TABLE `ecms_roadmap_levels__works_today` (
	`id` text PRIMARY KEY NOT NULL,
	`_parent_id` integer NOT NULL,
	`_order` integer NOT NULL,
	`text` text,
	`text_th` text
);

--> statement-breakpoint
CREATE INDEX `ecms_roadmap_levels__works_today__parent_id_idx` ON `ecms_roadmap_levels__works_today` (`_parent_id`);
--> statement-breakpoint
CREATE TABLE `ecms_roadmap_levels__still_to_build` (
	`id` text PRIMARY KEY NOT NULL,
	`_parent_id` integer NOT NULL,
	`_order` integer NOT NULL,
	`text` text,
	`text_th` text
);

--> statement-breakpoint
CREATE INDEX `ecms_roadmap_levels__still_to_build__parent_id_idx` ON `ecms_roadmap_levels__still_to_build` (`_parent_id`);
