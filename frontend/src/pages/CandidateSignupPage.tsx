import { FormEvent, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export function CandidateSignupPage() {
  const { user, signup, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must be at least 8 characters, with 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }

    try {
      await signup({ name, email, password, role: 'Candidate' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 flex items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Briefcase size={28} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Account</h1>
            <p className="mt-2 text-sm text-slate-600">
              Register as a candidate to begin your application process
            </p>
          </div>

          <Card className="p-8 shadow-xl border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
                <span className="text-xs text-slate-500 mt-1 block">Min 8 chars, 1 uppercase, 1 lowercase, 1 digit</span>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <Button className="w-full flex items-center justify-center gap-2" type="submit" disabled={loading} size="lg">
                {loading ? 'Creating Account...' : 'Register'} <UserPlus size={16} />
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5 text-center space-y-3">
              <p className="text-sm text-slate-600">
                Already have a candidate account?{' '}
                <Link to="/candidate/login" className="font-semibold text-blue-600 transition hover:text-blue-700">
                  Sign In
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                Are you an employee?{' '}
                <Link to="/login" className="text-slate-700 underline hover:text-slate-900">
                  Portal Login
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
