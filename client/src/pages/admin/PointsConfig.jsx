import { useEffect, useState } from 'react';
import { Sliders, Save, Coins, Trophy } from 'lucide-react';
import { pointsApi } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Loader, SectionTitle } from '../../components/ui.jsx';

export default function PointsConfig() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await pointsApi.getConfig();
    setCfg(r.config);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      await pointsApi.updateConfig({
        participationPoints: Number(cfg.participationPoints),
        winnerPoints: {
          first: Number(cfg.winnerPoints.first),
          second: Number(cfg.winnerPoints.second),
          third: Number(cfg.winnerPoints.third),
        },
      });
      toast('Point configuration saved', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (!cfg) return <Loader />;

  return (
    <div className="space-y-5">
      <SectionTitle>Points Configuration</SectionTitle>
      <p className="muted -mt-3 text-sm">These values drive the scoring engine. Changes apply to all future awards.</p>

      <div className="card max-w-lg space-y-5 p-6 shadow-card">
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-semibold"><Coins size={15} className="text-amber-500" /> Participation points</label>
          <input type="number" className="input" value={cfg.participationPoints}
            onChange={(e) => setCfg({ ...cfg, participationPoints: e.target.value })} />
          <p className="muted mt-1 text-xs">Awarded when an employee enrolls in an activity.</p>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold"><Trophy size={15} className="text-amber-500" /> Winner points</label>
          <div className="grid grid-cols-3 gap-3">
            {['first', 'second', 'third'].map((p, i) => (
              <div key={p}>
                <label className="muted mb-1 block text-xs capitalize">{['1st', '2nd', '3rd'][i]} place</label>
                <input type="number" className="input" value={cfg.winnerPoints[p]}
                  onChange={(e) => setCfg({ ...cfg, winnerPoints: { ...cfg.winnerPoints, [p]: e.target.value } })} />
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary justify-center" onClick={save} disabled={busy}>
          <Save size={15} /> {busy ? 'Saving…' : 'Save configuration'}
        </button>
      </div>
    </div>
  );
}
