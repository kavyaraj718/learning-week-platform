import { useEffect, useState, useCallback } from 'react';
import { Users, Activity as ActIcon, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';
import { analyticsApi } from '../../api/index.js';
import { useLiveRefresh } from '../../context/SocketContext.jsx';
import { Loader, StatTile, SectionTitle } from '../../components/ui.jsx';
import { ChartCard, BarChart, LineChart, DoughnutChart, PALETTE } from '../../components/ChartCard.jsx';

const DEPARTMENTS = ['All', 'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
const LOCATIONS = ['All', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune'];

export default function AdminAnalytics() {
  const [dept, setDept] = useState('All');
  const [loc, setLoc] = useState('All');
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const params = {};
    if (dept !== 'All') params.department = dept;
    if (loc !== 'All') params.location = loc;
    const [p, e, t, tr] = await Promise.all([
      analyticsApi.participation(params),
      analyticsApi.engagement(params),
      analyticsApi.team(),
      analyticsApi.trends(),
    ]);
    setData({ participation: p.participation, engagement: e.engagement, team: t.team, trends: tr.trends });
  }, [dept, loc]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(['leaderboard:update', 'points:update', 'activity:update'], load);

  if (!data) return <Loader label="Crunching analytics…" />;
  const { participation: P, engagement: E, team: T, trends: TR } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="muted text-sm">Live participation, engagement & team performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input !w-auto" value={dept} onChange={(e) => setDept(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
          <select className="input !w-auto" value={loc} onChange={(e) => setLoc(e.target.value)}>{LOCATIONS.map((d) => <option key={d}>{d}</option>)}</select>
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} label="Registered" value={P.totalRegistered} accent="#6366f1" />
        <StatTile icon={TrendingUp} label="Participation" value={`${P.participationRate}%`} accent="#10b981" />
        <StatTile icon={ActIcon} label="Activities" value={P.activitiesConducted} accent="#f59e0b" />
        <StatTile icon={CheckCircle2} label="Completed" value={P.activitiesCompleted} accent="#f43f5e" />
      </div>

      {/* Most/least popular */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4 shadow-card">
          <p className="muted text-xs font-semibold uppercase">Most popular activity</p>
          <p className="mt-1 font-display font-bold">{P.mostPopular?.name || '—'}</p>
          <p className="muted text-sm">{P.mostPopular?.enrolledCount || 0} enrolled</p>
        </div>
        <div className="card p-4 shadow-card">
          <p className="muted text-xs font-semibold uppercase">Least popular activity</p>
          <p className="mt-1 font-display font-bold">{P.leastPopular?.name || '—'}</p>
          <p className="muted text-sm">{P.leastPopular?.enrolledCount || 0} enrolled</p>
        </div>
      </div>

      {/* Trends */}
      <SectionTitle>Trends</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Daily participation">
          <LineChart
            labels={TR.dailyParticipation.map((d) => d._id)}
            datasets={[{ label: 'Enrollments', data: TR.dailyParticipation.map((d) => d.count), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.15)', fill: true, tension: 0.35 }]}
          />
        </ChartCard>
        <ChartCard title="Engagement trend (social points)">
          <LineChart
            labels={TR.engagementTrend.map((d) => d._id)}
            datasets={[{ label: 'Social pts', data: TR.engagementTrend.map((d) => d.points), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', fill: true, tension: 0.35 }]}
          />
        </ChartCard>
        <ChartCard title="Activity-wise enrollment">
          <BarChart
            labels={TR.activityPerformance.map((a) => a.name.split(' ').slice(0, 2).join(' '))}
            datasets={[
              { label: 'Enrolled', data: TR.activityPerformance.map((a) => a.enrolledCount), backgroundColor: '#6366f1', borderRadius: 6 },
              { label: 'Attended', data: TR.activityPerformance.map((a) => a.attendedCount), backgroundColor: '#10b981', borderRadius: 6 },
            ]}
          />
        </ChartCard>
        <ChartCard title="Points awarded per day">
          <BarChart
            labels={TR.pointsAwarded.map((d) => d._id)}
            datasets={[{ label: 'Points', data: TR.pointsAwarded.map((d) => d.points), backgroundColor: '#f59e0b', borderRadius: 6 }]}
          />
        </ChartCard>
      </div>

      {/* Team + engagement */}
      <SectionTitle>Team performance</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Team scores">
          <BarChart horizontal
            labels={T.rankings.map((t) => t.manager)}
            datasets={[{ label: 'Team score', data: T.rankings.map((t) => t.teamScore), backgroundColor: PALETTE, borderRadius: 6 }]}
          />
        </ChartCard>
        <ChartCard title="Top contributors">
          <DoughnutChart
            labels={E.topContributors.slice(0, 6).map((c) => c.name)}
            values={E.topContributors.slice(0, 6).map((c) => c.totalPoints)}
          />
        </ChartCard>
      </div>

      {/* Leaderboards of people */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RankList title="Most active" rows={E.mostActive} valueKey="joined" suffix=" joined" />
        <RankList title="Most consistent" rows={E.mostConsistent} valueKey="participationPct" suffix="%" />
        <RankList title="Top social" rows={E.topSocial} valueKey="socialPoints" suffix=" pts" />
      </div>
    </div>
  );
}

function RankList({ title, rows, valueKey, suffix }) {
  return (
    <div className="card p-4 shadow-card">
      <p className="mb-2 font-semibold">{title}</p>
      <div className="space-y-1.5">
        {rows.slice(0, 6).map((r, i) => (
          <div key={r._id || i} className="flex items-center gap-2 text-sm">
            <span className="muted w-4 text-xs">{i + 1}</span>
            <span className="flex-1 truncate">{r.name}</span>
            <span className="font-semibold">{r[valueKey]}{suffix}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="muted text-sm">No data.</p>}
      </div>
    </div>
  );
}
