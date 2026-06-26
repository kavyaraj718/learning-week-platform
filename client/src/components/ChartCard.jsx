import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

const GRID = 'rgba(148,163,184,0.15)';
const TEXT = '#94a3b8';

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: TEXT, font: { size: 11 } } } },
  scales: {
    x: { grid: { color: GRID }, ticks: { color: TEXT, font: { size: 10 } } },
    y: { grid: { color: GRID }, ticks: { color: TEXT, font: { size: 10 } }, beginAtZero: true },
  },
};

export const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#a855f7', '#14b8a6'];

export function ChartCard({ title, children, height = 260, right }) {
  return (
    <div className="card p-4 shadow-card">
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          {right}
        </div>
      )}
      <div style={{ height }}>{children}</div>
    </div>
  );
}

export function BarChart({ labels, datasets, stacked = false, horizontal = false }) {
  const options = {
    ...baseOptions,
    indexAxis: horizontal ? 'y' : 'x',
    scales: {
      x: { ...baseOptions.scales.x, stacked },
      y: { ...baseOptions.scales.y, stacked },
    },
  };
  return <Bar options={options} data={{ labels, datasets }} />;
}

export function LineChart({ labels, datasets }) {
  return <Line options={baseOptions} data={{ labels, datasets }} />;
}

export function DoughnutChart({ labels, values, colors = PALETTE }) {
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { color: TEXT, font: { size: 11 } } } },
    cutout: '62%',
  };
  return (
    <Doughnut options={options}
      data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] }} />
  );
}
