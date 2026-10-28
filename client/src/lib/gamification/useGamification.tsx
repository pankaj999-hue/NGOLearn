import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { buildSnapshot, type GameEvent, type GameState, type Snapshot } from "@shared/gamification";
import { trpc } from "@/lib/trpc";
import {
  applyServerState,
  completeLesson as completeLessonLocal,
  getState,
  invalidateFromStorage,
  recordProjectCreated as recordProjectCreatedLocal,
  recordQuiz as recordQuizLocal,
  recordTerminalSave as recordTerminalSaveLocal,
  setCapstoneItem as setCapstoneItemLocal,
  setWeeklyGoal as setWeeklyGoalLocal,
  subscribe,
} from "./store";
import { enqueue, pendingCount, removeQueued, subscribeQueue, takeQueue } from "./sync";

function getTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function stateFromSnapshot(snapshot: Snapshot): Partial<GameState> {
  const badges: Record<string, string> = {};
  for (const badge of snapshot.badges) {
    if (badge.earnedAt) badges[badge.id] = badge.earnedAt;
  }
  return {
    xp: snapshot.xp,
    streak: snapshot.streak,
    longestStreak: snapshot.longestStreak,
    lastActiveDate: snapshot.lastActiveDate,
    freezes: snapshot.freezes,
    weeklyGoal: snapshot.weeklyGoal,
    badges,
    progress: snapshot.progress,
    capstone: snapshot.capstone,
    certificate: snapshot.certificate,
    events: snapshot.events,
  };
}

type LocalResult = { newEvents: GameEvent[] };

type GamificationContextValue = {
  snapshot: Snapshot;
  state: GameState;
  online: boolean;
  syncing: boolean;
  pending: number;
  error: string | null;
  syncNow: () => Promise<void>;
  refresh: () => void;
  completeLesson: (courseId: string, lessonId: string) => LocalResult;
  recordQuiz: (courseId: string, lessonId: string) => LocalResult;
  recordTerminalSave: () => LocalResult;
  recordProjectCreated: (projectId: string) => LocalResult;
  setCapstoneItem: (item: string, checked: boolean) => LocalResult;
  setWeeklyGoal: (goal: number) => LocalResult;
};

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const timezone = useMemo(getTimeZone, []);
  const utils = trpc.useUtils();
  const state = useSyncExternalStore(subscribe, getState, getState);
  const pending = useSyncExternalStore(subscribeQueue, pendingCount, pendingCount);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flushing = useRef(false);

  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const guestMutation = trpc.auth.guest.useMutation({
    onSuccess: (user) => {
      utils.auth.me.setData(undefined, user);
      void utils.gamification.snapshot.invalidate();
    },
  });
  const guestTried = useRef(false);

  useEffect(() => {
    if (meQuery.isLoading || meQuery.data || guestMutation.isPending || guestTried.current) return;
    guestTried.current = true;
    guestMutation.mutate({ timezone });
  }, [meQuery.isLoading, meQuery.data, guestMutation, timezone]);

  useEffect(() => {
    const migrations = getState().events.filter((event) => event.type === "migration.v1");
    if (migrations.length > 0) enqueue(migrations);
  }, []);

  const snapshotQuery = trpc.gamification.snapshot.useQuery(
    { timezone },
    { enabled: Boolean(meQuery.data), retry: false, refetchOnWindowFocus: false }
  );

  const syncMutation = trpc.gamification.sync.useMutation();

  const flush = useCallback(async () => {
    if (flushing.current || !meQuery.data) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const { events, keys } = takeQueue();
    if (events.length === 0) return;
    flushing.current = true;
    setSyncing(true);
    try {
      const result = await syncMutation.mutateAsync({ events, timezone });
      removeQueued(keys);
      applyServerState(result.state as GameState);
      utils.gamification.snapshot.setData({ timezone }, result);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reach the progress server.");
    } finally {
      flushing.current = false;
      setSyncing(false);
    }
  }, [meQuery.data, syncMutation, timezone, utils]);

  useEffect(() => {
    if (!snapshotQuery.data) return;
    if (pendingCount() > 0) {
      void flush();
      return;
    }
    applyServerState(stateFromSnapshot(snapshotQuery.data.snapshot));
  }, [snapshotQuery.data, flush]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flush]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "ngo-learn-game-v2") invalidateFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    void flush();
    const timer = window.setInterval(() => {
      if (pendingCount() > 0) void flush();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [flush]);

  const afterLocal = useCallback(
    (result: LocalResult) => {
      if (result.newEvents.length > 0) {
        enqueue(result.newEvents);
        if (typeof navigator === "undefined" || navigator.onLine) void flush();
      }
    },
    [flush]
  );

  const completeLesson = useCallback(
    (courseId: string, lessonId: string) => {
      const result = completeLessonLocal(courseId, lessonId);
      afterLocal(result);
      return result;
    },
    [afterLocal]
  );

  const recordQuiz = useCallback(
    (courseId: string, lessonId: string) => {
      const result = recordQuizLocal(courseId, lessonId);
      afterLocal(result);
      return result;
    },
    [afterLocal]
  );

  const recordTerminalSave = useCallback(() => {
    const result = recordTerminalSaveLocal();
    afterLocal(result);
    return result;
  }, [afterLocal]);

  const recordProjectCreated = useCallback(
    (projectId: string) => {
      const result = recordProjectCreatedLocal(projectId);
      afterLocal(result);
      return result;
    },
    [afterLocal]
  );

  const setCapstoneItem = useCallback(
    (item: string, checked: boolean) => {
      const result = setCapstoneItemLocal(item, checked);
      afterLocal(result);
      return result;
    },
    [afterLocal]
  );

  const updateWeeklyGoal = useCallback((goal: number) => {
    setWeeklyGoalLocal(goal);
    return { newEvents: [] };
  }, []);

  const value = useMemo<GamificationContextValue>(
    () => ({
      snapshot: buildSnapshot(state, timezone),
      state,
      online,
      syncing,
      pending,
      error,
      syncNow: flush,
      refresh: () => {
        void snapshotQuery.refetch();
        void flush();
      },
      completeLesson,
      recordQuiz,
      recordTerminalSave,
      recordProjectCreated,
      setCapstoneItem,
      setWeeklyGoal: updateWeeklyGoal,
    }),
    [
      state,
      timezone,
      online,
      syncing,
      pending,
      error,
      flush,
      snapshotQuery,
      completeLesson,
      recordQuiz,
      recordTerminalSave,
      recordProjectCreated,
      setCapstoneItem,
      updateWeeklyGoal,
    ]
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification(): GamificationContextValue {
  const value = useContext(GamificationContext);
  if (!value) throw new Error("useGamification must be used inside GamificationProvider");
  return value;
}
