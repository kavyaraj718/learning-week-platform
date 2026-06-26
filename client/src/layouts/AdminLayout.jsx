import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  BarChart3, CalendarPlus, ClipboardList, Trophy, Upload, Sliders, Plug,
  LogOut, Menu, X, ArrowLeft, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ThemeToggle, LiveIndicator } from '../components/ui.jsx';

const NAV = [
  { to: '/admin', label: 'Analytics', icon: BarChart3, end: true },
  { to: '/admin/activities', label: 'Manage Activities', icon: CalendarPlus },
  { to: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
  { to: '/admin/winners', label: 'Winner Selection', icon: Trophy },
  { to: '/admin/upload', label: 'Bulk Upload', icon: Upload },
  { to: '/admin/points', label: 'Points Config', icon: Sliders },
  { to: '/admin/integrations', label: 'Integrations', icon: Plug },
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

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      <aside className="card sticky top-0 hidden h-screen w-60 flex-col gap-1 rounded-none border-y-0 border-l-0 p-4 lg:flex">
        <Brand />
        <nav className="mt-4 flex flex-1 flex-col gap-1"><NavItems /></nav>
        <Link to="/app" className="btn btn-ghost mb-2 justify-center text-sm"><ArrowLeft size={15} /> Employee view</Link>
        <button onClick={doLogout} className="btn btn-ghost justify-center text-sm"><LogOut size={15} /> Log out</button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-[800] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="card absolute left-0 top-0 flex h-full w-64 flex-col gap-1 rounded-none p-4 animate-rise">
            <div className="flex items-center justify-between"><Brand /><button onClick={() => setOpen(false)}><X size={18} /></button></div>
            <nav className="mt-4 flex flex-1 flex-col gap-1"><NavItems onNavigate={() => setOpen(false)} /></nav>
            <Link to="/app" onClick={() => setOpen(false)} className="btn btn-ghost mb-2 justify-center text-sm"><ArrowLeft size={15} /> Employee view</Link>
            <button onClick={doLogout} className="btn btn-ghost justify-center text-sm"><LogOut size={15} /> Log out</button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="card sticky top-0 z-30 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost !px-2.5 lg:hidden" onClick={() => setOpen(true)}><Menu size={18} /></button>
            <span className="chip" style={{ color: '#6366f1', borderColor: '#6366f155' }}><ShieldCheck size={13} /> Admin</span>
            <p className="font-display font-bold leading-none">{user?.name}</p>
          </div>
          <div className="flex items-center gap-2"><LiveIndicator /><ThemeToggle /></div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/admin" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
        <ShieldCheck size={18} />
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold">Admin Portal</p>
        <p className="muted text-[10px]">Learning Week 2026</p>
      </div>
    </Link>
  );
}
