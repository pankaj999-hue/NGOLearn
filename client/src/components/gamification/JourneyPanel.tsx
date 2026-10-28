import { useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Award,
  Check,
  Code2,
  FolderKanban,
  Laptop,
  RefreshCcw,
  Rocket,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { localDateKey, shiftDateKey, type GameEvent, type SnapshotBadge } from "@shared/gamification";
import { useGamification } from "@/lib/gamification/useGamification";

const BADGE_ICONS: Record<string, typeof Trophy> = {
  steps: Check,
  laptop: Laptop,
  code: Code2,
  sparkles: Sparkles,
  rocket: Rocket,
  flame: Sparkles,
  hammer: Code2,
  folder: FolderKanban,
  check: Check,
  trophy: Trophy,
  refresh: RefreshCcw,
};

const EVENT_LABELS: Record<string, string> = {
  "lesson.completed": "Completed a lesson",
  "quiz.correct": "Tried a quiz",
  "terminal.saved": "Saved in the terminal",
  "project.created": "Started a project",
  "capstone.item": "Moved the capstone forward",
  "capstone.state": "Updated the capstone checklist",
  "module.completed": "Finished a module",
  "streak.milestone": "Reached a streak milestone",
  "mission.completed": "Completed a daily mission",
  "migration.v1": "Brought your progress to this device",
};

function BadgeItem({ badge }: { badge: SnapshotBadge }) {
  const Icon = BADGE_ICONS[badge.icon] ?? Award;
  return (
    <span className={badge.earnedAt ? "earned" : "locked"} title={badge.description}>
      <Icon size={13} /> {badge.name}
    </span>
  );
}

export function JourneyPanel() {
  const { snapshot: game, pending, syncing, online, syncNow } = useGamification();
  const earned = game.badges.filter((badge) => badge.earnedAt).length;
  const previousLevel = useRef<string | null>(null);

  useEffect(() => {
    if (!previousLevel.current) {
      previousLevel.current = game.level.name;
      return;
    }
    if (previousLevel.current !== game.level.name) {
      toast.success(`New level: ${game.level.name}. Your next small step unlocked it.`);
      previousLevel.current = game.level.name;
    }
  }, [game.level.name]);

  return (
    <div className="gamify-panel">
      <div className="gamify-level">
        <div className="level-badge"><Trophy size={21} /></div>
        <div className="level-copy">
          <span className="eyebrow">Your learning level</span>
          <h2>{game.level.name}</h2>
          <p>
            <b>{game.xp} XP</b> earned ·{" "}
            {game.nextLevel ? `${game.xpToNext} XP to ${game.nextLevel.name}` : "Top level reached"}
          </p>
          <div className="xp-track"><span style={{ width: `${game.levelPercent}%` }} /></div>
          <div className="level-meta">
            <span>{earned} / {game.badges.length} badges</span>
            <button className="sync-state" onClick={() => void syncNow()} title="Sync progress now">
              {syncing ? "Syncing..." : pending > 0 ? `${pending} to sync` : online ? "Synced" : "Saved offline"}
            </button>
          </div>
        </div>
      </div>
      <div className="gamify-right">
        <div className="streak-mini">
          <span className="streak-spark">✦</span>
          <div>
            <b>{game.streak} day{game.streak === 1 ? "" : "s"} in a row</b>
            <span>{game.freezes} grace day{game.freezes === 1 ? "" : "s"} available</span>
          </div>
        </div>
        <div className="daily-mission">
          <div className="mission-icon"><Sparkles size={19} /></div>
          <div>
            <span className="eyebrow">Today’s missions</span>
            <div className="mission-list">
              {game.missions.map((mission) => (
                <Link key={mission.key} href={mission.href} className={`mission-row ${mission.done ? "done" : ""}`}>
                  <span className="mission-check">{mission.done ? <Check size={12} /> : mission.progress}</span>
                  <span className="mission-copy"><b>{mission.title}</b><small>{mission.xp} XP · {mission.progress}/{mission.count}</small></span>
                  <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="badge-shelf">
        <div>
          <span className="eyebrow">Achievement shelf</span>
          <b>{earned} of {game.badges.length} badges unlocked</b>
        </div>
        <div className="badge-list">
          {game.badges.map((badge) => <BadgeItem key={badge.id} badge={badge} />)}
        </div>
      </div>
    </div>
  );
}

export function RecentActivity() {
  const { snapshot: game } = useGamification();
  const events = [...game.events]
    .filter((event) => event.type !== "mission.completed" && event.type !== "migration.v1" && event.type !== "capstone.state")
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 3);

  return (
    <div className="activity-list">
      {events.length === 0 ? (
        <div><span className="activity-dot yellow" /><p><b>Your journey starts here</b><small>Finish one lesson to see your momentum build</small></p><Sparkles size={17} /></div>
      ) : events.map((event: GameEvent) => (
        <div key={event.id}>
          <span className="activity-dot orange" />
          <p>
            <b>{EVENT_LABELS[event.type] ?? "Learning activity"}</b>
            <small>{new Date(event.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · +{event.amount} XP</small>
          </p>
          <Check size={17} />
        </div>
      ))}
    </div>
  );
}

export function WeekStrip() {
  const { snapshot: game } = useGamification();
  const today = localDateKey();
  const days = Array.from({ length: 7 }, (_, index) => shiftDateKey(today || new Date().toISOString().slice(0, 10), index - 6));
  const active = new Set(game.activityDates);

  return (
    <div className="week-strip" aria-label="Learning activity this week">
      {days.map((day) => {
        const label = new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "narrow" });
        return <span key={day} className={active.has(day) ? "done" : ""} title={day}>{label}</span>;
      })}
    </div>
  );
}

export function CertificateCallout() {
  const { snapshot: game } = useGamification();
  if (!game.certificate) return null;
  return (
    <Link href="/certificate" className="certificate-callout">
      <Award size={20} />
      <span><b>Your capstone certificate is ready</b><small>{game.certificate.pending ? "Saved here — it will be verified when you reconnect" : "View, print or share your certificate"}</small></span>
      <ArrowRight size={16} />
    </Link>
  );
}
