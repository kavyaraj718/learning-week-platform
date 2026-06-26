import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Wifi, MapPin, Award, Users, Trophy, CheckCircle2,
} from 'lucide-react';
import { activitiesApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLiveRefresh } from '../context/SocketContext.jsx';
import { Loader, celebrate, RankBadge } from '../components/ui.jsx';

const PLACES = [
  { key: 'first', label: '1st', rank: 1 },
  { key: 'second', label: '2nd', rank: 2 },
  { key: 'third', label: '3rd', rank: 3 },
];

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [activity, setActivity] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await activitiesApi.get(id);
    setActivity(r.activity);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['activity:update'], load);

  const enroll = async () => {
    setBusy(true);
    try {
      const r = await activitiesApi.enroll(id);
      celebrate();
      toast(r.message, 'success');
      await refreshUser();
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  if (!activity) return <Loader label="Loading activity…" />;

  const isVirtual = activity.type === 'Virtual';
  const enrolled = !!activity.myStatus;
  const hasWinners = activity.winners && (activity.winners.first || activity.winners.second || activity.winners.third);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/app/activities" className="muted inline-flex items-center gap-1 text-sm hover:text-brand-600">
        <ArrowLeft size={15} /> All activities
      </Link>

      <div className="card overflow-hidden shadow-card">
        <div className="bg-gradient-to-br from-brand-600 to-indigo-800 p-6 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-white/30 bg-white/10 text-white">
              {isVirtual ? <Wifi size={12} /> : <MapPin size={12} />} {activity.type}
            </span>
            <span className="chip border-white/30 bg-white/10 text-white"><Award size={12} /> +{activity.participationPoints} pts</span>
            <span className="chip border-white/30 bg-white/10 text-white capitalize">{activity.status}</span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold">{activity.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
            <span className="inline-flex items-center gap-1"><Calendar size={14} /> {new Date(activity.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            {activity.time && <span className="inline-flex items-center gap-1"><Clock size={14} /> {activity.time}</span>}
            <span className="inline-flex items-center gap-1"><Users size={14} /> {activity.enrolledCount} enrolled</span>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <h2 className="mb-1 font-semibold">About this activity</h2>
            <p className="muted text-sm">{activity.description || 'No description provided.'}</p>
            <p className="muted mt-1 text-xs">Category: {activity.category}</p>
          </div>

          {enrolled ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
              <CheckCircle2 size={18} /> You're {activity.myStatus === 'won' ? 'a winner of' : 'enrolled in'} this activity.
            </div>
          ) : (
            <button onClick={enroll} disabled={busy} className="btn btn-primary w-full justify-center">
              {busy ? 'Enrolling…' : `Enroll now · +${activity.participationPoints} points`}
            </button>
          )}

          {hasWinners && (
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><Trophy size={16} className="text-amber-500" /> Winners</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {PLACES.map((p) => {
                  const w = activity.winners[p.key];
                  return (
                    <div key={p.key} className="card surface-2 flex items-center gap-2 p-3">
                      <RankBadge rank={p.rank} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{w?.name || '—'}</p>
                        <p className="muted text-[11px]">{p.label} place</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
