import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Gift, Check } from 'lucide-react';
import { activitiesApi, pointsApi } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLiveRefresh } from '../../context/SocketContext.jsx';
import { Loader, Modal, SectionTitle, EmptyState } from '../../components/ui.jsx';

export default function Registrations() {
  const { toast } = useToast();
  const [activities, setActivities] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [regs, setRegs] = useState(null);
  const [bonusFor, setBonusFor] = useState(null);
  const [bonus, setBonus] = useState({ amount: 10, note: 'Exceptional contribution' });

  const loadActivities = useCallback(async () => {
    const r = await activitiesApi.list();
    setActivities(r.activities);
    if (!activityId && r.activities[0]) setActivityId(r.activities[0]._id);
  }, [activityId]);

  const loadRegs = useCallback(async () => {
    if (!activityId) return;
    const r = await activitiesApi.registrations(activityId);
    setRegs(r);
  }, [activityId]);

  useEffect(() => { loadActivities(); }, [loadActivities]);
  useEffect(() => { loadRegs(); }, [loadRegs]);
  useLiveRefresh(['activity:update', 'points:update'], loadRegs);

  const toggle = async (employee, attended) => {
    try {
      await activitiesApi.attendance(activityId, { employeeId: employee._id, attended });
      loadRegs();
    } catch (e) { toast(e.message, 'error'); }
  };

  const giveBonus = async () => {
    try {
      await pointsApi.bonus({ employeeId: bonusFor._id, amount: Number(bonus.amount), note: bonus.note });
      toast(`Awarded ${bonus.amount} pts to ${bonusFor.name}`, 'success');
      setBonusFor(null);
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-5">
      <SectionTitle>Registrations & Attendance</SectionTitle>

      <select className="input sm:!w-96" value={activityId} onChange={(e) => setActivityId(e.target.value)}>
        {activities.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.enrolledCount} enrolled)</option>)}
      </select>

      {!regs ? <Loader /> : regs.registrations.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No registrations yet" hint="Enrollments will appear here." />
      ) : (
        <div className="card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="surface-2 muted text-left text-xs uppercase">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3 text-right">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {regs.registrations.map((r) => (
                  <tr key={r.registrationId} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.employee?.name}</p>
                      <p className="muted text-xs">{r.employee?.employeeId}</p>
                    </td>
                    <td className="px-4 py-3">{r.employee?.department}</td>
                    <td className="px-4 py-3 font-semibold">{r.employee?.totalPoints}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(r.employee, !r.attended)}
                        className={`btn text-xs ${r.attended ? 'btn-primary !bg-emerald-500' : 'btn-ghost'}`}>
                        {r.attended ? <><Check size={13} /> Present</> : 'Mark present'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn btn-ghost text-xs" onClick={() => { setBonusFor(r.employee); setBonus({ amount: 10, note: 'Exceptional contribution' }); }}>
                        <Gift size={13} /> Bonus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!bonusFor} onClose={() => setBonusFor(null)} title={`Award bonus — ${bonusFor?.name}`} width={440}>
        {bonusFor && (
          <div className="space-y-3">
            <div><label className="muted mb-1 block text-xs font-medium">Points</label>
              <input type="number" className="input" value={bonus.amount} onChange={(e) => setBonus({ ...bonus, amount: e.target.value })} /></div>
            <div><label className="muted mb-1 block text-xs font-medium">Reason</label>
              <input className="input" value={bonus.note} onChange={(e) => setBonus({ ...bonus, note: e.target.value })}
                placeholder="Volunteering, facilitation, special challenge…" /></div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setBonusFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={giveBonus}><Gift size={15} /> Award</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
