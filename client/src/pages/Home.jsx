import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Users, Activity as ActivityIcon, Coins, Swords,
  CalendarDays, Trophy, Medal, CalendarClock, User, ArrowRight,
} from 'lucide-react';
import { statsApi, leaderboardsApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLiveRefresh } from '../context/SocketContext.jsx';
import { CountUp, RankBadge, Loader, SectionTitle } from '../components/ui.jsx';

const QUICK = [
  { to: '/app/activities', label: 'Activities', icon: CalendarDays, accent: '#6366f1' },
  { to: '/app/leaderboards', label: 'Leaderboards', icon: Trophy, accent: '#f59e0b' },
  { to: '/app/profile', label: 'My Profile', icon: User, accent: '#10b981' },
  { to: '/app/achievements', label: 'Achievements', icon: Medal, accent: '#f43f5e' },
  { to: '/app/events', label: 'Upcoming Events', icon: CalendarClock, accent: '#0ea5e9' },
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [s, board, t] = await Promise.all([
      statsApi.live(), leaderboardsApi.organization(10), leaderboardsApi.team(),
    ]);
    setStats(s.stats); setTop(board.leaderboard); setTeams(t.leaderboard.slice(0, 5));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['stats:update', 'leaderboard:update'], load);

  if (loading) return <Loader label="Loading Learning Week…" />;

  const liveStats = [
    { label: 'Total Participants', value: stats.totalParticipants, icon: Users, accent: '#6366f1' },
    { label: 'Activities Running', value: stats.activitiesRunning, icon: ActivityIcon, accent: '#10b981' },
    { label: 'Total Points Awarded', value: stats.totalPointsAwarded, icon: Coins, accent: '#f59e0b' },
    { label: 'Teams Competing', value: stats.teamsCompeting, icon: Swords, accent: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-8 text-white shadow-glow">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-amber-glow/20 blur-2xl" />
        <span className="chip border-white/30 bg-white/10 text-white"><Sparkles size={13} /> Learning Week 2026</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-2 text-lg font-medium text-white/85">Learn • Engage • Compete • Win</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/app/activities" className="btn bg-white text-brand-700 hover:bg-white/90">
            Browse activities <ArrowRight size={15} />
          </Link>
          <Link to="/app/leaderboards" className="btn border-white/40 bg-white/10 text-white hover:bg-white/20">
            View leaderboard
          </Link>
        </div>
      </section>

      {/* Live stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {liveStats.map((s) => (
          <div key={s.label} className="card p-4 shadow-card">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${s.accent}1a`, color: s.accent }}>
              <s.icon size={18} />
            </span>
            <div className="mt-3 font-display text-2xl font-bold"><CountUp value={s.value} /></div>
            <div className="muted text-xs">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Quick access */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className="card flex flex-col items-center gap-2 p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${q.accent}1a`, color: q.accent }}>
              <q.icon size={18} />
            </span>
            <span className="text-xs font-semibold">{q.label}</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top 10 preview */}
        <section className="lg:col-span-2">
          <SectionTitle action={<Link to="/app/leaderboards" className="text-sm font-semibold text-brand-600 hover:underline">Full board →</Link>}>
            🏆 Live Leaderboard — Top 10
          </SectionTitle>
          <div className="card divide-y overflow-hidden shadow-card" style={{ borderColor: 'var(--border)' }}>
            {top.map((r) => {
              const mine = String(r._id) === String(user?._id);
              return (
                <div key={r._id} className="flex items-center gap-3 px-4 py-2.5"
                  style={{ background: mine ? 'rgba(99,102,241,0.08)' : 'transparent', borderColor: 'var(--border)' }}>
                  <RankBadge rank={r.rank} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}{mine && <span className="muted"> · you</span>}</p>
                    <p className="muted truncate text-xs">{r.department} · {r.location}</p>
                  </div>
                  <span className="font-display font-bold text-brand-600"><CountUp value={r.totalPoints} /></span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Team tracker */}
        <section>
          <SectionTitle>⚔️ Team Tracker</SectionTitle>
          <div className="space-y-2">
            {teams.map((t) => (
              <div key={t.manager} className="card p-3 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RankBadge rank={t.rank} />
                    <div>
                      <p className="text-sm font-semibold">{t.manager}</p>
                      <p className="muted text-[11px]">{t.teamSize} members · {t.avgParticipation}% avg</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-brand-600"><CountUp value={t.teamScore} /></span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full surface-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    style={{ width: `${Math.min(100, (t.teamScore / (teams[0]?.teamScore || 1)) * 100)}%`, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
