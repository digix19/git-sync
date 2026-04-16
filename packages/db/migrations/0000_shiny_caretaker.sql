CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`nickname` text NOT NULL,
	`encrypted_pat` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `destination` (
	`id` text PRIMARY KEY NOT NULL,
	`repository_id` text NOT NULL,
	`account_id` text NOT NULL,
	`url` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repository`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `repository` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`url` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `setting` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`telegram_bot_token` text,
	`telegram_chat_id` text,
	`notify_on_failure` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `setting_user_id_unique` ON `setting` (`user_id`);--> statement-breakpoint
CREATE TABLE `sync_lock` (
	`repository_id` text NOT NULL,
	`destination_id` text NOT NULL,
	`job_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`repository_id`, `destination_id`)
);
--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` text PRIMARY KEY NOT NULL,
	`repository_id` text NOT NULL,
	`destination_id` text NOT NULL,
	`status` text NOT NULL,
	`trace_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`error_message` text,
	`output` text,
	FOREIGN KEY (`repository_id`) REFERENCES `repository`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`destination_id`) REFERENCES `destination`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`repository_id` text NOT NULL,
	`destination_id` text NOT NULL,
	`status` text NOT NULL,
	`trace_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`error_message` text,
	FOREIGN KEY (`repository_id`) REFERENCES `repository`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`destination_id`) REFERENCES `destination`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sync_secret` (
	`job_id` text PRIMARY KEY NOT NULL,
	`source_pat` text NOT NULL,
	`dest_pat` text NOT NULL,
	`expires_at` integer NOT NULL,
	`retrieved_at` integer
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);