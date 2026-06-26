import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, MapPin, Clock, Award, ArrowRight, CalendarClock } from 'lucide-react';
import { activitiesApi } from '../api/index.js';
import { useLiveRefresh } from '../context/SocketContext.jsx';
import { Loader, EmptyState } from '../components/ui.jsx';

export default function UpcomingEvents() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await activitiesApi.list();
    const now = new Date();
    setItems(r.activities
      .filter((a) => new Date(a.date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => new Date(a.date) - new Date(b.date)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['activity:update'], load);

  if (loading) return <Loader />;

  // Group by date
  const groups = items.reduce((acc, a) => {
    const key = new Date(a.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    (acc[key] ||= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Upcoming Events</h1>
        <p className="muted text-sm">Your Learning Week schedule at a glance.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing upcoming" hint="All activities have taken place." />
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([day, list]) => (
            <div key={day}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-600" />
                <h2 className="font-display font-bold">{day}</h2>
              </div>
              <div className="ml-1 space-y-3 border-l-2 pl-5" style={{ borderColor: 'var(--border)' }}>
                {list.map((a) => (
                  <button key={a._id} onClick={() => navigate(`/app/activities/${a._id}`)}
                    className="card relative block w-full p-4 text-left shadow-card transition hover:shadow-glow">
                    <span className="absolute -left-[1.65rem] top-5 h-3 w-3 rounded-full border-2 bg-[var(--surface)]"
                      style={{ borderColor: '#6366f1' }} />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{a.name}</h3>
                      <span className="chip" style={{ color: a.type === 'Virtual' ? '#6366f1' : '#10b981', borderColor: 'var(--border)' }}>
                        {a.type === 'Virtual' ? <Wifi size={12} /> : <MapPin size={12} />} {a.type}
                      </span>
                    </div>
                    <div className="muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {a.time}</span>
                      <span className="inline-flex items-center gap-1"><Award size={12} /> +{a.participationPoints} pts</span>
                      {a.myStatus && <span className="text-emerald-500">Enrolled</span>}
                      <span className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-600">Details <ArrowRight size={12} /></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
