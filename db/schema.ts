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
  hungerAt: integer("hunger_at", { mode: "timestamp_ms" }).notNull(),
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

export const crops = sqliteTable("crops", {
  id: text("id").primaryKey(),
  plantedByCharacterId: text("planted_by_character_id").references(() => characters.id).notNull(),
  position: real("position").notNull(),
  plantedAt: integer("planted_at", { mode: "timestamp_ms" }).notNull(),
  harvestAt: integer("harvest_at", { mode: "timestamp_ms" }).notNull(),
  harvestedAt: integer("harvested_at", { mode: "timestamp_ms" }),
  harvestedByCharacterId: text("harvested_by_character_id").references(() => characters.id),
  yieldAmount: integer("yield_amount"),
});

export const facilities = sqliteTable("facilities", {
  id: text("id").primaryKey(),
  position: real("position").notNull().unique(),
  hp: real("hp").notNull().default(1000),
  hpMax: real("hp_max").notNull().default(1000),
  joo: integer("joo").notNull().default(0),
  completedPercent: real("completed_percent").notNull().default(0),
  rawCommitted: integer("raw_committed").notNull().default(0),
  builderCharacterId: text("builder_character_id").references(() => characters.id),
  constructionLastAt: integer("construction_last_at", { mode: "timestamp_ms" }),
  passwordHash: text("password_hash"),
  isOpen: integer("is_open", { mode: "boolean" }).notNull().default(false),
  openUntil: integer("open_until", { mode: "timestamp_ms" }),
  passesRemaining: integer("passes_remaining").notNull().default(0),
  rawStored: integer("raw_stored").notNull().default(0),
  foodStored: integer("food_stored").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const groundDrops = sqliteTable("ground_drops", {
  id: text("id").primaryKey(),
  position: real("position").notNull(),
  raw: integer("raw").notNull().default(0),
  food: integer("food").notNull().default(0),
  source: text("source").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const birthSessions = sqliteTable("birth_sessions", {
  id: text("id").primaryKey(),
  motherId: text("mother_id").references(() => characters.id).notNull(),
  fatherId: text("father_id").references(() => characters.id).notNull(),
  proposedName: text("proposed_name"),
  controllerPlayerId: text("controller_player_id").references(() => players.id),
  motherApproved: integer("mother_approved", { mode: "boolean" }).notNull().default(false),
  fatherApproved: integer("father_approved", { mode: "boolean" }).notNull().default(false),
  status: text("status", { enum: ["pending", "gestating", "completed", "cancelled"] }).notNull().default("pending"),
  completesAt: integer("completes_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const birthQueue = sqliteTable("birth_queue", {
  playerId: text("player_id").primaryKey().references(() => players.id),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull(),
});

export const gameSettings = sqliteTable("game_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const attacks = sqliteTable("attacks", {
  id: text("id").primaryKey(),
  attackerCharacterId: text("attacker_character_id").references(() => characters.id).notNull(),
  defenderCharacterId: text("defender_character_id").references(() => characters.id),
  facilityId: text("facility_id").references(() => facilities.id),
  hand: text("hand", { enum: ["scissors", "rock", "paper"] }).notNull(),
  strength: real("strength").notNull(),
  status: text("status", { enum: ["pending", "resolved", "expired"] }).notNull().default("pending"),
  responseHand: text("response_hand", { enum: ["scissors", "rock", "paper"] }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
});
