import { useEffect, useState, useCallback } from 'react';
import { Plug, RefreshCw, Cloud, Database, FileSpreadsheet, Users, Heart, Clock, CheckCircle2 } from 'lucide-react';
import { integrationApi } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLiveRefresh } from '../../context/SocketContext.jsx';
import { Loader, SectionTitle, CountUp } from '../../components/ui.jsx';

const MODE_ICON = { 'API integration': Cloud, 'Scheduled DB sync': Database, 'Secure Excel feed': FileSpreadsheet };

export default function Integrations() {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const r = await integrationApi.status();
    setStatus(r.status);
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['leaderboard:update', 'points:update'], load);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await integrationApi.sync();
      toast(`Synced ${r.updated} accounts — leaderboards updated live`, 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSyncing(false); }
  };

  if (!status) return <Loader />;

  const lastSync = status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never';

  return (
    <div className="space-y-5">
      <SectionTitle>Integrations</SectionTitle>

      {/* Social platform card */}
      <div className="card overflow-hidden shadow-card">
        <div className="bg-gradient-to-br from-brand-600 to-indigo-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15"><Heart size={22} /></span>
              <div>
                <h2 className="font-display text-lg font-bold">Social Engagement Platform</h2>
                <p className="text-sm text-white/80">Folds engagement points into employee totals</p>
              </div>
            </div>
            <span className="chip border-white/30 bg-white/10 text-white"><CheckCircle2 size={12} /> Connected</span>
          </div>
          <button onClick={sync} disabled={syncing} className="btn mt-4 bg-white text-brand-700 hover:bg-white/90">
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3">
          <Metric icon={Users} label="Connected accounts" value={status.connectedAccounts} accent="#6366f1" />
          <Metric icon={Heart} label="Total engagement pts" value={status.totalEngagementPoints} accent="#f43f5e" />
          <div className="card surface-2 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: '#10b9811a', color: '#10b981' }}><Clock size={16} /></span>
            <p className="muted mt-2 text-xs">Last synced</p>
            <p className="text-sm font-semibold">{lastSync}</p>
          </div>
        </div>
      </div>

      {/* Sync modes */}
      <div>
        <SectionTitle>Available sync modes</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {status.modes.map((m) => {
            const Icon = MODE_ICON[m] || Plug;
            return (
              <div key={m} className="card p-4 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-600"><Icon size={18} /></span>
                <p className="mt-2 text-sm font-semibold">{m}</p>
                <p className="muted text-xs">Supported ingestion method</p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="muted text-xs">
        In this build the platform reads from the seeded social engagement collection. Hook the
        <code className="mx-1 rounded surface-2 px-1">socialSyncService</code>
        up to a real API, scheduled DB job, or secure file feed to go live.
      </p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent }) {
  return (
    <div className="card surface-2 p-4">
      <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${accent}1a`, color: accent }}><Icon size={16} /></span>
      <p className="muted mt-2 text-xs">{label}</p>
      <p className="font-display text-xl font-bold"><CountUp value={value} /></p>
    </div>
  );
}
