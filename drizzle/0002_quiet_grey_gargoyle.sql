CREATE TABLE `birth_queue` (
	`player_id` text PRIMARY KEY NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `birth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`mother_id` text NOT NULL,
	`father_id` text NOT NULL,
	`proposed_name` text,
	`controller_player_id` text,
	`mother_approved` integer DEFAULT false NOT NULL,
	`father_approved` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completes_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`mother_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`father_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`controller_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `game_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ground_drops` (
	`id` text PRIMARY KEY NOT NULL,
	`position` real NOT NULL,
	`raw` integer DEFAULT 0 NOT NULL,
	`food` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `characters` ADD `hunger_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `facilities` ADD `open_until` integer;--> statement-breakpoint
ALTER TABLE `facilities` ADD `passes_remaining` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `facilities` ADD `raw_stored` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `facilities` ADD `food_stored` integer DEFAULT 0 NOT NULL;