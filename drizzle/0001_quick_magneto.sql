CREATE TABLE `attacks` (
	`id` text PRIMARY KEY NOT NULL,
	`attacker_character_id` text NOT NULL,
	`defender_character_id` text,
	`facility_id` text,
	`hand` text NOT NULL,
	`strength` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response_hand` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`attacker_character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`defender_character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crops` (
	`id` text PRIMARY KEY NOT NULL,
	`planted_by_character_id` text NOT NULL,
	`position` real NOT NULL,
	`planted_at` integer NOT NULL,
	`harvest_at` integer NOT NULL,
	`harvested_at` integer,
	`harvested_by_character_id` text,
	`yield_amount` integer,
	FOREIGN KEY (`planted_by_character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`harvested_by_character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` text PRIMARY KEY NOT NULL,
	`position` real NOT NULL,
	`hp` real DEFAULT 1000 NOT NULL,
	`hp_max` real DEFAULT 1000 NOT NULL,
	`joo` integer DEFAULT 0 NOT NULL,
	`completed_percent` real DEFAULT 0 NOT NULL,
	`raw_committed` integer DEFAULT 0 NOT NULL,
	`password_hash` text,
	`is_open` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facilities_position_unique` ON `facilities` (`position`);