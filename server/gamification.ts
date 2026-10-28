import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import {
  applyEvent,
  buildSnapshot,
  createEmptyState,
  localDateKey,
  normalizeState,
  type GameEvent,
  type GameEventType,
  type GameState,
  type Snapshot,
  type SyncEventInput,
} from "../shared/gamification";
import { isCourseComplete, isKnownCapstoneItem, isKnownLesson, LESSON_PROGRESS_KEY } from "../shared/catalog";
import {
  certificates,
  learnerProfiles,
  lessonProgress,
  userBadges,
  xpEvents,
  type CertificateRow,
  type LearnerProfile,
} from "../drizzle/schema";
import { getDb } from "./db";

const ALLOWED_TYPES = new Set<GameEventType>([
  "lesson.completed",
  "quiz.correct",
  "terminal.saved",
  "project.created",
  "capstone.item",
  "capstone.state",
  "module.completed",
  "streak.milestone",
  "mission.completed",
  "migration.v1",
]);

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type GamificationResult = {
  state: GameState;
  snapshot: Snapshot;
};

function iso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function dateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

async function ensureProfile(db: Db, userId: number, timezone?: string): Promise<LearnerProfile> {
  const existing = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  if (existing[0]) {
    if (timezone && timezone !== existing[0].timezone) {
      await db.update(learnerProfiles).set({ timezone, updatedAt: new Date() }).where(eq(learnerProfiles.userId, userId));
      return { ...existing[0], timezone };
    }
    return existing[0];
  }
  const created: typeof learnerProfiles.$inferInsert = {
    userId,
    timezone: timezone || "UTC",
    xp: 0,
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    freezes: 1,
    weeklyGoal: 5,
  };
  await db.insert(learnerProfiles).values(created);
  const row = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  return row[0] as LearnerProfile;
}

async function loadState(db: Db, userId: number, timezone?: string): Promise<{ state: GameState; cert: CertificateRow | undefined }> {
  const profile = await ensureProfile(db, userId, timezone);
  const [progressRows, eventRows, badgeRows, certRows] = await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select().from(xpEvents).where(eq(xpEvents.userId, userId)),
    db.select().from(userBadges).where(eq(userBadges.userId, userId)),
    db.select().from(certificates).where(eq(certificates.userId, userId)).limit(1),
  ]);

  const progress: Record<string, boolean> = {};
  for (const row of progressRows) {
    progress[LESSON_PROGRESS_KEY(row.courseId, row.lessonId)] = true;
  }

  const events: GameEvent[] = eventRows
    .map((row) => ({
      id: String(row.id),
      type: row.eventType as GameEventType,
      sourceKey: row.sourceKey,
      amount: row.amount,
      at: iso(row.createdAt),
      ...(row.meta && typeof row.meta === "object" ? { meta: row.meta as Record<string, unknown> } : {}),
    }))
    .sort((a, b) => a.at.localeCompare(b.at) || Number(a.id) - Number(b.id));

  const capstone: Record<string, boolean> = {};
  for (const event of events) {
    if (event.type === "capstone.item") capstone[event.sourceKey] = true;
    if (event.type === "capstone.state") {
      const item = typeof event.meta?.item === "string" ? event.meta.item : "";
      if (item) capstone[item] = event.meta?.checked === true;
    }
  }

  const badges: Record<string, string> = {};
  for (const row of badgeRows) {
    badges[row.badgeId] = iso(row.earnedAt);
  }

  const cert = certRows[0];
  const state = normalizeState({
    version: 2,
    xp: profile.xp,
    badges,
    streak: profile.streak,
    longestStreak: profile.longestStreak,
    lastActiveDate: dateOnly(profile.lastActiveDate),
    freezes: profile.freezes,
    weeklyGoal: profile.weeklyGoal,
    progress,
    capstone,
    events,
    certificate: cert ? { code: cert.publicCode, issuedAt: iso(cert.issuedAt), pending: false } : null,
    createdAt: iso(profile.createdAt),
    updatedAt: iso(profile.updatedAt),
  });
  return { state, cert };
}

function validateEvent(input: SyncEventInput): SyncEventInput | null {
  if (!input || typeof input !== "object") return null;
  if (!ALLOWED_TYPES.has(input.type)) return null;
  if (typeof input.sourceKey !== "string" || input.sourceKey.length === 0 || input.sourceKey.length > 190) return null;
  if (input.type === "lesson.completed" || input.type === "quiz.correct") {
    const [courseId, lessonId] = input.sourceKey.split(":");
    if (!courseId || !lessonId || !isKnownLesson(courseId, lessonId)) return null;
  }
  if (input.type === "capstone.item" && !isKnownCapstoneItem(input.sourceKey)) return null;
  if (input.type === "capstone.state") {
    const item = input.meta && typeof input.meta.item === "string" ? input.meta.item : "";
    if (!isKnownCapstoneItem(item)) return null;
    if (typeof input.meta?.checked !== "boolean") return null;
  }
  if (input.type === "migration.v1" && input.sourceKey !== "legacy-device-state") return null;
  return {
    type: input.type,
    sourceKey: input.sourceKey,
    at: input.at,
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.meta && typeof input.meta === "object" ? { meta: input.meta } : {}),
  };
}

function certificateCode(): string {
  const random = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `NGO-${Date.now().toString(36).toUpperCase().slice(-5)}-${random}`.slice(0, 32);
}

export async function applySyncEvents(
  userId: number,
  inputs: SyncEventInput[],
  options: { timezone?: string } = {}
): Promise<GamificationResult> {
  const db = await getDb();
  if (!db) {
    const empty = createEmptyState();
    return { state: empty, snapshot: buildSnapshot(empty, options.timezone) };
  }

  return db.transaction(async (tx) => {
    const { state: loadedState, cert: existingCert } = await loadState(tx as unknown as Db, userId, options.timezone);
    const timezone = options.timezone || "UTC";
    let state = loadedState;
    const addedEvents: GameEvent[] = [];

    for (const raw of inputs.slice(0, 200)) {
      const input = validateEvent(raw);
      if (!input) continue;
      if (input.type === "migration.v1" && input.meta) {
        state = applyMigrationMeta(state, input);
      }
      const result = applyEvent(state, input, {
        timeZone: timezone,
        certificateCode,
      });
      if (!result.skipped) {
        state = result.state;
        addedEvents.push(...result.added);
      }

      if (input.type === "lesson.completed") {
        const courseId = input.sourceKey.split(":")[0];
        if (isCourseComplete(state.progress, courseId)) {
          const bonusKey = courseId;
          if (!state.events.some((event) => event.type === "module.completed" && event.sourceKey === bonusKey)) {
            const bonus = applyEvent(state, { type: "module.completed", sourceKey: bonusKey, at: input.at }, { timeZone: timezone, certificateCode });
            if (!bonus.skipped) {
              state = bonus.state;
              addedEvents.push(...bonus.added);
            }
          }
        }
      }

      if (result.skipped) continue;
      const milestoneXp = state.streak >= 30 ? 150 : state.streak >= 14 ? 80 : state.streak >= 7 ? 50 : state.streak >= 3 ? 30 : 0;
      if (milestoneXp > 0) {
        const milestoneKey = `streak:${state.streak}`;
        if (!state.events.some((event) => event.type === "streak.milestone" && event.sourceKey === milestoneKey)) {
          const milestone = applyEvent(
            state,
            { type: "streak.milestone", sourceKey: milestoneKey, at: input.at, amount: milestoneXp },
            { timeZone: timezone, certificateCode }
          );
          if (!milestone.skipped) {
            state = milestone.state;
            addedEvents.push(...milestone.added);
          }
        }
      }
    }

    if (addedEvents.length > 0) {
      const rows = addedEvents.map((event) => ({
        userId,
        eventType: event.type,
        sourceKey: event.sourceKey,
        amount: event.amount,
        meta: event.meta ?? null,
        createdAt: new Date(event.at),
      }));
      for (const row of rows) {
        await tx
          .insert(xpEvents)
          .values(row)
          .onDuplicateKeyUpdate({ set: { sourceKey: row.sourceKey } });
      }
    }

    for (const [key, done] of Object.entries(state.progress)) {
      if (!done) continue;
      const [courseId, lessonId] = key.split(":");
      if (!courseId || !lessonId || !isKnownLesson(courseId, lessonId)) continue;
      await tx
        .insert(lessonProgress)
        .values({ userId, courseId, lessonId, completedAt: new Date() })
        .onDuplicateKeyUpdate({ set: { courseId } });
    }

    const badgeRows = Object.entries(state.badges).map(([badgeId, earnedAt]) => ({
      userId,
      badgeId,
      earnedAt: new Date(earnedAt),
    }));
    for (const row of badgeRows) {
      await tx.insert(userBadges).values(row).onDuplicateKeyUpdate({ set: { badgeId: row.badgeId } });
    }

    const totalRows = await tx
      .select({ total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)` })
      .from(xpEvents)
      .where(eq(xpEvents.userId, userId));
    const total = Number(totalRows[0]?.total ?? 0);

    await tx
      .update(learnerProfiles)
      .set({
        xp: total,
        streak: state.streak,
        longestStreak: state.longestStreak,
        lastActiveDate: state.lastActiveDate ? new Date(`${state.lastActiveDate}T00:00:00.000Z`) : null,
        freezes: state.freezes,
        timezone,
        weeklyGoal: state.weeklyGoal,
        updatedAt: new Date(),
      })
      .where(eq(learnerProfiles.userId, userId));

    if (state.certificate && !existingCert) {
      const code = state.certificate.code;
      await tx
        .insert(certificates)
        .values({ userId, publicCode: code, payload: { scope: "ngo-website-capstone" } })
        .onDuplicateKeyUpdate({ set: { publicCode: code } });
    }

    state = {
      ...state,
      xp: total,
      certificate: state.certificate ? { ...state.certificate, pending: false } : null,
    };
    return { state, snapshot: buildSnapshot(state, timezone) };
  });
}

function applyMigrationMeta(state: GameState, input: SyncEventInput): GameState {
  const meta = input.meta as {
    xp?: unknown;
    streak?: unknown;
    longestStreak?: unknown;
    lastActiveDate?: unknown;
    progress?: unknown;
    badges?: unknown;
  };
  const next: GameState = { ...state, progress: { ...state.progress }, badges: { ...state.badges } };
  if (meta.progress && typeof meta.progress === "object") {
    for (const [key, value] of Object.entries(meta.progress as Record<string, unknown>)) {
      if (value === true) next.progress[key] = true;
    }
  }
  if (meta.badges && typeof meta.badges === "object") {
    for (const key of Object.keys(meta.badges as Record<string, unknown>)) {
      if (!next.badges[key]) next.badges[key] = new Date().toISOString();
    }
  }
  if (Number.isFinite(meta.streak)) next.streak = Math.max(next.streak, Number(meta.streak));
  if (Number.isFinite(meta.longestStreak)) next.longestStreak = Math.max(next.longestStreak, Number(meta.longestStreak));
  if (typeof meta.lastActiveDate === "string") next.lastActiveDate = meta.lastActiveDate;
  return next;
}

export async function getGamification(userId: number, timezone?: string): Promise<GamificationResult> {
  const db = await getDb();
  if (!db) {
    const empty = createEmptyState();
    return { state: empty, snapshot: buildSnapshot(empty, timezone) };
  }
  const { state } = await loadState(db, userId, timezone);
  return { state, snapshot: buildSnapshot(state, timezone) };
}

export async function setWeeklyGoal(userId: number, goal: number): Promise<GamificationResult> {
  const db = await getDb();
  const clamped = Math.max(1, Math.min(14, Math.round(goal)));
  if (!db) {
    const empty = createEmptyState();
    empty.weeklyGoal = clamped;
    return { state: empty, snapshot: buildSnapshot(empty) };
  }
  await ensureProfile(db, userId);
  await db.update(learnerProfiles).set({ weeklyGoal: clamped, updatedAt: new Date() }).where(eq(learnerProfiles.userId, userId));
  return getGamification(userId);
}

export async function getCertificateByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(certificates).where(eq(certificates.publicCode, code)).limit(1);
  const cert = rows[0];
  if (!cert || cert.revokedAt) return null;
  return {
    code: cert.publicCode,
    issuedAt: iso(cert.issuedAt),
    valid: true,
  };
}

export function timezoneFromRequest(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return undefined;
  }
}

export function todayKeyFor(timezone?: string): string {
  return localDateKey(new Date(), timezone);
}
