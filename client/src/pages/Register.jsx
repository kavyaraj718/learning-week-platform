import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ThemeToggle, celebrate } from '../components/ui.jsx';

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
const LOCATIONS = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune'];
const LOBS = ['Technology', 'Commercial', 'Corporate Functions'];
const MANAGERS = ['Priya Nair', 'Rohan Mehta', 'Anjali Sharma', 'Karan Patel', 'Sneha Reddy', 'Vikram Singh'];

const FIELD = (label, children) => (
  <div>
    <label className="muted mb-1 block text-xs font-medium">{label}</label>
    {children}
  </div>
);

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', employeeId: '', email: '', password: '',
    department: 'Engineering', location: 'Mumbai', lob: 'Technology',
    manager: 'Priya Nair', designation: '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await register(form);
      celebrate();
      toast(`Welcome, ${user.name.split(' ')[0]}! Your profile is ready.`, 'success');
      navigate('/app', { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"><Sparkles size={18} /></span>
            <span className="font-display font-bold">Learning Week 2026</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="card p-6 shadow-card">
          <h2 className="font-display text-2xl font-bold">Create your account</h2>
          <p className="muted mb-5 text-sm">Register once to unlock activities, points, and leaderboards.</p>

          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            {FIELD('Employee Name', <input className="input" required value={form.name} onChange={set('name')} placeholder="Jane Doe" />)}
            {FIELD('Employee ID', <input className="input" required value={form.employeeId} onChange={set('employeeId')} placeholder="EMP2045" />)}
            {FIELD('Email Address', <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="jane@company.com" />)}
            {FIELD('Password', <input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="min 6 characters" />)}
            {FIELD('Department', <select className="input" value={form.department} onChange={set('department')}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>)}
            {FIELD('Location', <select className="input" value={form.location} onChange={set('location')}>{LOCATIONS.map((d) => <option key={d}>{d}</option>)}</select>)}
            {FIELD('Line of Business', <select className="input" value={form.lob} onChange={set('lob')}>{LOBS.map((d) => <option key={d}>{d}</option>)}</select>)}
            {FIELD('People Manager', <select className="input" value={form.manager} onChange={set('manager')}>{MANAGERS.map((d) => <option key={d}>{d}</option>)}</select>)}
            {FIELD('Designation', <input className="input" required value={form.designation} onChange={set('designation')} placeholder="Senior Analyst" />)}

            <div className="sm:col-span-2 mt-2">
              <button className="btn btn-primary w-full justify-center" disabled={busy}>
                <UserPlus size={16} /> {busy ? 'Creating…' : 'Create account & continue'}
              </button>
            </div>
          </form>

          <p className="muted mt-4 text-center text-sm">
            Already registered? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
