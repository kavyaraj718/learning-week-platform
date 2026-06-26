import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, LogIn, Trophy, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ThemeToggle } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      const dest = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/app');
      navigate(dest, { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const fill = (email, password) => setForm({ email, password });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Sparkles size={20} /></span>
          <span className="font-display text-lg font-bold">Learning Week 2026</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">Learn · Engage<br />Compete · Win</h1>
          <p className="mt-3 max-w-sm text-white/80">The central hub for every Learning Week activity — track participation, climb the leaderboard, and earn recognition in real time.</p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm">
            {[{ i: Trophy, t: 'Live leaderboards' }, { i: Zap, t: 'Instant points' }, { i: Users, t: 'Team rivalries' }].map((f, k) => (
              <div key={k} className="rounded-xl bg-white/10 p-3">
                <f.i size={18} /><p className="mt-2 text-xs text-white/85">{f.t}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/50">© 2026 Learning Week Platform</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="lg:hidden flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><Sparkles size={18} /></span>
              <span className="font-display font-bold">Learning Week</span>
            </div>
            <ThemeToggle />
          </div>

          <h2 className="font-display text-2xl font-bold">Sign in</h2>
          <p className="muted mb-6 text-sm">Welcome back — pick up where you left off.</p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="muted mb-1 block text-xs font-medium">Email</label>
              <input className="input" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
            </div>
            <div>
              <label className="muted mb-1 block text-xs font-medium">Password</label>
              <input className="input" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary w-full justify-center" disabled={busy}>
              <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="card surface-2 mt-5 p-3 text-sm">
            <p className="muted mb-2 text-xs font-semibold uppercase tracking-wide">Demo accounts</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => fill('demo@learningweek.test', 'password123')} className="btn btn-ghost justify-between text-xs">
                <span>👤 Employee</span><span className="muted">demo@learningweek.test</span>
              </button>
              <button onClick={() => fill('admin@learningweek.test', 'admin123')} className="btn btn-ghost justify-between text-xs">
                <span>🛡️ Admin</span><span className="muted">admin@learningweek.test</span>
              </button>
            </div>
          </div>

          <p className="muted mt-5 text-center text-sm">
            New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
