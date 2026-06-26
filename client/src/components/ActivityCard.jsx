import { Calendar, Clock, MapPin, Wifi, Award, CheckCircle2, Trophy } from 'lucide-react';

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const STATUS_STYLE = {
  enrolled: { label: 'Enrolled', color: '#6366f1', icon: CheckCircle2 },
  attended: { label: 'Attended', color: '#10b981', icon: CheckCircle2 },
  completed: { label: 'Completed', color: '#10b981', icon: CheckCircle2 },
  won: { label: 'Winner', color: '#f59e0b', icon: Trophy },
};

export default function ActivityCard({ activity, onOpen }) {
  const isVirtual = activity.type === 'Virtual';
  const st = activity.myStatus ? STATUS_STYLE[activity.myStatus] : null;
  const StIcon = st?.icon;

  return (
    <button
      onClick={() => onOpen(activity)}
      className="card group p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="chip" style={{ borderColor: isVirtual ? '#6366f155' : '#10b98155', color: isVirtual ? '#6366f1' : '#10b981' }}>
          {isVirtual ? <Wifi size={12} /> : <MapPin size={12} />}
          {activity.type}
        </span>
        <span className="chip" style={{ color: '#f59e0b', borderColor: '#f59e0b55' }}>
          <Award size={12} /> +{activity.participationPoints} pts
        </span>
      </div>

      <h3 className="mt-3 font-display text-base font-bold leading-snug group-hover:text-brand-600">
        {activity.name}
      </h3>
      <p className="muted mt-1 line-clamp-2 text-sm">{activity.description}</p>

      <div className="muted mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1"><Calendar size={13} /> {fmtDate(activity.date)}</span>
        {activity.time && <span className="inline-flex items-center gap-1"><Clock size={13} /> {activity.time}</span>}
        <span>{activity.enrolledCount || 0} joined</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {st ? (
          <span className="chip" style={{ color: st.color, borderColor: `${st.color}55` }}>
            {StIcon && <StIcon size={12} />} {st.label}
          </span>
        ) : (
          <span className="chip muted">Not enrolled</span>
        )}
        <span className="text-xs font-semibold text-brand-600 group-hover:underline">View →</span>
      </div>
    </button>
  );
}
