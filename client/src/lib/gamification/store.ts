import { isCourseComplete, LESSON_PROGRESS_KEY } from "@shared/catalog";
import {
  applyEvent,
  buildSnapshot,
  createEmptyState,
  isMissionDone,
  levelForXp,
  localDateKey,
  missionsForDate,
  normalizeState,
  type ApplyResult,
  type GameEvent,
  type GameState,
  type Snapshot,
  type SyncEventInput,
  type Level,
} from "@shared/gamification";

const STORAGE_KEY = "ngo-learn-game-v2";
const LEGACY_GAME_KEY = "ngo-learn-game";
const LEGACY_PROGRESS_KEY = "ngo-learn-progress";
const MIGRATION_KEY = "ngo-learn-game-migrated-v2";

let cached: GameState | null = null;
const listeners = new Set<() => void>();

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const probe = "__ngo_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string, fallback: T): T {
  const storage = safeStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function legacyProgress(): Record<string, boolean> {
  const raw = readJson<Record<string, boolean>>(LEGACY_PROGRESS_KEY, {});
  return raw && typeof raw === "object" ? raw : {};
}

function migrateLegacy(): GameState {
  const empty = createEmptyState();
  if (typeof localStorage === "undefined") return empty;
  const already = localStorage.getItem(MIGRATION_KEY);
  const legacyGame = readJson<{ xp?: number; badges?: string[]; streak?: number; lastActive?: string | null } | null>(LEGACY_GAME_KEY, null);
  const progress = legacyProgress();
  const hasLegacy = Boolean(legacyGame) || Object.keys(progress).length > 0;
  if (!hasLegacy) return empty;

  const at = new Date().toISOString();
  const xp = Math.max(0, Number(legacyGame?.xp) || 0);
  const streak = Math.max(0, Number(legacyGame?.streak) || 0);
  const badges: Record<string, string> = {};
  if (Array.isArray(legacyGame?.badges)) {
    for (const badge of legacyGame.badges) {
      badges[badge === "First Steps" ? "first-steps" : String(badge)] = at;
    }
  }
  const state: GameState = {
    ...empty,
    xp,
    streak,
    longestStreak: streak,
    lastActiveDate: legacyGame?.lastActive ?? null,
    progress,
    badges,
    events: [
      {
        id: `migration-${at}`,
        type: "migration.v1",
        sourceKey: "legacy-device-state",
        amount: xp,
        at,
        meta: { xp, streak, longestStreak: streak, lastActiveDate: legacyGame?.lastActive ?? null, progress, badges },
      },
    ],
    updatedAt: at,
  };
  if (!already) {
    localStorage.setItem(MIGRATION_KEY, "1");
  }
  return state;
}

function loadState(): GameState {
  const storage = safeStorage();
  if (!storage) return createEmptyState();
  const raw = storage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return normalizeState(JSON.parse(raw));
    } catch {
      return createEmptyState();
    }
  }
  const migrated = migrateLegacy();
  storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

function persist(state: GameState) {
  const storage = safeStorage();
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit(state: GameState): GameState {
  cached = state;
  persist(state);
  listeners.forEach((listener) => listener());
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): GameState {
  if (!cached) cached = loadState();
  return cached;
}

export function invalidateFromStorage() {
  cached = null;
  listeners.forEach((listener) => listener());
}

export function getSnapshot(): Snapshot {
  return buildSnapshot(getState());
}

export function getProgress(): Record<string, boolean> {
  return getState().progress;
}

export function isComplete(courseId: string, lessonId: string): boolean {
  return Boolean(getState().progress[LESSON_PROGRESS_KEY(courseId, lessonId)]);
}

export function getGameState() {
  const state = getState();
  const today = localDateKey();
  return {
    xp: state.xp,
    badges: Object.keys(state.badges),
    streak: state.streak,
    lastActive: state.lastActiveDate,
    missions: missionsForDate(today)
      .filter((mission) => isMissionDone(state.events, today, mission))
      .map((mission) => mission.key),
  };
}

export function getLevel(xp: number): Level {
  return levelForXp(xp);
}

function hasEvent(state: GameState, type: GameEvent["type"], sourceKey: string): boolean {
  return state.events.some((event) => event.type === type && event.sourceKey === sourceKey);
}

export function recordEvent(input: SyncEventInput): ApplyResult & { newEvents: GameEvent[] } {
  let state = getState();
  const added: GameEvent[] = [];
  let skipped = true;

  const first = applyEvent(state, input);
  if (!first.skipped) {
    state = first.state;
    added.push(...first.added);
    skipped = false;
  }

  if (!skipped && input.type === "lesson.completed") {
    const courseId = input.sourceKey.split(":")[0];
    if (isCourseComplete(state.progress, courseId) && !hasEvent(state, "module.completed", courseId)) {
      const bonus = applyEvent(state, { type: "module.completed", sourceKey: courseId, at: input.at });
      if (!bonus.skipped) {
        state = bonus.state;
        added.push(...bonus.added);
      }
    }
  }

  if (!skipped) {
    const milestoneXp = state.streak >= 30 ? 150 : state.streak >= 14 ? 80 : state.streak >= 7 ? 50 : state.streak >= 3 ? 30 : 0;
    const milestoneKey = `streak:${state.streak}`;
    const already = hasEvent(state, "streak.milestone", milestoneKey);
    const existingMilestone = state.events.some((event) => event.type === "streak.milestone" && event.sourceKey === `streak:${state.streak}`);
    if (milestoneXp > 0 && !already && !existingMilestone) {
      const milestone = applyEvent(state, { type: "streak.milestone", sourceKey: milestoneKey, at: input.at, amount: milestoneXp });
      if (!milestone.skipped) {
        state = milestone.state;
        added.push(...milestone.added);
      }
    }
    emit(state);
  }

  return { state, added, skipped, newEvents: added };
}

export function completeLesson(courseId: string, lessonId: string): ApplyResult & { newEvents: GameEvent[] } {
  return recordEvent({ type: "lesson.completed", sourceKey: LESSON_PROGRESS_KEY(courseId, lessonId) });
}

export function recordQuiz(courseId: string, lessonId: string): ApplyResult & { newEvents: GameEvent[] } {
  return recordEvent({ type: "quiz.correct", sourceKey: LESSON_PROGRESS_KEY(courseId, lessonId) });
}

export function recordTerminalSave(): ApplyResult & { newEvents: GameEvent[] } {
  return recordEvent({ type: "terminal.saved", sourceKey: localDateKey() });
}

export function recordProjectCreated(projectId: string): ApplyResult & { newEvents: GameEvent[] } {
  return recordEvent({ type: "project.created", sourceKey: projectId });
}

export function setCapstoneItem(item: string, checked: boolean): ApplyResult & { newEvents: GameEvent[] } {
  const state = getState();
  if (Boolean(state.capstone[item]) === checked) {
    return { state, added: [], skipped: true, newEvents: [] };
  }
  if (checked) {
    const firstCheck = !state.events.some((event) => event.type === "capstone.item" && event.sourceKey === item);
    if (firstCheck) return recordEvent({ type: "capstone.item", sourceKey: item });
  }
  const sourceKey = `${item}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  return recordEvent({ type: "capstone.state", sourceKey, meta: { item, checked } });
}

export function saveProgress(courseId: string, lessonId: string, complete: boolean) {
  if (complete) {
    completeLesson(courseId, lessonId);
    return;
  }
  const state = getState();
  const key = LESSON_PROGRESS_KEY(courseId, lessonId);
  if (!state.progress[key]) return;
  emit({ ...state, progress: { ...state.progress, [key]: false }, updatedAt: new Date().toISOString() });
}

export function awardXp(amount: number, badge?: string) {
  const input: SyncEventInput = {
    type: "migration.v1",
    sourceKey: `manual:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    amount,
  };
  const result = recordEvent(input);
  if (badge) {
    const state = getState();
    const id = badge === "First Steps" ? "first-steps" : badge;
    if (!state.badges[id]) emit({ ...state, badges: { ...state.badges, [id]: new Date().toISOString() } });
  }
  return result.state;
}

export function setWeeklyGoal(goal: number) {
  const state = getState();
  emit({ ...state, weeklyGoal: Math.max(1, Math.min(14, Math.round(goal))), updatedAt: new Date().toISOString() });
}

export function applyServerState(serverState: Partial<GameState> & { events?: GameEvent[] }): GameState {
  const current = getState();
  const next = normalizeState({
    ...current,
    ...serverState,
    version: 2,
    events: serverState.events ?? current.events,
    updatedAt: new Date().toISOString(),
  });
  return emit(next);
}

export function resetGameStore() {
  cached = null;
  const storage = safeStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(MIGRATION_KEY);
    storage.removeItem(LEGACY_GAME_KEY);
    storage.removeItem(LEGACY_PROGRESS_KEY);
  }
  listeners.forEach((listener) => listener());
}

export type { GameState, Snapshot, GameEvent, SyncEventInput, Level };
export { levelForXp };
