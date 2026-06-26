import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, CalendarX } from 'lucide-react';
import { activitiesApi } from '../api/index.js';
import { useLiveRefresh } from '../context/SocketContext.jsx';
import ActivityCard from '../components/ActivityCard.jsx';
import { Loader, EmptyState } from '../components/ui.jsx';

const TYPES = ['All', 'Virtual', 'On-Ground'];
const STATUSES = ['All', 'Not enrolled', 'Enrolled', 'Won'];

export default function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  const load = useCallback(async () => {
    const r = await activitiesApi.list();
    setActivities(r.activities);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['activity:update'], load);

  const filtered = useMemo(() => activities.filter((a) => {
    if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (type !== 'All' && a.type !== type) return false;
    if (status === 'Not enrolled' && a.myStatus) return false;
    if (status === 'Enrolled' && !a.myStatus) return false;
    if (status === 'Won' && a.myStatus !== 'won') return false;
    return true;
  }), [activities, q, type, status]);

  if (loading) return <Loader label="Loading activities…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Activities</h1>
        <p className="muted text-sm">Enroll to earn participation points instantly.</p>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 p-3 shadow-card sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input pl-9" placeholder="Search activities…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="muted" />
          <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarX} title="No activities match" hint="Try clearing the filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <ActivityCard key={a._id} activity={a} onOpen={(act) => navigate(`/app/activities/${act._id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
