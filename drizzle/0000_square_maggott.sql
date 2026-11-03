CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`alive` integer DEFAULT true NOT NULL,
	`born_at` integer NOT NULL,
	`natural_death_at` integer NOT NULL,
	`position` real DEFAULT 0 NOT NULL,
	`hp` real DEFAULT 100 NOT NULL,
	`hp_max` real DEFAULT 100 NOT NULL,
	`raw` integer DEFAULT 0 NOT NULL,
	`food` integer DEFAULT 0 NOT NULL,
	`clothing` integer DEFAULT 0 NOT NULL,
	`mu_scissors` integer DEFAULT 1 NOT NULL,
	`mu_rock` integer DEFAULT 1 NOT NULL,
	`mu_paper` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`site_user_id` text,
	`discord_user_id` text,
	`display_name` text NOT NULL,
	`active_character_id` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_site_user_id_unique` ON `players` (`site_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_discord_user_id_unique` ON `players` (`discord_user_id`);--> statement-breakpoint
CREATE TABLE `world_events` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text,
	`type` text NOT NULL,
	`detail` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
