import { useEffect, useState, useCallback } from 'react';
import { Trophy, Save } from 'lucide-react';
import { activitiesApi } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLiveRefresh } from '../../context/SocketContext.jsx';
import { Loader, SectionTitle, RankBadge, celebrate } from '../../components/ui.jsx';

const PLACES = [
  { key: 'first', label: 'First place', rank: 1, points: 50 },
  { key: 'second', label: 'Second place', rank: 2, points: 30 },
  { key: 'third', label: 'Third place', rank: 3, points: 10 },
];

export default function WinnerSelection() {
  const { toast } = useToast();
  const [activities, setActivities] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [enrolled, setEnrolled] = useState([]);
  const [picks, setPicks] = useState({ first: '', second: '', third: '' });
  const [loading, setLoading] = useState(false);

  const loadActivities = useCallback(async () => {
    const r = await activitiesApi.list();
    setActivities(r.activities);
    if (!activityId && r.activities[0]) setActivityId(r.activities[0]._id);
  }, [activityId]);

  const loadActivity = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    const [regs, act] = await Promise.all([activitiesApi.registrations(activityId), activitiesApi.get(activityId)]);
    setEnrolled(regs.registrations.map((r) => r.employee).filter(Boolean));
    setPicks({
      first: act.activity.winners?.first?._id || '',
      second: act.activity.winners?.second?._id || '',
      third: act.activity.winners?.third?._id || '',
    });
    setLoading(false);
  }, [activityId]);

  useEffect(() => { loadActivities(); }, [loadActivities]);
  useEffect(() => { loadActivity(); }, [loadActivity]);
  useLiveRefresh(['activity:update'], loadActivity);

  const submit = async () => {
    try {
      await activitiesApi.winners(activityId, {
        first: picks.first || null, second: picks.second || null, third: picks.third || null,
      });
      celebrate();
      toast('Winners assigned and points awarded', 'success');
      loadActivity();
    } catch (e) { toast(e.message, 'error'); }
  };

  // Prevent the same person in two slots
  const optionsFor = (slot) => enrolled.filter((e) => {
    const taken = Object.entries(picks).filter(([k]) => k !== slot).map(([, v]) => v);
    return !taken.includes(e._id);
  });

  return (
    <div className="space-y-5">
      <SectionTitle>Winner Selection</SectionTitle>

      <select className="input sm:!w-96" value={activityId} onChange={(e) => setActivityId(e.target.value)}>
        {activities.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
      </select>

      {loading ? <Loader /> : (
        <div className="card max-w-2xl space-y-4 p-5 shadow-card">
          {enrolled.length === 0 ? (
            <p className="muted text-sm">No one is enrolled in this activity yet.</p>
          ) : (
            <>
              {PLACES.map((p) => (
                <div key={p.key} className="flex items-center gap-3">
                  <RankBadge rank={p.rank} />
                  <div className="flex-1">
                    <label className="muted mb-1 block text-xs font-medium">{p.label} · +{p.points} pts</label>
                    <select className="input" value={picks[p.key]} onChange={(e) => setPicks({ ...picks, [p.key]: e.target.value })}>
                      <option value="">— Select employee —</option>
                      {optionsFor(p.key).map((e) => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button className="btn btn-primary justify-center" onClick={submit}><Save size={15} /> Save winners & award points</button>
              <p className="muted text-xs">Re-submitting replaces previous winners and reverses their points automatically.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
