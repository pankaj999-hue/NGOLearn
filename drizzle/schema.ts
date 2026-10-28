import { date, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const learnerProfiles = mysqlTable("learnerProfiles", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  xp: int("xp").default(0).notNull(),
  streak: int("streak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActiveDate: date("lastActiveDate"),
  freezes: int("freezes").default(1).notNull(),
  weeklyGoal: int("weeklyGoal").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const lessonProgress = mysqlTable(
  "lessonProgress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: varchar("courseId", { length: 64 }).notNull(),
    lessonId: varchar("lessonId", { length: 64 }).notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("lessonProgress_user_lesson").on(table.userId, table.courseId, table.lessonId)]
);

export const xpEvents = mysqlTable(
  "xpEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventType: varchar("eventType", { length: 48 }).notNull(),
    sourceKey: varchar("sourceKey", { length: 190 }).notNull(),
    amount: int("amount").default(0).notNull(),
    meta: json("meta"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("xpEvents_user_event_source").on(table.userId, table.eventType, table.sourceKey)]
);

export const userBadges = mysqlTable(
  "userBadges",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeId: varchar("badgeId", { length: 64 }).notNull(),
    earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("userBadges_user_badge").on(table.userId, table.badgeId)]
);

export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  publicCode: varchar("publicCode", { length: 32 }).notNull().unique(),
  payload: json("payload"),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type XpEvent = typeof xpEvents.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type CertificateRow = typeof certificates.$inferSelect;