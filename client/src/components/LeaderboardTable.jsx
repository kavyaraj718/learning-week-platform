import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { RankBadge } from './ui.jsx';

/**
 * Generic, animated leaderboard table.
 * columns: [{ key, label, render?, align? }]
 * rowKey: field used to identify a row across refreshes (for ▲/▼ deltas)
 * highlightKey + highlightValue: highlight the current user's row
 */
export default function LeaderboardTable({
  rows = [], columns, rowKey = '_id', highlightKey, highlightValue,
}) {
  const prevRanks = useRef({});
  const [deltas, setDeltas] = useState({});

  useEffect(() => {
    const next = {};
    const d = {};
    rows.forEach((r) => {
      const id = String(r[rowKey]);
      next[id] = r.rank;
      if (prevRanks.current[id] != null) d[id] = prevRanks.current[id] - r.rank; // +ve = moved up
    });
    setDeltas(d);
    prevRanks.current = next;
  }, [rows, rowKey]);

  return (
    <div className="card overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="surface-2 muted text-left text-xs uppercase tracking-wide">
              <th className="px-4 py-3">#</th>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = String(r[rowKey]);
              const delta = deltas[id];
              const mine = highlightKey && String(r[highlightKey]) === String(highlightValue);
              return (
                <tr key={id}
                  className="border-t transition-colors animate-rise"
                  style={{ borderColor: 'var(--border)', background: mine ? 'rgba(99,102,241,0.10)' : 'transparent' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RankBadge rank={r.rank} />
                      {delta != null && delta !== 0 && (
                        <span className="inline-flex items-center text-[11px] font-semibold"
                          style={{ color: delta > 0 ? '#10b981' : '#f43f5e' }}>
                          {delta > 0 ? <ChevronUp size={13} /> : <ChevronDown size={13} />}{Math.abs(delta)}
                        </span>
                      )}
                      {delta === 0 && <Minus size={12} className="muted" />}
                    </div>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right font-semibold' : ''}`}>
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="muted px-4 py-8 text-center">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
