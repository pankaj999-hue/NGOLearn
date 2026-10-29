import { useEffect } from "react";
import { Route, Switch, Link, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  ClipboardCheck,
  Code2,
  Download,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Network,
  Sparkles,
  TerminalSquare,
  WifiOff,
  X,
} from "lucide-react";
import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GamificationProvider } from "./lib/gamification/useGamification";
import { CertificatePage, VerifyPage } from "./pages/Certificate";
import {
  AboutPage,
  AdminPage,
  CoursesPage,
  DashboardPage,
  DownloadsPage,
  FinalProjectPage,
  Home,
  LearnPage,
  ProjectsPage,
  TerminalPage,
} from "./pages/Home";

const navItems = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard", label: "My Learning", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/terminal", label: "Terminal", icon: TerminalSquare },
  { href: "/about", label: "About NGO", icon: Network },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch(() => undefined);
      if ("caches" in window) caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => undefined);
      return;
    }
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="offline-ribbon"><WifiOff size={13} /> Offline-first learning mode <span>•</span> Your progress saves on this device</div>
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark"><Boxes size={19} strokeWidth={2.4} /></span>
            <span>NGO<span className="brand-accent">Learn</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}><Icon size={15} />{item.label}</Link>;
            })}
          </nav>
          <div className="header-actions">
            <span className="online-pill"><span className="status-dot" /> Online</span>
            <Link href="/dashboard" className="avatar-button" aria-label="Open student dashboard">AM</Link>
            <button className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
        {menuOpen && <div className="mobile-nav">
          {navItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="mobile-nav-link"><Icon size={17} />{item.label}<ArrowRight size={15} /></Link>; })}
        </div>}
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div><div className="brand footer-brand"><span className="brand-mark"><Boxes size={17} /></span><span>NGO<span className="brand-accent">Learn</span></span></div><p>Practical digital skills, made accessible.</p></div>
        <div className="footer-links"><Link href="/courses">Explore courses</Link><Link href="/terminal">Open terminal</Link><Link href="/about">Our mission</Link></div>
        <div className="footer-note">Built for curious minds<br /><span>© 2026 Community Learning Lab</span></div>
      </footer>
    </div>
  );
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/courses" component={CoursesPage} />
    <Route path="/courses/:courseId" component={LearnPage} />
    <Route path="/learn/:courseId/:lessonId" component={LearnPage} />
    <Route path="/dashboard" component={DashboardPage} />
    <Route path="/downloads" component={DownloadsPage} />
    <Route path="/terminal" component={TerminalPage} />
    <Route path="/projects" component={ProjectsPage} />
    <Route path="/projects/:projectId" component={TerminalPage} />
    <Route path="/final-project" component={FinalProjectPage} />
    <Route path="/certificate" component={CertificatePage} />
    <Route path="/verify/:code" component={VerifyPage} />
    <Route path="/about" component={AboutPage} />
    <Route path="/admin" component={AdminPage} />
    <Route component={Home} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><GamificationProvider><Toaster /><AppShell><Router /></AppShell></GamificationProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

// Keep these imports referenced in the shell bundle for a crisp first-load icon set.
void Code2; void ClipboardCheck;
