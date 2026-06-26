import { useEffect, useState, useCallback } from 'react';
import { Building2, Users, MapPin, Globe2, X } from 'lucide-react';
import { leaderboardsApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLiveRefresh } from '../context/SocketContext.jsx';
import LeaderboardTable from '../components/LeaderboardTable.jsx';
import { Loader, Modal, RankBadge, CountUp } from '../components/ui.jsx';

const TABS = [
  { key: 'organization', label: 'Organization', icon: Globe2 },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'department', label: 'Department', icon: Building2 },
  { key: 'location', label: 'Location', icon: MapPin },
];

export default function Leaderboards() {
  const { user } = useAuth();
  const [tab, setTab] = useState('organization');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState(null); // { manager, members }

  const load = useCallback(async () => {
    const r = await leaderboardsApi[tab]();
    setData((d) => ({ ...d, [tab]: r.leaderboard }));
    setLoading(false);
  }, [tab]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useLiveRefresh(['leaderboard:update', 'points:update'], load);

  const openTeam = async (manager) => {
    const r = await leaderboardsApi.teamDetail(manager);
    setDrill({ manager, members: r.members });
  };

  const rows = data[tab] || [];

  const columns = {
    organization: [
      { key: 'name', label: 'Employee', render: (r) => <span className="font-medium">{r.name}{String(r._id) === String(user?._id) && <span className="muted"> · you</span>}</span> },
      { key: 'department', label: 'Department' },
      { key: 'location', label: 'Location' },
      { key: 'totalPoints', label: 'Points', align: 'right', render: (r) => <CountUp value={r.totalPoints} /> },
    ],
    team: [
      { key: 'manager', label: 'People Manager', render: (r) => (
        <button onClick={() => openTeam(r.manager)} className="font-medium text-brand-600 hover:underline">{r.manager}</button>
      ) },
      { key: 'teamSize', label: 'Members' },
      { key: 'avgParticipation', label: 'Avg %', render: (r) => `${r.avgParticipation}%` },
      { key: 'teamScore', label: 'Team Score', align: 'right', render: (r) => <CountUp value={r.teamScore} /> },
    ],
    department: [
      { key: 'department', label: 'Department', render: (r) => <span className="font-medium">{r.department}</span> },
      { key: 'avgPointsPerEmployee', label: 'Avg / Employee' },
      { key: 'participationRate', label: 'Participation', render: (r) => `${r.participationRate}%` },
      { key: 'totalPoints', label: 'Total Points', align: 'right', render: (r) => <CountUp value={r.totalPoints} /> },
    ],
    location: [
      { key: 'location', label: 'Location', render: (r) => <span className="font-medium">{r.location}</span> },
      { key: 'totalParticipants', label: 'Participants' },
      { key: 'participationPct', label: 'Participation', render: (r) => `${r.participationPct}%` },
      { key: 'totalPoints', label: 'Total Points', align: 'right', render: (r) => <CountUp value={r.totalPoints} /> },
    ],
  };

  const rowKey = { organization: '_id', team: 'manager', department: 'department', location: 'location' }[tab];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Leaderboards</h1>
        <p className="muted text-sm">Updated live as points are awarded across the organization.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn text-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <LeaderboardTable
          rows={rows}
          columns={columns[tab]}
          rowKey={rowKey}
          highlightKey={tab === 'organization' ? '_id' : undefined}
          highlightValue={user?._id}
        />
      )}

      {/* Team drill-down */}
      <Modal open={!!drill} onClose={() => setDrill(null)} title={`${drill?.manager}'s Team`} width={640}>
        {drill && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="muted text-left text-xs uppercase">
                  <th className="py-2">#</th><th className="py-2">Member</th>
                  <th className="py-2">Joined</th><th className="py-2">Won</th>
                  <th className="py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {drill.members.map((m) => (
                  <tr key={m._id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2"><RankBadge rank={m.rank} /></td>
                    <td className="py-2 font-medium">{m.name}<div className="muted text-[11px]">{m.department} · {m.location}</div></td>
                    <td className="py-2">{m.activitiesJoined}</td>
                    <td className="py-2">{m.activitiesWon}</td>
                    <td className="py-2 text-right font-semibold">{m.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
