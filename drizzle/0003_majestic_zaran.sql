ALTER TABLE `facilities` ADD `builder_character_id` text REFERENCES characters(id);--> statement-breakpoint
ALTER TABLE `facilities` ADD `construction_last_at` integer;