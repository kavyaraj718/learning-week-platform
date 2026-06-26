import { useEffect, useState, useCallback } from 'react';
import { Mail, Building2, MapPin, Briefcase, Users, CreditCard, Award } from 'lucide-react';
import { employeesApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLiveRefresh } from '../context/SocketContext.jsx';
import { Loader, SectionTitle } from '../components/ui.jsx';

const SOURCE_COLOR = { participation: '#6366f1', winner: '#f59e0b', bonus: '#f43f5e', social: '#10b981' };

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  const load = useCallback(async () => {
    if (!user?._id) return;
    const [p, h] = await Promise.all([employeesApi.get(user._id), employeesApi.pointsHistory(user._id)]);
    setProfile(p.employee); setHistory(h.history);
  }, [user?._id]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['points:update'], load);

  if (!profile) return <Loader label="Loading profile…" />;

  const details = [
    { icon: CreditCard, label: 'Employee ID', value: profile.employeeId },
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: Building2, label: 'Department', value: profile.department },
    { icon: MapPin, label: 'Location', value: profile.location },
    { icon: Briefcase, label: 'Line of Business', value: profile.lob },
    { icon: Users, label: 'People Manager', value: profile.manager },
    { icon: Award, label: 'Designation', value: profile.designation },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex flex-col items-center gap-4 p-6 text-center shadow-card sm:flex-row sm:text-left">
        <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white shadow-glow">
          {profile.name[0]}
        </span>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
          <p className="muted text-sm">{profile.designation} · {profile.department}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="chip" style={{ color: '#f59e0b', borderColor: '#f59e0b55' }}>{profile.totalPoints} total points</span>
            <span className="chip" style={{ color: '#6366f1', borderColor: '#6366f155' }}>{profile.participationPct}% participation</span>
            <span className="chip" style={{ color: '#10b981', borderColor: '#10b98155' }}>{profile.activitiesWon?.length || 0} wins</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <section>
          <SectionTitle>Details</SectionTitle>
          <div className="card divide-y shadow-card" style={{ borderColor: 'var(--border)' }}>
            {details.map((d) => (
              <div key={d.label} className="flex items-center gap-3 px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
                <d.icon size={16} className="muted" />
                <span className="muted text-xs">{d.label}</span>
                <span className="ml-auto truncate text-sm font-medium">{d.value}</span>
              </div>
            ))}
          </div>

          {profile.badges?.length > 0 && (
            <>
              <SectionTitle>Badges</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((b) => (
                  <span key={b} className="chip" style={{ color: '#f59e0b', borderColor: '#f59e0b55' }}><Award size={12} /> {b}</span>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Points history */}
        <section className="lg:col-span-2">
          <SectionTitle action={<span className="muted text-xs">{history.length} entries</span>}>Points history</SectionTitle>
          <div className="card max-h-[28rem] divide-y overflow-auto shadow-card" style={{ borderColor: 'var(--border)' }}>
            {history.length === 0 && <p className="muted p-4 text-sm">No history yet.</p>}
            {history.map((p) => (
              <div key={p._id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
                <span className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold capitalize"
                  style={{ background: `${SOURCE_COLOR[p.source]}1a`, color: SOURCE_COLOR[p.source] }}>{p.source[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.note || p.source}</p>
                  <p className="muted text-xs">{new Date(p.createdAt).toLocaleString()}</p>
                </div>
                <span className="font-semibold" style={{ color: p.amount >= 0 ? '#10b981' : '#f43f5e' }}>{p.amount >= 0 ? '+' : ''}{p.amount}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
