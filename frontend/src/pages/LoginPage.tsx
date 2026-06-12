import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, login, signup, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('Priya HR');
  const [email, setEmail] = useState('hr@hrms.io');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState('Admin');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'signup') {
        await signup({ name, email, password, role });
      } else {
        await login(email, password);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <Sparkles size={16} /> AI-powered HR operations suite
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
           Human Resource Management System
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Manage employee records, attendance, payroll, recruitment, compliance, and workforce analytics through a centralized platform.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
 ['Employee Management', 'Centralized employee records and workforce tracking'],
 ['HR Operations', 'Attendance, leave, payroll and recruitment management'],
 ['AI Analytics', 'Workforce insights and decision support']
].map(([title, description]) => (
              <Card key={title}>
                <div className="text-base font-semibold text-slate-900">{title}</div>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="text-xl font-semibold text-slate-900">{mode === 'login' ? 'Secure Sign In' : 'Create Account'}</div>
                <div className="text-sm text-slate-600">Use the seeded HR credentials or create a Mongo-backed account.</div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' ? (
                <div>
                  <label className="mb-2 block text-sm text-slate-600">Name</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Priya HR" />
                </div>
              ) : null}
              <div>
                <label className="mb-2 block text-sm text-slate-600">Email</label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="hr@hrms.io" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-600">Password</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password123!" />
              </div>
              {mode === 'signup' ? (
                <div>
                  <label className="mb-2 block text-sm text-slate-600">Role</label>
                  <select value={role} onChange={(event) => setRole(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none">
                    {['Admin', 'HR', 'Employee', 'Contractor'].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
              <Button className="w-full" type="submit" disabled={loading} size="lg">
                {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : mode === 'login' ? 'Enter HRMS' : 'Create account'}
              </Button>
              <button type="button" className="w-full text-sm text-blue-600 transition hover:text-blue-700" onClick={() => setMode((current) => (current === 'login' ? 'signup' : 'login'))}>
                {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
