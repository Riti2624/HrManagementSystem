import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, CheckCircle, Clock, AlertCircle, ArrowUpRight, Search } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';

export function CandidateDashboardPage() {
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.getCandidateApplications()
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: () => api.getCandidateProfile()
  });

  // Calculate profile completeness
  const completeness = (() => {
    if (!profile) return 0;
    let score = 0;
    if (profile.phone) score += 25;
    if (profile.skills && profile.skills.length > 0) score += 25;
    if (profile.resumeUrl) score += 50;
    return score;
  })();

  const activeAppsCount = applications.filter(app => app.stage !== 'Rejected' && app.stage !== 'Withdrawn').length;
  const shortListedCount = applications.filter(app => ['Shortlisted', 'Interview', 'Offer'].includes(app.stage)).length;

  const stageColors: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
    'New': 'info',
    'Interviewing': 'warning',
    'Offer': 'success',
    'Rejected': 'danger',
    'Withdrawn': 'danger'
  };

  return (
    <AppShell title="Candidate Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
              Welcome back, {profile?.name || 'Candidate'}!
            </h2>
            <p className="text-sm text-slate-600">
              Track your hiring process and search for active job openings.
            </p>
          </div>
          <Link to="/jobs">
            <Button className="flex items-center gap-2">
              <Search size={16} /> Explore Openings
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{applications.length}</div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Applications</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{activeAppsCount}</div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Reviews</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{shortListedCount}</div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Shortlisted / Interviews</p>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Applications list */}
          <Card className="p-6">
            <CardTitle>My Applications</CardTitle>
            <CardDescription>Track the live status of your job applications</CardDescription>
            
            {appsLoading ? (
              <div className="mt-6 space-y-4">
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : applications.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 px-4 text-center">
                <Briefcase size={40} className="text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-slate-900">No applications yet</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  You haven't applied to any job openings. Browse active job listings to get started.
                </p>
                <Link to="/jobs" className="mt-4">
                  <Button size="sm">Explore Jobs</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Role Title</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Applied Date</th>
                      <th className="py-3 px-4">Current Stage</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app, index) => (
                      <motion.tr
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {app.job?.title || 'Unknown Role'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{app.job?.department || 'N/A'}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Today'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge tone={stageColors[app.stage] || 'info'}>{app.stage}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link to={`/jobs/${app.jobCode}`}>
                            <Button size="sm" variant="secondary" className="flex items-center gap-1 inline-flex">
                              Details <ArrowUpRight size={14} />
                            </Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Profile completeness card */}
          <div className="space-y-6">
            <Card className="p-6">
              <CardTitle>Profile Progress</CardTitle>
              <CardDescription>Keep your profile details up-to-date to ease recruitment screening.</CardDescription>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Completeness Score</span>
                  <span className="font-bold text-blue-700">{completeness}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${completeness}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>

                <div className="mt-6 space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    {profile?.phone ? (
                      <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Contact details</div>
                      <div className="text-xs text-slate-500">Provide phone number for HR messaging.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {profile?.skills && profile.skills.length > 0 ? (
                      <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-900">List core skills</div>
                      <div className="text-xs text-slate-500">Highlight technical competencies.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {profile?.resumeUrl ? (
                      <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Upload resume (PDF/DOCX)</div>
                      <div className="text-xs text-slate-500">Essential for hiring managers to review.</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link to="/profile">
                    <Button variant="secondary" className="w-full flex items-center justify-center gap-1">
                      <FileText size={16} /> Update Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
