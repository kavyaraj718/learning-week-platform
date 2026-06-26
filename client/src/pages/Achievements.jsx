import { useEffect, useState, useCallback } from 'react';
import { Crown, Flame, Heart, Users, Building2, Repeat, Medal, Award } from 'lucide-react';
import { recognitionApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLiveRefresh } from '../context/SocketContext.jsx';
import { Loader, SectionTitle } from '../components/ui.jsx';

export default function Achievements() {
  const { user } = useAuth();
  const [rec, setRec] = useState(null);

  const load = useCallback(async () => {
    const r = await recognitionApi.get();
    setRec(r.recognition);
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['recognition:update', 'leaderboard:update'], load);

  if (!rec) return <Loader label="Loading the hall of fame…" />;

  const cards = [
    { icon: Crown, title: 'Learning Week Champion', accent: '#FFD700', who: rec.learningWeekChampion?.name, meta: rec.learningWeekChampion && `${rec.learningWeekChampion.totalPoints} pts`, hint: 'Highest overall points' },
    { icon: Flame, title: 'Most Engaged Employee', accent: '#f59e0b', who: rec.mostEngagedEmployee?.name, meta: rec.mostEngagedEmployee && `${rec.mostEngagedEmployee.participationPct}% participation`, hint: 'Highest participation rate' },
    { icon: Heart, title: 'Social Engagement Champion', accent: '#f43f5e', who: rec.socialEngagementChampion?.name, meta: rec.socialEngagementChampion && `${rec.socialEngagementChampion.socialPoints} social pts`, hint: 'Highest social score' },
    { icon: Users, title: 'Team Champion', accent: '#6366f1', who: rec.teamChampion?.manager, meta: rec.teamChampion && `${rec.teamChampion.teamScore} team pts`, hint: 'Highest scoring team' },
    { icon: Building2, title: 'Department Champion', accent: '#10b981', who: rec.departmentChampion?.department, meta: rec.departmentChampion && `${rec.departmentChampion.totalPoints} pts`, hint: 'Top department' },
    { icon: Repeat, title: 'Consistency Award', accent: '#a855f7', who: rec.consistencyAward?.[0]?.name || '—', meta: rec.consistencyAward?.length ? `${rec.consistencyAward.length} qualified` : 'Nobody yet', hint: 'Joined every activity' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Achievements & Recognition</h1>
        <p className="muted text-sm">Hall of fame — recomputed live as the competition unfolds.</p>
      </div>

      {/* Your badges */}
      <section>
        <SectionTitle>Your badges</SectionTitle>
        {user?.badges?.length ? (
          <div className="flex flex-wrap gap-3">
            {user.badges.map((b) => (
              <div key={b} className="card flex items-center gap-2 px-4 py-3 shadow-card">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-500/15 text-amber-500"><Award size={18} /></span>
                <span className="text-sm font-semibold">{b}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="card muted p-4 text-sm shadow-card">No badges yet — win an activity or top a category to earn one.</p>
        )}
      </section>

      {/* Recognition categories */}
      <section>
        <SectionTitle>Award categories</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const isMe = c.who === user?.name;
            return (
              <div key={c.title} className="card relative overflow-hidden p-5 shadow-card">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-xl" style={{ background: `${c.accent}33` }} />
                <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${c.accent}1f`, color: c.accent }}>
                  <c.icon size={20} />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
                <p className="muted text-xs">{c.hint}</p>
                <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="font-display text-lg font-bold">{c.who || '—'} {isMe && <span className="text-brand-600">· you 🎉</span>}</p>
                  <p className="muted text-xs">{c.meta}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
