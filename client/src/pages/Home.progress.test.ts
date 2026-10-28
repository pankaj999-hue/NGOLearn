import { beforeEach, describe, expect, it } from "vitest";
import {
  buildSnapshot,
  createEmptyState,
  isMissionDone,
  levelForXp,
  levelProgress,
  missionsForDate,
  nextStreak,
  type GameEvent,
} from "@shared/gamification";
import { CAPSTONE_ITEMS, LESSONS_BY_COURSE } from "@shared/catalog";
import {
  awardXp,
  completeLesson,
  getState,
  getProgress,
  isComplete,
  recordEvent,
  resetGameStore,
  saveProgress,
  setCapstoneItem,
} from "@/lib/gamification/store";

type MemoryStorage = Storage & { data: Record<string, string> };

const storage: MemoryStorage = {
  data: {},
  getItem(key) { return this.data[key] ?? null; },
  setItem(key, value) { this.data[key] = String(value); },
  removeItem(key) { delete this.data[key]; },
  clear() { this.data = {}; },
  key(index) { return Object.keys(this.data)[index] ?? null; },
  get length() { return Object.keys(this.data).length; },
};

describe("offline lesson progress", () => {
  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    resetGameStore();
  });

  it("persists a completed lesson and reads it back after a fresh helper call", () => {
    expect(isComplete("html", "structure")).toBe(false);
    saveProgress("html", "structure", true);
    expect(isComplete("html", "structure")).toBe(true);
    expect(getProgress()["html:structure"]).toBe(true);
  });

  it("keeps progress for multiple courses separate", () => {
    saveProgress("basic-computer", "welcome", true);
    saveProgress("css", "flexbox", true);
    expect(isComplete("basic-computer", "welcome")).toBe(true);
    expect(isComplete("css", "flexbox")).toBe(true);
    expect(isComplete("css", "selectors")).toBe(false);
  });

  it("turns a first completed lesson into XP and a badge", () => {
    completeLesson("basic-computer", "welcome");
    expect(getState().xp).toBeGreaterThanOrEqual(25);
    expect(Object.keys(getState().badges)).toContain("first-steps");
    awardXp(150);
    expect(levelForXp(getState().xp).name).toBe("Digital Explorer");
  });

  it("does not award the same lesson twice", () => {
    completeLesson("html", "structure");
    const afterFirst = getState().xp;
    completeLesson("html", "structure");
    expect(getState().xp).toBe(afterFirst);
    expect(getState().events.filter((event) => event.type === "lesson.completed")).toHaveLength(1);
  });

  it("migrates legacy device progress once", () => {
    storage.data["ngo-learn-game"] = JSON.stringify({ xp: 75, badges: ["First Steps"], streak: 2, lastActive: "2026-01-01" });
    storage.data["ngo-learn-progress"] = JSON.stringify({ "html:structure": true });
    const state = getState();
    expect(state.xp).toBe(75);
    expect(state.progress["html:structure"]).toBe(true);
    expect(state.badges["first-steps"]).toBeTruthy();
    expect(state.events.some((event) => event.type === "migration.v1")).toBe(true);
  });

  it("awards the module bonus only once", () => {
    for (const lesson of LESSONS_BY_COURSE.html) completeLesson("html", lesson.id);
    const bonuses = getState().events.filter((event) => event.type === "module.completed" && event.sourceKey === "html");
    expect(bonuses).toHaveLength(1);
  });

  it("keeps a certificate after a capstone item is unchecked", () => {
    for (const item of CAPSTONE_ITEMS) setCapstoneItem(item, true);
    const certificate = getState().certificate;
    const xp = getState().xp;
    expect(certificate).toBeTruthy();
    expect(getState().capstone[CAPSTONE_ITEMS[0]]).toBe(true);

    setCapstoneItem(CAPSTONE_ITEMS[0], false);
    expect(getState().capstone[CAPSTONE_ITEMS[0]]).toBe(false);
    expect(getState().certificate).toEqual(certificate);
    expect(getState().xp).toBe(xp);

    setCapstoneItem(CAPSTONE_ITEMS[0], true);
    expect(getState().capstone[CAPSTONE_ITEMS[0]]).toBe(true);
    expect(getState().certificate).toEqual(certificate);
    expect(getState().xp).toBe(xp);
  });
});

describe("level and mission math", () => {
  it("uses the real gap between level thresholds", () => {
    expect(levelProgress(0).xpToNext).toBe(150);
    expect(levelProgress(400).level.name).toBe("Page Builder");
    expect(levelProgress(400).xpToNext).toBe(400);
    expect(levelProgress(2200).next).toBeNull();
    expect(levelProgress(2200).percent).toBe(100);
  });

  it("produces the same three missions for a given date", () => {
    const first = missionsForDate("2026-03-04");
    const again = missionsForDate("2026-03-04");
    expect(first).toHaveLength(3);
    expect(first.map((mission) => mission.key)).toEqual(again.map((mission) => mission.key));
    expect(new Set(first.map((mission) => mission.key)).size).toBe(3);
  });

  it("marks a mission done from real events", () => {
    const mission = missionsForDate("2026-03-04").find((item) => item.eventType === "lesson.completed") ?? missionsForDate("2026-03-04")[0];
    const events: GameEvent[] = [{
      id: "1",
      type: "lesson.completed",
      sourceKey: "html:structure",
      amount: 25,
      at: "2026-03-04T10:00:00.000Z",
    }];
    if (mission.eventType === "lesson.completed") {
      expect(isMissionDone(events, "2026-03-04", mission, "UTC")).toBe(true);
    }
  });
});

describe("streak rules", () => {
  it("continues on consecutive days", () => {
    const result = nextStreak({ streak: 2, longestStreak: 2, lastActiveDate: "2026-03-03", freezes: 1 }, "2026-03-04");
    expect(result.streak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it("uses one grace day for a single missed day", () => {
    const result = nextStreak({ streak: 4, longestStreak: 4, lastActiveDate: "2026-03-02", freezes: 1 }, "2026-03-04");
    expect(result.streak).toBe(5);
    expect(result.freezes).toBe(0);
    expect(result.freezeUsed).toBe(true);
  });

  it("resets after a longer break", () => {
    const result = nextStreak({ streak: 9, longestStreak: 9, lastActiveDate: "2026-02-01", freezes: 1 }, "2026-03-04");
    expect(result.streak).toBe(1);
    expect(result.longestStreak).toBe(9);
  });
});

describe("snapshot", () => {
  it("returns badge criteria and daily missions", () => {
    recordEvent({ type: "terminal.saved", sourceKey: "2026-03-04" });
    const snapshot = buildSnapshot(getState());
    expect(snapshot.badges.find((badge) => badge.id === "maker")?.earnedAt).toBeTruthy();
    expect(snapshot.missions).toHaveLength(3);
    expect(snapshot.level.name).toBe("First Click");
  });

  it("keeps an empty state valid", () => {
    const snapshot = buildSnapshot(createEmptyState());
    expect(snapshot.xp).toBe(0);
    expect(snapshot.badges).toHaveLength(12);
    expect(snapshot.completedLessons).toBe(0);
  });
});
