import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  siteUserId: text("site_user_id").unique(),
  discordUserId: text("discord_user_id").unique(),
  displayName: text("display_name").notNull(),
  activeCharacterId: text("active_character_id"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  playerId: text("player_id").references(() => players.id),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  alive: integer("alive", { mode: "boolean" }).notNull().default(true),
  bornAt: integer("born_at", { mode: "timestamp_ms" }).notNull(),
  naturalDeathAt: integer("natural_death_at", { mode: "timestamp_ms" }).notNull(),
  position: real("position").notNull().default(0),
  hp: real("hp").notNull().default(100),
  hpMax: real("hp_max").notNull().default(100),
  raw: integer("raw").notNull().default(0),
  food: integer("food").notNull().default(0),
  clothing: integer("clothing").notNull().default(0),
  muScissors: integer("mu_scissors").notNull().default(1),
  muRock: integer("mu_rock").notNull().default(1),
  muPaper: integer("mu_paper").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const worldEvents = sqliteTable("world_events", {
  id: text("id").primaryKey(),
  characterId: text("character_id").references(() => characters.id),
  type: text("type").notNull(),
  detail: text("detail").notNull(),
  visibility: text("visibility", { enum: ["private", "nearby", "public"] }).notNull().default("private"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
