import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Wifi, MapPin, Calendar, Award } from 'lucide-react';
import { activitiesApi } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLiveRefresh } from '../../context/SocketContext.jsx';
import { Loader, Modal, SectionTitle } from '../../components/ui.jsx';

const EMPTY = { name: '', description: '', category: 'General', date: '', time: '', type: 'Virtual', participationPoints: 5 };

export default function ManageActivities() {
  const { toast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // activity or EMPTY
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    const r = await activitiesApi.list();
    setActivities(r.activities);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['activity:update'], load);

  const save = async () => {
    try {
      const body = { ...editing, participationPoints: Number(editing.participationPoints) };
      if (editing._id) await activitiesApi.update(editing._id, body);
      else await activitiesApi.create(body);
      toast(editing._id ? 'Activity updated' : 'Activity created', 'success');
      setEditing(null); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const remove = async () => {
    try {
      await activitiesApi.remove(confirm._id);
      toast('Activity deleted', 'success');
      setConfirm(null); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <SectionTitle action={<button className="btn btn-primary text-sm" onClick={() => setEditing({ ...EMPTY })}><Plus size={15} /> New activity</button>}>
        Manage Activities
      </SectionTitle>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((a) => (
          <div key={a._id} className="card p-4 shadow-card">
            <div className="flex items-start justify-between">
              <span className="chip" style={{ color: a.type === 'Virtual' ? '#6366f1' : '#10b981', borderColor: 'var(--border)' }}>
                {a.type === 'Virtual' ? <Wifi size={12} /> : <MapPin size={12} />} {a.type}
              </span>
              <span className="chip capitalize" style={{ borderColor: 'var(--border)' }}>{a.status}</span>
            </div>
            <h3 className="mt-2 font-semibold leading-snug">{a.name}</h3>
            <div className="muted mt-1 flex flex-wrap items-center gap-x-3 text-xs">
              <span className="inline-flex items-center gap-1"><Calendar size={12} /> {new Date(a.date).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1"><Award size={12} /> +{a.participationPoints}</span>
              <span>{a.enrolledCount} joined</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-ghost flex-1 justify-center text-xs" onClick={() => setEditing({ ...a, date: a.date?.slice(0, 10) })}><Pencil size={13} /> Edit</button>
              <button className="btn btn-ghost justify-center text-xs !text-rose-500" onClick={() => setConfirm(a)}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? 'Edit activity' : 'New activity'}>
        {editing && (
          <div className="space-y-3">
            <Field label="Name"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Description"><textarea className="input" rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category"><input className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
              <Field label="Type">
                <select className="input" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option>Virtual</option><option>On-Ground</option>
                </select>
              </Field>
              <Field label="Date"><input type="date" className="input" value={editing.date || ''} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></Field>
              <Field label="Time"><input className="input" placeholder="10:00 AM" value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} /></Field>
              <Field label="Participation points"><input type="number" className="input" value={editing.participationPoints} onChange={(e) => setEditing({ ...editing, participationPoints: e.target.value })} /></Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing._id ? 'Save changes' : 'Create'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete activity?" width={420}>
        {confirm && (
          <div>
            <p className="muted text-sm">This permanently removes <b>{confirm.name}</b> and its registrations.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-primary !bg-rose-500" onClick={remove}>Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div><label className="muted mb-1 block text-xs font-medium">{label}</label>{children}</div>
);
