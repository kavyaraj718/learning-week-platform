import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { Moon, Sun, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';

/* ---------- Count-up number ---------- */
export const CountUp = ({ value = 0, duration = 700, className = '' }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to = Number(value) || 0;
    prev.current = to;
    if (from === to) { setDisplay(to); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{display.toLocaleString()}</span>;
};

/* ---------- Circular progress ring ---------- */
export const ProgressRing = ({ value = 0, size = 92, stroke = 9, label }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, value) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#ringGrad)" strokeWidth={stroke}
          fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold leading-none">{Math.round(value)}%</div>
        {label && <div className="muted text-[10px] mt-0.5">{label}</div>}
      </div>
    </div>
  );
};

/* ---------- Stat tile ---------- */
export const StatTile = ({ icon: Icon, label, value, accent = '#6366f1', suffix = '', prefix = '', sub }) => (
  <div className="card p-4 shadow-card animate-rise">
    <div className="flex items-center justify-between">
      <span className="muted text-xs font-medium uppercase tracking-wide">{label}</span>
      {Icon && (
        <span className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: `${accent}1a`, color: accent }}>
          <Icon size={16} />
        </span>
      )}
    </div>
    <div className="mt-2 font-display text-2xl font-bold">
      {prefix}
      {typeof value === 'number' ? <CountUp value={value} /> : value}
      {suffix}
    </div>
    {sub && <div className="muted mt-1 text-xs">{sub}</div>}
  </div>
);

/* ---------- Podium medal ---------- */
const MEDAL = { 1: 'var(--gold,#FFD700)', 2: '#C0C0C0', 3: '#CD7F32' };
export const RankBadge = ({ rank }) => {
  if (rank <= 3) {
    const color = MEDAL[rank];
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-black"
        style={{ background: color, boxShadow: `0 0 0 2px ${color}55` }}>
        {rank}
      </span>
    );
  }
  return <span className="muted grid h-7 w-7 place-items-center text-sm font-semibold">{rank}</span>;
};

/* ---------- Loader ---------- */
export const Loader = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    <span className="muted text-sm">{label}</span>
  </div>
);

/* ---------- Empty state ---------- */
export const EmptyState = ({ icon: Icon, title, hint }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    {Icon && <Icon size={28} className="muted" />}
    <p className="font-semibold">{title}</p>
    {hint && <p className="muted text-sm">{hint}</p>}
  </div>
);

/* ---------- Section title ---------- */
export const SectionTitle = ({ children, action }) => (
  <div className="mb-3 flex items-center justify-between">
    <h2 className="font-display text-lg font-bold">{children}</h2>
    {action}
  </div>
);

/* ---------- Modal ---------- */
export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,10,15,0.55)' }} onClick={onClose}>
      <div className="card animate-pop max-h-[88vh] w-full overflow-auto p-5 shadow-glow"
        style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="muted hover:opacity-70"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

/* ---------- Theme toggle ---------- */
export const ThemeToggle = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('lw_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('lw_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return (
    <button className="btn btn-ghost !px-2.5" onClick={() => setDark((d) => !d)} title="Toggle theme">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

/* ---------- Live indicator ---------- */
export const LiveIndicator = () => {
  const { connected } = useSocket() || {};
  return (
    <span className="chip" style={{ borderColor: connected ? '#10b98155' : 'var(--border)' }}>
      <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse-dot' : ''}`}
        style={{ background: connected ? '#10b981' : '#9ca3af' }} />
      {connected ? 'Live' : 'Offline'}
    </span>
  );
};

/* ---------- Confetti helper ---------- */
export const celebrate = () => {
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ['#6366f1', '#FFD700', '#10b981', '#f43f5e'] });
};
