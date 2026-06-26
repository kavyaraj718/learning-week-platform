import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { uploadApi } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { SectionTitle } from '../../components/ui.jsx';

const TYPES = [
  { key: 'winners', label: 'Winner Lists', cols: 'activityName, position (first/second/third), employeeId' },
  { key: 'participation', label: 'Participation Lists', cols: 'employeeId, activityName' },
  { key: 'bonus', label: 'Bonus Points', cols: 'employeeId, amount, note' },
  { key: 'attendance', label: 'Attendance Records', cols: 'employeeId, activityName, attended (yes/no)' },
];

export default function BulkUpload() {
  const { toast } = useToast();
  const [type, setType] = useState('participation');
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const active = TYPES.find((t) => t.key === type);

  const run = async (mode) => {
    if (!file) return toast('Choose a file first', 'error');
    setBusy(true);
    try {
      const r = await uploadApi.send(type, file, mode);
      setResults(r);
      if (mode === 'apply') toast(`Applied — ${r.results.filter((x) => x.status === 'ok').length}/${r.total} rows`, 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setFile(f); setResults(null); }
  };

  const errorCount = results?.results.filter((r) => r.status === 'error').length || 0;

  return (
    <div className="space-y-5">
      <SectionTitle>Bulk Upload</SectionTitle>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button key={t.key} onClick={() => { setType(t.key); setResults(null); setFile(null); }}
            className={`btn text-sm ${type === t.key ? 'btn-primary' : 'btn-ghost'}`}>{t.label}</button>
        ))}
      </div>

      <div className="card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-semibold">{active.label}</p>
            <p className="muted text-xs">Columns: {active.cols}</p>
          </div>
          <a className="btn btn-ghost text-sm" href={uploadApi.templateUrl(type)}><Download size={14} /> Template</a>
        </div>

        {/* Dropzone */}
        <label onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition"
          style={{ borderColor: dragOver ? '#6366f1' : 'var(--border)', background: dragOver ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
          <FileSpreadsheet size={28} className="muted" />
          {file ? <p className="text-sm font-medium">{file.name}</p> : <p className="muted text-sm">Drag a .xlsx/.csv file here, or click to browse</p>}
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setResults(null); }} />
        </label>

        <div className="mt-3 flex gap-2">
          <button className="btn btn-ghost" disabled={busy || !file} onClick={() => run('preview')}><Play size={15} /> Validate / preview</button>
          <button className="btn btn-primary" disabled={busy || !file} onClick={() => run('apply')}><Upload size={15} /> Apply</button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="card overflow-hidden shadow-card">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="font-semibold">{results.mode === 'preview' ? 'Preview' : 'Applied'} — {results.total} rows</p>
            <span className="chip" style={{ color: errorCount ? '#f43f5e' : '#10b981', borderColor: 'var(--border)' }}>
              {errorCount ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />} {errorCount} issue{errorCount === 1 ? '' : 's'}
            </span>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="surface-2 muted text-left text-xs uppercase">
                <th className="px-4 py-2">Line</th><th className="px-4 py-2">Row</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Message</th>
              </tr></thead>
              <tbody>
                {results.results.map((r) => (
                  <tr key={r.line} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2">{r.line}</td>
                    <td className="px-4 py-2 muted text-xs">{r.employeeId || ''} {r.activityName ? `· ${r.activityName}` : ''} {r.position ? `· ${r.position}` : ''} {r.amount != null ? `· ${r.amount}` : ''}</td>
                    <td className="px-4 py-2">
                      <span className="chip" style={{ color: r.status === 'ok' ? '#10b981' : '#f43f5e', borderColor: 'var(--border)' }}>{r.status}</span>
                    </td>
                    <td className="px-4 py-2 muted">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
