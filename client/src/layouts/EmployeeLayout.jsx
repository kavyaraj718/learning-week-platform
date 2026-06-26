import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  Home, LayoutDashboard, CalendarDays, Trophy, User, Medal, CalendarClock,
  LogOut, Menu, X, ShieldCheck, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ThemeToggle, LiveIndicator } from '../components/ui.jsx';

const NAV = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/activities', label: 'Activities', icon: CalendarDays },
  { to: '/app/leaderboards', label: 'Leaderboards', icon: Trophy },
  { to: '/app/achievements', label: 'Achievements', icon: Medal },
  { to: '/app/events', label: 'Upcoming Events', icon: CalendarClock },
  { to: '/app/profile', label: 'My Profile', icon: User },
];

function NavItems({ onNavigate }) {
  return NAV.map((n) => (
    <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive ? 'bg-brand-600 text-white shadow-glow' : 'muted hover:bg-[var(--surface-2)]'
        }`}>
      <n.icon size={17} /> {n.label}
    </NavLink>
  ));
}

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="card sticky top-0 hidden h-screen w-60 flex-col gap-1 rounded-none border-y-0 border-l-0 p-4 lg:flex">
        <Brand />
        <nav className="mt-4 flex flex-1 flex-col gap-1"><NavItems /></nav>
        {user?.role === 'admin' && (
          <Link to="/admin" className="btn btn-ghost mb-2 justify-center text-sm">
            <ShieldCheck size={15} /> Admin portal
          </Link>
        )}
        <UserCard user={user} onLogout={doLogout} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[800] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="card absolute left-0 top-0 flex h-full w-64 flex-col gap-1 rounded-none p-4 animate-rise">
            <div className="flex items-center justify-between"><Brand /><button onClick={() => setOpen(false)}><X size={18} /></button></div>
            <nav className="mt-4 flex flex-1 flex-col gap-1"><NavItems onNavigate={() => setOpen(false)} /></nav>
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setOpen(false)} className="btn btn-ghost mb-2 justify-center text-sm">
                <ShieldCheck size={15} /> Admin portal
              </Link>
            )}
            <UserCard user={user} onLogout={doLogout} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="card sticky top-0 z-30 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost !px-2.5 lg:hidden" onClick={() => setOpen(true)}><Menu size={18} /></button>
            <div className="hidden sm:block">
              <p className="muted text-xs">Welcome back</p>
              <p className="font-display font-bold leading-none">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LiveIndicator />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/app" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
        <Sparkles size={18} />
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold">Learning Week</p>
        <p className="muted text-[10px]">2026 · Compete & Win</p>
      </div>
    </Link>
  );
}

function UserCard({ user, onLogout }) {
  return (
    <div className="card surface-2 flex items-center gap-2 p-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
        {user?.name?.[0]?.toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{user?.name}</p>
        <p className="muted truncate text-[10px]">{user?.totalPoints ?? 0} pts</p>
      </div>
      <button onClick={onLogout} className="muted hover:text-rose-500" title="Log out"><LogOut size={16} /></button>
    </div>
  );
}
