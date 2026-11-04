-- Easy CMS migration 20261104054721_easy_cms_1_33 (sqlite)
-- Generated from the config; review before deploying.
CREATE TABLE `ecms_notify_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`channel` text,
	`connection` text,
	`event` text,
	`text` text,
	`state` text,
	`attempts` real,
	`next_attempt_at` text,
	`error` text
);

--> statement-breakpoint
CREATE INDEX `ecms_notify_messages_created_at_idx` ON `ecms_notify_messages` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_notify_messages_channel_idx` ON `ecms_notify_messages` (`channel`);
--> statement-breakpoint
CREATE INDEX `ecms_notify_messages_state_idx` ON `ecms_notify_messages` (`state`);
--> statement-breakpoint
CREATE INDEX `ecms_notify_messages_next_attempt_at_idx` ON `ecms_notify_messages` (`next_attempt_at`);
--> statement-breakpoint
CREATE TABLE `ecms_job_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`name` text,
	`last_run_at` text,
	`last_status` text,
	`last_error` text,
	`last_duration_ms` real,
	`paused_at` text,
	`paused_by` text,
	`every_override` real,
	`at_override` text,
	`changed_by` text,
	`changed_at` text
);

--> statement-breakpoint
CREATE INDEX `ecms_job_runs_created_at_idx` ON `ecms_job_runs` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecms_job_runs_name_unique` ON `ecms_job_runs` (`name`);
--> statement-breakpoint
CREATE TABLE `ecms_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`kind` text,
	`integration` text,
	`name` text,
	`is_default` integer,
	`values` text,
	`secret` text,
	`account` text,
	`last_used_at` text,
	`last_error` text,
	`enabled` integer
);

--> statement-breakpoint
CREATE INDEX `ecms_connections_created_at_idx` ON `ecms_connections` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_connections_integration_idx` ON `ecms_connections` (`integration`);
--> statement-breakpoint
CREATE TABLE `ecms_ai_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user` text,
	`feature` text,
	`integration` text,
	`connection` text,
	`input` real,
	`output` real,
	`ok` integer,
	`error` text,
	`about` text
);

--> statement-breakpoint
CREATE INDEX `ecms_ai_usage_created_at_idx` ON `ecms_ai_usage` (`created_at`);
--> statement-breakpoint
CREATE INDEX `ecms_ai_usage_user_idx` ON `ecms_ai_usage` (`user`);
