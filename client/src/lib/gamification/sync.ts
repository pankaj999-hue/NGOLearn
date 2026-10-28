import type { GameEvent, SyncEventInput } from "@shared/gamification";

const QUEUE_KEY = "ngo-learn-sync-queue";
const MAX_QUEUE = 500;

type QueuedEvent = SyncEventInput & { queuedAt: string };

const listeners = new Set<() => void>();

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readQueue(): QueuedEvent[] {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.type === "string" && typeof item.sourceKey === "string");
  } catch {
    return [];
  }
}

function writeQueue(events: QueuedEvent[]) {
  const storage = safeStorage();
  if (storage) storage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_QUEUE)));
  listeners.forEach((listener) => listener());
}

function keyOf(event: SyncEventInput): string {
  return `${event.type}|${event.sourceKey}`;
}

export function subscribeQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pendingCount(): number {
  return readQueue().length;
}

export function pendingEvents(): SyncEventInput[] {
  return readQueue().map(({ type, sourceKey, at, amount, meta }) => ({ type, sourceKey, at, amount, meta }));
}

export function enqueue(events: GameEvent[] | SyncEventInput[]): number {
  if (events.length === 0) return readQueue().length;
  const queue = readQueue();
  const seen = new Set(queue.map(keyOf));
  const now = new Date().toISOString();
  for (const event of events) {
    const key = keyOf(event);
    if (seen.has(key)) continue;
    seen.add(key);
    queue.push({
      type: event.type,
      sourceKey: event.sourceKey,
      at: "at" in event && event.at ? event.at : now,
      ...("amount" in event && event.amount !== undefined ? { amount: event.amount } : {}),
      ...("meta" in event && event.meta ? { meta: event.meta } : {}),
      queuedAt: now,
    });
  }
  writeQueue(queue);
  return queue.length;
}

export function removeQueued(events: SyncEventInput[]): number {
  if (events.length === 0) return readQueue().length;
  const sent = new Set(events.map(keyOf));
  const queue = readQueue().filter((event) => !sent.has(keyOf(event)));
  writeQueue(queue);
  return queue.length;
}

export function clearQueue(): number {
  writeQueue([]);
  return 0;
}

export function takeQueue(): { events: SyncEventInput[]; keys: SyncEventInput[] } {
  const events = pendingEvents();
  return { events, keys: events };
}
