import { CAPSTONE_ITEMS, isCourseComplete, LESSON_PROGRESS_KEY } from "./catalog";

export type Level = { name: string; min: number };

export const LEVELS: Level[] = [
  { name: "First Click", min: 0 },
  { name: "Digital Explorer", min: 150 },
  { name: "Page Builder", min: 400 },
  { name: "Style Shaper", min: 800 },
  { name: "Interaction Maker", min: 1400 },
  { name: "Community Web Creator", min: 2200 },
];

export const XP = {
  lesson: 25,
  quiz: 15,
  terminalSave: 10,
  projectCreate: 20,
  capstoneItem: 15,
  moduleBonus: 50,
  streakMilestones: { 3: 30, 7: 50, 14: 80, 30: 150 } as Record<number, number>,
} as const;

export type GameEventType =
  | "lesson.completed"
  | "quiz.correct"
  | "terminal.saved"
  | "project.created"
  | "capstone.item"
  | "capstone.state"
  | "module.completed"
  | "streak.milestone"
  | "mission.completed"
  | "migration.v1";

export type GameEvent = {
  id: string;
  type: GameEventType;
  sourceKey: string;
  amount: number;
  at: string;
  meta?: Record<string, unknown>;
};

export type Certificate = {
  code: string;
  issuedAt: string;
  pending?: boolean;
};

export type GameState = {
  version: 2;
  xp: number;
  badges: Record<string, string>;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  freezes: number;
  weeklyGoal: number;
  progress: Record<string, boolean>;
  capstone: Record<string, boolean>;
  events: GameEvent[];
  certificate: Certificate | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncEventInput = {
  type: GameEventType;
  sourceKey: string;
  at?: string;
  amount?: number;
  meta?: Record<string, unknown>;
};

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const BADGES: BadgeDef[] = [
  { id: "first-steps", name: "First Steps", description: "Complete your first lesson.", icon: "steps" },
  { id: "module-01", name: "Getting Started", description: "Finish every lesson in Module 01.", icon: "laptop" },
  { id: "html-builder", name: "Structure Builder", description: "Finish the HTML module.", icon: "code" },
  { id: "css-shaper", name: "Style Shaper", description: "Finish the CSS module.", icon: "sparkles" },
  { id: "js-weaver", name: "Logic Weaver", description: "Finish the JavaScript module.", icon: "rocket" },
  { id: "streak-3", name: "Three Days In", description: "Show up three days in a row.", icon: "flame" },
  { id: "streak-7", name: "Habit Formed", description: "Show up seven days in a row.", icon: "flame" },
  { id: "maker", name: "Maker", description: "Save something in the code terminal.", icon: "hammer" },
  { id: "builder", name: "Builder", description: "Create three projects.", icon: "folder" },
  { id: "capstone-starter", name: "Capstone Starter", description: "Check off your first capstone item.", icon: "check" },
  { id: "community-web-creator", name: "Community Web Creator", description: "Complete the entire capstone.", icon: "trophy" },
  { id: "comeback", name: "Comeback", description: "Return after a week away. Your progress waited for you.", icon: "refresh" },
];

export type MissionDef = {
  key: string;
  title: string;
  description: string;
  xp: number;
  href: string;
  eventType: GameEventType;
  count: number;
};

export const MISSION_POOL: MissionDef[] = [
  { key: "one-lesson", title: "Finish one lesson", description: "One small step is enough for today.", xp: 25, href: "/courses", eventType: "lesson.completed", count: 1 },
  { key: "two-lessons", title: "Finish two lessons", description: "A little momentum goes a long way.", xp: 40, href: "/courses", eventType: "lesson.completed", count: 2 },
  { key: "terminal-save", title: "Save in the terminal", description: "Try one edit and save your work.", xp: 20, href: "/terminal", eventType: "terminal.saved", count: 1 },
  { key: "quiz-correct", title: "Try a quick quiz", description: "Practice is the point, not perfection.", xp: 20, href: "/courses", eventType: "quiz.correct", count: 1 },
  { key: "project-create", title: "Start a project", description: "Give an idea a place to grow.", xp: 25, href: "/projects", eventType: "project.created", count: 1 },
  { key: "capstone-item", title: "Check a capstone item", description: "Move your final project one step forward.", xp: 25, href: "/final-project", eventType: "capstone.item", count: 1 },
];

export function levelForXp(xp: number): Level {
  return LEVELS.reduce((current, level) => (xp >= level.min ? level : current), LEVELS[0]);
}

export function levelProgress(xp: number) {
  const index = LEVELS.findIndex((level) => level.name === levelForXp(xp).name);
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const span = next ? next.min - current.min : 1;
  const into = Math.max(0, xp - current.min);
  const percent = next ? Math.min(100, Math.round((into / span) * 100)) : 100;
  return {
    level: current,
    next,
    into,
    span,
    percent,
    xpToNext: next ? Math.max(0, next.min - xp) : 0,
  };
}

const DAY_MS = 86_400_000;

export function localDateKey(date: Date = new Date(), timeZone?: string): string {
  if (!timeZone) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function dateKeyToUtc(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00Z`);
}

export function shiftDateKey(dateKey: string, days: number): string {
  const next = new Date(dateKeyToUtc(dateKey) + days * DAY_MS);
  return next.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((dateKeyToUtc(to) - dateKeyToUtc(from)) / DAY_MS);
}

export type StreakResult = {
  streak: number;
  longestStreak: number;
  lastActiveDate: string;
  freezes: number;
  freezeUsed: boolean;
};

export function nextStreak(
  current: { streak: number; longestStreak: number; lastActiveDate: string | null; freezes: number },
  activityDate: string
): StreakResult {
  let streak = current.streak;
  let freezes = current.freezes;
  let freezeUsed = false;

  if (!current.lastActiveDate) {
    streak = 1;
  } else if (current.lastActiveDate === activityDate) {
    streak = Math.max(1, current.streak);
  } else {
    const gap = daysBetween(current.lastActiveDate, activityDate);
    if (gap === 1) {
      streak = current.streak + 1;
    } else if (gap === 2 && freezes > 0) {
      streak = current.streak + 1;
      freezes -= 1;
      freezeUsed = true;
    } else {
      streak = 1;
    }
  }

  return {
    streak,
    longestStreak: Math.max(current.longestStreak, streak),
    lastActiveDate: activityDate,
    freezes,
    freezeUsed,
  };
}

export function eventXp(type: GameEventType, amount?: number): number {
  switch (type) {
    case "lesson.completed":
      return XP.lesson;
    case "quiz.correct":
      return XP.quiz;
    case "terminal.saved":
      return XP.terminalSave;
    case "project.created":
      return XP.projectCreate;
    case "capstone.item":
      return XP.capstoneItem;
    case "capstone.state":
      return 0;
    case "module.completed":
      return XP.moduleBonus;
    case "migration.v1":
      return Math.max(0, Math.min(100_000, Math.round(amount ?? 0)));
    default:
      return Math.max(0, Math.min(1_000, Math.round(amount ?? 0)));
  }
}

export function isDailyEvent(type: GameEventType): boolean {
  return type === "terminal.saved";
}

export function eventDisplayDate(event: GameEvent, timeZone?: string): string {
  return localDateKey(new Date(event.at), timeZone);
}

export function eventsOnDate(events: GameEvent[], dateKey: string, timeZone?: string): GameEvent[] {
  return events.filter((event) => event.type !== "mission.completed" && eventDisplayDate(event, timeZone) === dateKey);
}

export function missionProgress(mission: MissionDef, events: GameEvent[], dateKey: string, timeZone?: string): number {
  const todays = eventsOnDate(events, dateKey, timeZone);
  if (mission.eventType === "lesson.completed") {
    return todays.filter((event) => event.type === "lesson.completed").length;
  }
  const matching = todays.filter((event) => event.type === mission.eventType);
  return new Set(matching.map((event) => event.sourceKey)).size;
}

export function missionsForDate(dateKey: string): MissionDef[] {
  const day = Math.floor(dateKeyToUtc(dateKey) / DAY_MS);
  const picked: MissionDef[] = [];
  for (let index = 0; index < 3; index++) {
    picked.push(MISSION_POOL[(day + index * 2) % MISSION_POOL.length]);
  }
  return picked;
}

export function missionAwardKey(dateKey: string, missionKey: string): string {
  return `${dateKey}:${missionKey}`;
}

export function isMissionDone(events: GameEvent[], dateKey: string, mission: MissionDef, timeZone?: string): boolean {
  const awarded = events.some(
    (event) => event.type === "mission.completed" && event.sourceKey === missionAwardKey(dateKey, mission.key)
  );
  if (awarded) return true;
  return missionProgress(mission, events, dateKey, timeZone) >= mission.count;
}

export type BadgeContext = {
  progress: Record<string, boolean>;
  capstone: Record<string, boolean>;
  events: GameEvent[];
  streak: number;
  longestStreak: number;
  returnedAfterBreak: boolean;
};

export function evaluateBadgeIds(ctx: BadgeContext): string[] {
  const ids: string[] = [];
  const lessonDone = Object.values(ctx.progress).some(Boolean);
  if (lessonDone) ids.push("first-steps");
  if (isCourseComplete(ctx.progress, "basic-computer")) ids.push("module-01");
  if (isCourseComplete(ctx.progress, "html")) ids.push("html-builder");
  if (isCourseComplete(ctx.progress, "css")) ids.push("css-shaper");
  if (isCourseComplete(ctx.progress, "javascript")) ids.push("js-weaver");
  if (ctx.streak >= 3 || ctx.longestStreak >= 3) ids.push("streak-3");
  if (ctx.streak >= 7 || ctx.longestStreak >= 7) ids.push("streak-7");
  if (ctx.events.some((event) => event.type === "terminal.saved")) ids.push("maker");
  if (new Set(ctx.events.filter((event) => event.type === "project.created").map((event) => event.sourceKey)).size >= 3) ids.push("builder");
  if (Object.keys(ctx.capstone).some((key) => ctx.capstone[key])) ids.push("capstone-starter");
  if (CAPSTONE_ITEMS.every((item) => ctx.capstone[item])) ids.push("community-web-creator");
  if (ctx.returnedAfterBreak) ids.push("comeback");
  return ids;
}

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((badge) => badge.id === id);
}

export function createEmptyState(): GameState {
  const now = new Date().toISOString();
  return {
    version: 2,
    xp: 0,
    badges: {},
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    freezes: 1,
    weeklyGoal: 5,
    progress: {},
    capstone: {},
    events: [],
    certificate: null,
    createdAt: now,
    updatedAt: now,
  };
}

export type SnapshotBadge = BadgeDef & { earnedAt?: string };

export type SnapshotMission = MissionDef & {
  done: boolean;
  progress: number;
};

export type Snapshot = {
  xp: number;
  level: Level;
  nextLevel: Level | null;
  levelPercent: number;
  xpToNext: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  freezes: number;
  weeklyGoal: number;
  badges: SnapshotBadge[];
  missions: SnapshotMission[];
  progress: Record<string, boolean>;
  capstone: Record<string, boolean>;
  completedLessons: number;
  activityDates: string[];
  certificate: Certificate | null;
  events: GameEvent[];
  syncedAt: string;
};

export function buildSnapshot(state: GameState, timeZone?: string): Snapshot {
  const progressInfo = levelProgress(state.xp);
  const today = localDateKey(new Date(), timeZone);
  const missions = missionsForDate(today).map((mission) => ({
    ...mission,
    done: isMissionDone(state.events, today, mission, timeZone),
    progress: Math.min(mission.count, missionProgress(mission, state.events, today, timeZone)),
  }));
  const activityDates = Array.from(
    new Set(state.events.filter((event) => event.type !== "mission.completed" && event.type !== "capstone.state").map((event) => eventDisplayDate(event, timeZone)))
  ).sort((a, b) => b.localeCompare(a));
  return {
    xp: state.xp,
    level: progressInfo.level,
    nextLevel: progressInfo.next,
    levelPercent: progressInfo.percent,
    xpToNext: progressInfo.xpToNext,
    streak: state.streak,
    longestStreak: state.longestStreak,
    lastActiveDate: state.lastActiveDate,
    freezes: state.freezes,
    weeklyGoal: state.weeklyGoal,
    badges: BADGES.map((badge) => ({ ...badge, earnedAt: state.badges[badge.id] })),
    missions,
    progress: state.progress,
    capstone: state.capstone,
    completedLessons: Object.values(state.progress).filter(Boolean).length,
    activityDates,
    certificate: state.certificate,
    events: state.events,
    syncedAt: new Date().toISOString(),
  };
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type ApplyResult = {
  state: GameState;
  added: GameEvent[];
  skipped: boolean;
};

export function applyEvent(
  state: GameState,
  input: SyncEventInput,
  options: { timeZone?: string; certificateCode?: () => string } = {}
): ApplyResult {
  const at = input.at ? new Date(input.at).toISOString() : new Date().toISOString();
  const duplicate = state.events.some((event) => event.type === input.type && event.sourceKey === input.sourceKey);
  if (duplicate) return { state, added: [], skipped: true };

  const amount = eventXp(input.type, input.amount);
  const event: GameEvent = {
    id: newEventId(),
    type: input.type,
    sourceKey: input.sourceKey,
    amount,
    at,
    ...(input.meta ? { meta: input.meta } : {}),
  };

  const next: GameState = {
    ...state,
    xp: state.xp + amount,
    progress: { ...state.progress },
    capstone: { ...state.capstone },
    badges: { ...state.badges },
    events: [...state.events, event],
    updatedAt: at,
  };

  if (input.type === "lesson.completed" && input.sourceKey.includes(":")) {
    next.progress[input.sourceKey] = true;
  }
  if (input.type === "capstone.item") {
    next.capstone[input.sourceKey] = true;
  }
  if (input.type === "capstone.state") {
    const item = typeof input.meta?.item === "string" ? input.meta.item : "";
    if (item) next.capstone[item] = input.meta?.checked === true;
  }

  const dateKey = localDateKey(new Date(at), options.timeZone);
  const previousActive = next.lastActiveDate;
  const affectsStreak = input.type !== "mission.completed" && input.type !== "migration.v1" && input.type !== "capstone.state";
  if (affectsStreak) {
    const streak = nextStreak(
      {
        streak: next.streak,
        longestStreak: next.longestStreak,
        lastActiveDate: next.lastActiveDate,
        freezes: next.freezes,
      },
      dateKey
    );
    next.streak = streak.streak;
    next.longestStreak = streak.longestStreak;
    next.lastActiveDate = streak.lastActiveDate;
    next.freezes = streak.freezes;
  }

  const added: GameEvent[] = [event];

  const returnedAfterBreak =
    affectsStreak &&
    Boolean(previousActive) &&
    daysBetween(previousActive as string, dateKey) >= 7;

  for (const badgeId of evaluateBadgeIds({
    progress: next.progress,
    capstone: next.capstone,
    events: next.events,
    streak: next.streak,
    longestStreak: next.longestStreak,
    returnedAfterBreak,
  })) {
    if (!next.badges[badgeId]) next.badges[badgeId] = at;
  }

  for (const mission of missionsForDate(dateKey)) {
    const key = missionAwardKey(dateKey, mission.key);
    const already = next.events.some((item) => item.type === "mission.completed" && item.sourceKey === key);
    if (already) continue;
    if (missionProgress(mission, next.events, dateKey, options.timeZone) < mission.count) continue;
    const missionEvent: GameEvent = {
      id: newEventId(),
      type: "mission.completed",
      sourceKey: key,
      amount: mission.xp,
      at,
      meta: { mission: mission.key },
    };
    next.events.push(missionEvent);
    next.xp += mission.xp;
    added.push(missionEvent);
  }

  if (!next.certificate && CAPSTONE_ITEMS.every((item) => next.capstone[item])) {
    const code = options.certificateCode ? options.certificateCode() : `LOCAL-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    next.certificate = { code, issuedAt: at, pending: true };
  }

  return { state: next, added, skipped: false };
}

export function lessonSourceKey(courseId: string, lessonId: string): string {
  return LESSON_PROGRESS_KEY(courseId, lessonId);
}

export function normalizeState(raw: unknown): GameState {
  const empty = createEmptyState();
  if (!raw || typeof raw !== "object") return empty;
  const value = raw as Partial<GameState> & { badges?: unknown; events?: unknown };
  const badges: Record<string, string> = {};
  if (Array.isArray(value.badges)) {
    for (const badge of value.badges) {
      if (typeof badge === "string") badges[badge] = new Date().toISOString();
    }
  } else if (value.badges && typeof value.badges === "object") {
    for (const [key, at] of Object.entries(value.badges as Record<string, unknown>)) {
      if (typeof at === "string") badges[key] = at;
    }
  }
  return {
    ...empty,
    ...value,
    version: 2,
    xp: Number.isFinite(value.xp) ? Number(value.xp) : 0,
    streak: Number.isFinite(value.streak) ? Number(value.streak) : 0,
    longestStreak: Number.isFinite(value.longestStreak) ? Number(value.longestStreak) : 0,
    freezes: Number.isFinite(value.freezes) ? Number(value.freezes) : 1,
    weeklyGoal: Number.isFinite(value.weeklyGoal) ? Number(value.weeklyGoal) : 5,
    progress: value.progress && typeof value.progress === "object" ? { ...(value.progress as Record<string, boolean>) } : {},
    capstone: value.capstone && typeof value.capstone === "object" ? { ...(value.capstone as Record<string, boolean>) } : {},
    events: Array.isArray(value.events) ? (value.events as GameEvent[]).filter((event) => Boolean(event && event.type)) : [],
    badges,
    certificate: value.certificate && typeof value.certificate === "object" ? (value.certificate as Certificate) : null,
  };
}
