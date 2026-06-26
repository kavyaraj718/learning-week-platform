import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, Hash, CalendarCheck, Trophy, Heart, Users, TrendingUp, TrendingDown,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { employeesApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLiveRefresh } from '../context/SocketContext.jsx';
import { StatTile, ProgressRing, Loader, SectionTitle, CountUp } from '../components/ui.jsx';

const SOURCE_COLOR = { participation: '#6366f1', winner: '#f59e0b', bonus: '#f43f5e', social: '#10b981' };
const timeAgo = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [d, setD] = useState(null);

  const load = useCallback(async () => {
    if (!user?._id) return;
    const r = await employeesApi.dashboard(user._id);
    setD(r.dashboard);
  }, [user?._id]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['points:update', 'leaderboard:update'], () => { load(); refreshUser(); });

  if (!d) return <Loader label="Building your dashboard…" />;

  const buckets = d.buckets;
  const bucketTotal = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Your Dashboard</h1>
        <p className="muted text-sm">Here's how you're tracking this Learning Week.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Coins} label="Total Points" value={d.totalPoints} accent="#f59e0b" />
        <StatTile icon={Hash} label="Org Rank" value={`#${d.rank}`} accent="#6366f1" />
        <StatTile icon={CalendarCheck} label="Activities Joined" value={d.activitiesJoined} accent="#0ea5e9" />
        <StatTile icon={Trophy} label="Activities Won" value={d.activitiesWon} accent="#10b981" />
        <StatTile icon={Heart} label="Social Score" value={d.socialPoints} accent="#f43f5e" />
        <StatTile icon={Users} label="Team Rank" value={d.teamRank ? `#${d.teamRank}` : '—'} accent="#a855f7"
          sub={d.teamName} />

        {/* Participation ring */}
        <div className="card col-span-2 flex items-center gap-4 p-4 shadow-card">
          <ProgressRing value={d.participationPct} label="joined" />
          <div>
            <p className="muted text-xs font-medium uppercase tracking-wide">Participation Rate</p>
            <p className="font-display text-2xl font-bold">{d.participationPct}%</p>
            <p className="muted text-xs">across all activities</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Points breakdown + recent */}
        <section className="lg:col-span-2 space-y-6">
          <div className="card p-4 shadow-card">
            <SectionTitle>Points breakdown</SectionTitle>
            <div className="flex h-3 overflow-hidden rounded-full surface-2">
              {Object.entries(buckets).map(([k, v]) => v > 0 && (
                <div key={k} style={{ width: `${(v / bucketTotal) * 100}%`, background: SOURCE_COLOR[k], transition: 'width .8s ease' }} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(buckets).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: SOURCE_COLOR[k] }} />
                  <span className="text-xs capitalize muted">{k}</span>
                  <span className="ml-auto text-xs font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Recent points</SectionTitle>
            <div className="card divide-y overflow-hidden shadow-card" style={{ borderColor: 'var(--border)' }}>
              {d.recentPoints.length === 0 && <p className="muted p-4 text-sm">No points yet — enroll in an activity to get started.</p>}
              {d.recentPoints.map((p) => (
                <div key={p._id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
                  <span className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold capitalize"
                    style={{ background: `${SOURCE_COLOR[p.source]}1a`, color: SOURCE_COLOR[p.source] }}>
                    {p.source[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.note || p.source}</p>
                    <p className="muted text-xs">{timeAgo(p.createdAt)}</p>
                  </div>
                  <span className="font-semibold" style={{ color: p.amount >= 0 ? '#10b981' : '#f43f5e' }}>
                    {p.amount >= 0 ? '+' : ''}{p.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Side: next activity + competitors */}
        <section className="space-y-6">
          <div>
            <SectionTitle>Next up</SectionTitle>
            {d.nextActivity ? (
              <Link to={`/app/activities/${d.nextActivity._id}`} className="card block p-4 shadow-card transition hover:shadow-glow">
                <span className="chip" style={{ color: '#6366f1', borderColor: '#6366f155' }}><Sparkles size={12} /> {d.nextActivity.type}</span>
                <p className="mt-2 font-display font-bold">{d.nextActivity.name}</p>
                <p className="muted text-xs">{new Date(d.nextActivity.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · {d.nextActivity.time}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Enroll <ArrowRight size={14} /></span>
              </Link>
            ) : <p className="muted card p-4 text-sm shadow-card">You've joined everything available 🎉</p>}
          </div>

          <div>
            <SectionTitle>Nearby rivals</SectionTitle>
            <div className="space-y-2">
              {d.competitors.above && (
                <div className="card flex items-center gap-2 p-3 shadow-card">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span className="text-sm">Catch <b>{d.competitors.above.name}</b></span>
                  <span className="muted ml-auto text-xs">{d.competitors.above.totalPoints - d.totalPoints} ahead</span>
                </div>
              )}
              {d.competitors.below && (
                <div className="card flex items-center gap-2 p-3 shadow-card">
                  <TrendingDown size={16} className="text-rose-500" />
                  <span className="text-sm"><b>{d.competitors.below.name}</b> behind</span>
                  <span className="muted ml-auto text-xs">{d.totalPoints - d.competitors.below.totalPoints} pts</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
