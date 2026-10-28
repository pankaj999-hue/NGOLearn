import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  FolderKanban,
  LockKeyhole,
  Sparkles,
  Trophy,
} from "lucide-react";
import { CAPSTONE_ITEMS, isCourseComplete, LESSON_PROGRESS_KEY, LESSONS_BY_COURSE, COURSES } from "@shared/catalog";
import { useGamification } from "@/lib/gamification/useGamification";
import { JourneyPanel, RecentActivity, WeekStrip, CertificateCallout } from "@/components/gamification/JourneyPanel";

const COURSE_ICONS = {
  "basic-computer": BookOpen,
  html: BookOpen,
  css: Sparkles,
  javascript: Sparkles,
} as const;

function coursePercent(progress: Record<string, boolean>, courseId: string) {
  const lessons = LESSONS_BY_COURSE[courseId] ?? [];
  if (lessons.length === 0) return 0;
  const done = lessons.filter((lesson) => progress[LESSON_PROGRESS_KEY(courseId, lesson.id)]).length;
  return Math.round((done / lessons.length) * 100);
}

function Bar({ value }: { value: number }) {
  return <div className="progress-track"><span className="progress-fill orange" style={{ width: `${Math.min(100, value)}%` }} /></div>;
}

export function DashboardView() {
  const { snapshot: game } = useGamification();
  const totalLessons = COURSES.reduce((sum, course) => sum + (LESSONS_BY_COURSE[course.id]?.length ?? 0), 0);
  const overall = totalLessons ? Math.round((game.completedLessons / totalLessons) * 100) : 0;
  const earnedBadges = game.badges.filter((badge) => badge.earnedAt).length;
  const active = COURSES.filter((course) => !isCourseComplete(game.progress, course.id));
  const nextCourse = active[0] ?? COURSES[COURSES.length - 1];
  const nextLessons = LESSONS_BY_COURSE[nextCourse.id] ?? [];
  const nextLesson = nextLessons.find((lesson) => !game.progress[LESSON_PROGRESS_KEY(nextCourse.id, lesson.id)]) ?? nextLessons[0];
  const capstoneDone = CAPSTONE_ITEMS.filter((item) => game.capstone[item]).length;
  const modulesDone = COURSES.filter((course) => isCourseComplete(game.progress, course.id)).length;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="page container dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <div className="eyebrow">{today}</div>
          <h1>Keep going.</h1>
          <p>Your next small step is waiting for you.</p>
        </div>
        <Link href={`/learn/${nextCourse.id}/${nextLesson?.id ?? "welcome"}`} className="button button-dark">
          {game.completedLessons === 0 ? "Start learning" : "Continue learning"} <ArrowRight size={17} />
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card orange">
          <span className="stat-icon"><BookOpen size={20} /></span>
          <b>{game.completedLessons}</b>
          <span>lessons completed</span>
        </div>
        <div className="stat-card yellow">
          <span className="stat-icon"><Trophy size={20} /></span>
          <b>{overall}%</b>
          <span>overall progress</span>
        </div>
        <div className="stat-card teal">
          <span className="stat-icon"><Sparkles size={20} /></span>
          <b>{earnedBadges}</b>
          <span>badges earned</span>
        </div>
        <div className="stat-card ink">
          <span className="stat-icon"><Flame size={20} /></span>
          <b>{game.streak}</b>
          <span>day streak</span>
        </div>
      </div>

      <JourneyPanel />
      <CertificateCallout />

      <div className="dashboard-grid">
        <section className="dashboard-main">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Continue learning</div>
              <h2>{active.length === 0 ? "You finished every module." : "Your active courses"}</h2>
            </div>
            <Link href="/courses" className="text-link">View all <ArrowRight size={15} /></Link>
          </div>
          <div className="active-course-list">
            {(active.length ? active : COURSES).slice(0, 3).map((course) => {
              const Icon = COURSE_ICONS[course.id as keyof typeof COURSE_ICONS] ?? BookOpen;
              const percent = coursePercent(game.progress, course.id);
              const lesson = (LESSONS_BY_COURSE[course.id] ?? []).find((item) => !game.progress[LESSON_PROGRESS_KEY(course.id, item.id)]) ?? (LESSONS_BY_COURSE[course.id] ?? [])[0];
              return (
                <div className="active-course" key={course.id}>
                  <div className={`active-course-icon ${course.color}`}><Icon size={22} /></div>
                  <div className="active-course-info">
                    <div className="course-kicker">MODULE {course.module} · {course.level}</div>
                    <h3>{course.subtitle}</h3>
                    <div className="active-progress"><Bar value={percent} /><span>{percent}%</span></div>
                  </div>
                  <Link href={`/learn/${course.id}/${lesson?.id ?? "welcome"}`} className="circle-arrow" aria-label={`Continue ${course.subtitle}`}>
                    <ArrowRight size={17} />
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="dashboard-project">
            <div>
              <div className="eyebrow">Your big idea</div>
              <h3>Build the NGO website</h3>
              <p>{modulesDone} of {COURSES.length} modules complete · {capstoneDone} of {CAPSTONE_ITEMS.length} capstone steps</p>
              <div className="locked-progress"><span style={{ width: `${Math.round((capstoneDone / CAPSTONE_ITEMS.length) * 100)}%` }} /></div>
              <small>{game.certificate ? "Certificate ready" : "Checklist saves on this device"}</small>
            </div>
            <div className="project-lock">
              {modulesDone === COURSES.length ? <CheckCircle2 size={22} /> : <LockKeyhole size={22} />}
              <span>{Math.round((capstoneDone / CAPSTONE_ITEMS.length) * 100)}%</span>
            </div>
            <Link href="/final-project" className="button button-light">View project brief <ArrowRight size={16} /></Link>
          </div>
        </section>

        <aside className="dashboard-side">
          <div className="side-panel">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Recent activity</div>
                <h2>Your momentum</h2>
              </div>
            </div>
            <RecentActivity />
          </div>
          <div className="side-panel streak-panel">
            <div className="streak-spark">✦</div>
            <b>{game.streak} day learning streak</b>
            <p>{game.freezes > 0 ? `${game.freezes} grace day is saved for a real-life interruption.` : "Small steps add up. Come back tomorrow to keep it going."}</p>
            <WeekStrip />
          </div>
          <div className="side-panel">
            <div className="eyebrow">Your workshop</div>
            <h3>Projects</h3>
            <p className="side-muted">Every project you start adds to your personal journey.</p>
            <Link href="/projects" className="text-link"><FolderKanban size={15} /> Open projects <ArrowRight size={14} /></Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
