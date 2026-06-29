import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, KanbanSquare, Trophy, CalendarClock, BarChart3,
  Sparkles, UserCheck, X, CheckCircle2, Clock, ChevronDown, Users,
  Briefcase, TrendingUp, AlertCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { ATSKanbanBoard } from '../components/ats/ATSKanbanBoard';
import { InterviewFeedbackForm } from '../components/ats/InterviewFeedbackForm';
import { api } from '../lib/api';
import { mockRecruitment } from '../data/mock';
import { cn } from '../lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'kanban' | 'ranking' | 'interviews' | 'analytics';

type JobFormState = {
  id?: string;
  title: string;
  department: string;
  status: string;
  applicants: string;
  priority: string;
  description: string;
  requirements: string;
  location: string;
  salary: string;
  closingDate: string;
};

type InterviewFormState = {
  id?: string;
  applicationId: string;
  roundType: string;
  scheduledAt: string;
  interviewers: string;
  location: string;
  notes: string;
};

type ConvertFormState = {
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  salary: string;
  location: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const emptyJobForm: JobFormState = {
  title: '', department: 'Engineering', status: 'Open', applicants: '0',
  priority: 'Medium', description: '', requirements: '', location: '', salary: '', closingDate: ''
};

const emptyInterviewForm: InterviewFormState = {
  applicationId: '', roundType: 'HR', scheduledAt: '', interviewers: '', location: '', notes: ''
};

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'kanban',     label: 'Pipeline',   icon: KanbanSquare },
  { id: 'ranking',    label: 'Ranking',    icon: Trophy },
  { id: 'interviews', label: 'Interviews', icon: CalendarClock },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart3 }
];

const ROUND_TYPES = ['HR', 'Tech', 'Managerial', 'Final', 'Culture Fit'];

// ── Helper ─────────────────────────────────────────────────────────────────────

function scoreBg(score: number) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-rose-500';
}

function scoreText(score: number) {
  if (score >= 85) return 'text-emerald-700';
  if (score >= 70) return 'text-amber-700';
  return 'text-rose-700';
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function RecruitmentPage() {
  const queryClient = useQueryClient();
  const { data = mockRecruitment } = useQuery({ queryKey: ['recruitment'], queryFn: () => api.getRecruitment() });
  const { data: interviews = [] } = useQuery({ queryKey: ['interviews'], queryFn: () => api.getInterviews() });
  const { data: ranked = [] } = useQuery({ queryKey: ['ranked'], queryFn: () => api.getRankedCandidates() });
  const { data: funnel } = useQuery({ queryKey: ['funnel'], queryFn: () => api.getFunnelAnalytics() });

  const [activeTab, setActiveTab] = useState<TabId>('kanban');
  const [jobForm, setJobForm] = useState<JobFormState>(emptyJobForm);
  const [interviewForm, setInterviewForm] = useState<InterviewFormState>(emptyInterviewForm);
  const [convertForm, setConvertForm] = useState<ConvertFormState>({ name: '', role: '', department: '', email: '', phone: '', salary: '', location: '' });
  const [convertAppId, setConvertAppId] = useState('');

  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
  const [interviewDrawerOpen, setInterviewDrawerOpen] = useState(false);
  const [convertDrawerOpen, setConvertDrawerOpen] = useState(false);
  const [feedbackDrawerOpen, setFeedbackDrawerOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState('');
  const [feedbackExpandedId, setFeedbackExpandedId] = useState<string | null>(null);

  const [jobError, setJobError] = useState('');
  const [interviewError, setInterviewError] = useState('');

  // ── Mutations ──────────────────────────────────────────────────────────────

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    queryClient.invalidateQueries({ queryKey: ['interviews'] });
    queryClient.invalidateQueries({ queryKey: ['ranked'] });
    queryClient.invalidateQueries({ queryKey: ['funnel'] });
  };

  const jobMutation = useMutation({
    mutationFn: async (payload: JobFormState) => {
      if (!payload.title.trim()) throw new Error('Job title is required.');
      const body = { ...payload, applicants: Number(payload.applicants) };
      return payload.id ? api.updateJob(payload.id, body) : api.createJob(body);
    },
    onSuccess: () => { setJobError(''); setJobForm(emptyJobForm); setJobDrawerOpen(false); invalidateAll(); },
    onError: (e) => setJobError(e instanceof Error ? e.message : 'Unable to save job')
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => api.deleteJob(id),
    onSuccess: invalidateAll
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.updateApplication(id, { stage }),
    onSuccess: invalidateAll
  });

  const screenMutation = useMutation({
    mutationFn: (id: string) => api.screenApplication(id),
    onSuccess: invalidateAll
  });

  const interviewMutation = useMutation({
    mutationFn: async (payload: InterviewFormState) => {
      if (!payload.applicationId.trim() || !payload.scheduledAt.trim()) throw new Error('Application and date/time are required.');
      const body = { ...payload, interviewers: payload.interviewers.split(',').map(s => s.trim()).filter(Boolean) };
      return payload.id ? api.updateInterview(payload.id, body) : api.createInterview(body);
    },
    onSuccess: () => { setInterviewError(''); setInterviewForm(emptyInterviewForm); setInterviewDrawerOpen(false); invalidateAll(); },
    onError: (e) => setInterviewError(e instanceof Error ? e.message : 'Failed to save interview')
  });

  const deleteInterviewMutation = useMutation({
    mutationFn: (id: string) => api.deleteInterview(id),
    onSuccess: invalidateAll
  });

  const convertMutation = useMutation({
    mutationFn: (payload: ConvertFormState & { id: string }) => {
      const { id, ...body } = payload;
      return api.convertToEmployee(id, { ...body, salary: Number(body.salary) });
    },
    onSuccess: () => { setConvertDrawerOpen(false); invalidateAll(); }
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function openConvertDrawer(app: Record<string, unknown>) {
    setConvertAppId(app.id as string);
    const job = (data.jobs || []).find((j: Record<string, unknown>) => j.jobCode === app.jobCode);
    setConvertForm({
      name: String(app.name || ''),
      role: String((job as Record<string, unknown>)?.title || ''),
      department: String((job as Record<string, unknown>)?.department || ''),
      email: '',
      phone: '',
      salary: '',
      location: String((job as Record<string, unknown>)?.location || '')
    });
    setConvertDrawerOpen(true);
  }

  function openEditInterview(iv: Record<string, unknown>) {
    setInterviewForm({
      id: String(iv.id),
      applicationId: String(iv.applicationId || ''),
      roundType: String(iv.roundType || 'HR'),
      scheduledAt: String(iv.scheduledAt || ''),
      interviewers: Array.isArray(iv.interviewers) ? (iv.interviewers as string[]).join(', ') : String(iv.interviewers || ''),
      location: String(iv.location || ''),
      notes: String(iv.notes || '')
    });
    setInterviewError('');
    setInterviewDrawerOpen(true);
  }

  const jobs = (data.jobs || []) as Record<string, unknown>[];
  const applications = (data.applications || []) as Record<string, unknown>[];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppShell title="ATS — Applicant Tracking">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Recruitment Hub</CardTitle>
              <CardDescription>Full-cycle ATS: pipeline, interviews, AI screening, and analytics.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => { setJobForm(emptyJobForm); setJobError(''); setJobDrawerOpen(true); }}>
                <Plus size={15} className="mr-1.5" /> Open Role
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setInterviewForm(emptyInterviewForm); setInterviewError(''); setInterviewDrawerOpen(true); }}>
                <CalendarClock size={15} className="mr-1.5" /> Schedule Interview
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Open Roles',     value: jobs.filter(j => j.status === 'Open').length, icon: Briefcase,  color: 'text-blue-600 bg-blue-50' },
              { label: 'Candidates',     value: applications.length,                           icon: Users,      color: 'text-violet-600 bg-violet-50' },
              { label: 'Interviews',     value: interviews.length,                             icon: CalendarClock, color: 'text-amber-600 bg-amber-50' },
              { label: 'Hired',          value: applications.filter((a: Record<string, unknown>) => a.stage === 'Hired').length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' }
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all',
                activeTab === id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── KANBAN TAB ──────────────────────────────────────────────── */}
            {activeTab === 'kanban' && (
              <Card>
                <CardTitle>Hiring Pipeline</CardTitle>
                <CardDescription>Drag and drop candidates across hiring stages.</CardDescription>
                <div className="mt-4">
                  <ATSKanbanBoard
                    applications={applications as any}
                    jobs={jobs as any}
                    onStageChange={(id, stage) => stageMutation.mutate({ id, stage })}
                    onCardClick={(app) => {
                      // Open convert drawer on card click if hired
                    }}
                  />
                </div>
                {/* Job listings */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <CardTitle className="mb-3">Open Roles</CardTitle>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {jobs.map((job) => (
                      <div key={String(job.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-900">{String(job.title)}</div>
                            <div className="text-xs text-slate-500">{String(job.department)}</div>
                            {job.location ? <div className="mt-0.5 text-xs text-slate-400">{String(job.location)}</div> : null}
                          </div>
                          <Badge tone={job.priority === 'High' ? 'danger' : job.priority === 'Medium' ? 'warning' : 'neutral'}>
                            {String(job.priority)}
                          </Badge>
                        </div>
                        {job.description ? (
                          <p className="mt-2 text-xs text-slate-500 line-clamp-2">{String(job.description)}</p>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                          <span>{Number(job.applicants)} applicants · {String(job.status)}</span>
                          {job.salary ? <span className="font-medium text-slate-600">{String(job.salary)}</span> : null}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => {
                            setJobForm({ id: String(job.id), title: String(job.title), department: String(job.department), status: String(job.status), applicants: String(job.applicants), priority: String(job.priority), description: String(job.description || ''), requirements: String(job.requirements || ''), location: String(job.location || ''), salary: String(job.salary || ''), closingDate: String(job.closingDate || '') });
                            setJobError(''); setJobDrawerOpen(true);
                          }}>
                            <Pencil size={13} className="mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => deleteJobMutation.mutate(String(job.id))} disabled={deleteJobMutation.isPending}>
                            <Trash2 size={13} className="mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* ── RANKING TAB ─────────────────────────────────────────────── */}
            {activeTab === 'ranking' && (
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI Candidate Ranking</CardTitle>
                    <CardDescription>Sorted by AI match score. Click "Screen" to trigger analysis.</CardDescription>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {(ranked as Record<string, unknown>[]).map((app, i) => {
                    const score = Number(app.aiScore) || Number(app.score) || 0;
                    const job = (app.job as Record<string, unknown>) || null;
                    return (
                      <motion.div
                        key={String(app.id)}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                      >
                        {/* Rank badge */}
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black',
                          i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                        )}>#{i + 1}</div>

                        {/* Candidate info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{String(app.name)}</span>
                            <Badge tone={
                              app.stage === 'Hired' ? 'success' :
                              app.stage === 'Offer' ? 'success' :
                              app.stage === 'Rejected' ? 'danger' : 'info'
                            }>{String(app.stage)}</Badge>
                          </div>
                          {job && <div className="text-xs text-slate-500">{String(job.title)} · {String(job.department)}</div>}
                          {app.aiSummary ? (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{String(app.aiSummary)}</p>
                          ) : null}
                          {/* Score bar */}
                          {score > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 max-w-[140px] rounded-full bg-slate-100">
                                <div className={cn('h-full rounded-full', scoreBg(score))} style={{ width: `${score}%` }} />
                              </div>
                              <span className={cn('text-xs font-bold', scoreText(score))}>{score}%</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => screenMutation.mutate(String(app.id))}
                            disabled={screenMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Sparkles size={13} />
                            {screenMutation.isPending ? 'Screening...' : 'AI Screen'}
                          </Button>
                          {app.stage !== 'Hired' && (
                            <Button
                              size="sm"
                              onClick={() => openConvertDrawer(app)}
                              className="flex items-center gap-1"
                            >
                              <UserCheck size={13} /> Hire
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {ranked.length === 0 && (
                    <div className="py-12 text-center text-sm text-slate-400">No candidates yet. Add candidates to see rankings.</div>
                  )}
                </div>
              </Card>
            )}

            {/* ── INTERVIEWS TAB ──────────────────────────────────────────── */}
            {activeTab === 'interviews' && (
              <div className="space-y-4">
                {(interviews as Record<string, unknown>[]).length === 0 ? (
                  <Card>
                    <div className="py-12 text-center">
                      <CalendarClock size={40} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-700">No interviews scheduled</p>
                      <p className="text-sm text-slate-400 mt-1">Schedule the first round to get started.</p>
                      <Button className="mt-4" onClick={() => { setInterviewForm(emptyInterviewForm); setInterviewDrawerOpen(true); }}>
                        <Plus size={14} className="mr-1" /> Schedule Interview
                      </Button>
                    </div>
                  </Card>
                ) : (interviews as Record<string, unknown>[]).map((iv, i) => {
                  const app = applications.find(a => a.id === iv.applicationId);
                  const job = app ? jobs.find(j => j.jobCode === app.jobCode) : null;
                  const feedbacks = (iv.feedbacks as Record<string, unknown>[]) || [];
                  const isExpanded = feedbackExpandedId === String(iv.id);

                  return (
                    <motion.div
                      key={String(iv.id)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="overflow-hidden">
                        <div className="flex items-start gap-4 flex-wrap">
                          {/* Round type badge */}
                          <div className={cn(
                            'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-bold',
                            iv.roundType === 'HR' ? 'bg-violet-100 text-violet-700' :
                            iv.roundType === 'Tech' ? 'bg-cyan-100 text-cyan-700' :
                            'bg-amber-100 text-amber-700'
                          )}>
                            <CalendarClock size={16} />
                            <span className="mt-0.5 text-[9px]">{String(iv.roundType)}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900">
                                {app ? String(app.name) : 'Unknown Candidate'}
                              </span>
                              <Badge tone={
                                iv.status === 'Completed' ? 'success' :
                                iv.status === 'Cancelled' ? 'danger' : 'info'
                              }>{String(iv.status)}</Badge>
                            </div>
                            {job && <div className="text-xs text-slate-500">{String(job.title)} · {String(job.department)}</div>}
                            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {iv.scheduledAt ? new Date(String(iv.scheduledAt)).toLocaleString() : String(iv.scheduledAt)}
                              </span>
                              {iv.location ? <span>{String(iv.location)}</span> : null}
                            </div>
                            {Array.isArray(iv.interviewers) && (iv.interviewers as string[]).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(iv.interviewers as string[]).map(name => (
                                  <span key={name} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-medium">{name}</span>
                                ))}
                              </div>
                            )}
                            {feedbacks.length > 0 && (
                              <button
                                onClick={() => setFeedbackExpandedId(isExpanded ? null : String(iv.id))}
                                className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                <ChevronDown size={12} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                                {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
                              </button>
                            )}
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <Button size="sm" variant="secondary" onClick={() => { setSelectedInterviewId(String(iv.id)); setFeedbackDrawerOpen(true); }}>
                              + Feedback
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => openEditInterview(iv)}>
                              <Pencil size={13} />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => deleteInterviewMutation.mutate(String(iv.id))} disabled={deleteInterviewMutation.isPending}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>

                        {/* Feedback panel */}
                        <AnimatePresence>
                          {isExpanded && feedbacks.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 border-t border-slate-100 pt-4 space-y-3"
                            >
                              {feedbacks.map((fb) => (
                                <div key={String(fb.id)} className="rounded-xl bg-slate-50 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-700">{String(fb.reviewerName)}</span>
                                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', fb.recommendation === 'Proceed' ? 'bg-emerald-100 text-emerald-700' : fb.recommendation === 'Reject' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>
                                      {String(fb.recommendation)}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                                    {(['communication', 'technical', 'cultureFit', 'leadership'] as const).map(key => (
                                      <div key={key}>
                                        <div className="font-bold text-slate-900">{Number(fb[key])}/5</div>
                                        <div className="capitalize text-slate-500">{key === 'cultureFit' ? 'Culture' : key}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {fb.comments ? <p className="mt-2 text-xs text-slate-500">{String(fb.comments)}</p> : null}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── ANALYTICS TAB ───────────────────────────────────────────── */}
            {activeTab === 'analytics' && funnel && (
              <div className="space-y-4">
                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Total Candidates',  value: funnel.total,             icon: Users,        color: 'bg-blue-50 text-blue-700' },
                    { label: 'Hired',             value: funnel.hiredCount,         icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Conversion Rate',   value: `${funnel.overallConversion}%`, icon: TrendingUp, color: 'bg-violet-50 text-violet-700' },
                    { label: 'Avg AI Score',      value: `${funnel.avgAiScore}%`,    icon: Sparkles,    color: 'bg-amber-50 text-amber-700' }
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="flex items-center gap-3 p-5">
                      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', color)}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-xl font-black text-slate-900">{value}</div>
                        <div className="text-xs text-slate-500">{label}</div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Funnel chart */}
                <Card>
                  <CardTitle>Hiring Funnel</CardTitle>
                  <CardDescription>Candidate volume at each stage of the recruitment pipeline.</CardDescription>
                  <div className="mt-6 space-y-3">
                    {funnel.funnelData.filter(f => f.count > 0 || f.stage === 'New').map((item) => {
                      const maxCount = Math.max(...funnel.funnelData.map(f => f.count), 1);
                      const width = maxCount > 0 ? Math.max(4, (item.count / maxCount) * 100) : 4;
                      return (
                        <div key={item.stage} className="flex items-center gap-3">
                          <div className="w-36 shrink-0 text-right text-xs font-semibold text-slate-600">{item.stage}</div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="h-7 flex-1 rounded-full bg-slate-100 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${width}%` }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs font-bold text-slate-700">{item.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Conversion rates */}
                {funnel.conversionRates.length > 0 && (
                  <Card>
                    <CardTitle>Stage Conversion Rates</CardTitle>
                    <CardDescription>Percentage of candidates advancing between key stages.</CardDescription>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {funnel.conversionRates.map((cr) => (
                        <div key={`${cr.from}-${cr.to}`} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <span className="truncate font-medium text-slate-700">{cr.from}</span>
                              <ChevronRight size={11} />
                              <span className="truncate">{cr.to}</span>
                            </div>
                          </div>
                          <span className={cn('shrink-0 text-sm font-black', cr.rate >= 50 ? 'text-emerald-600' : cr.rate >= 25 ? 'text-amber-600' : 'text-rose-600')}>
                            {cr.rate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Open vs Closed */}
                <Card>
                  <CardTitle>Job Status Overview</CardTitle>
                  <div className="mt-4 flex gap-4">
                    <div className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                      <div className="text-3xl font-black text-emerald-700">{funnel.openJobs}</div>
                      <div className="text-xs font-semibold text-emerald-600 mt-1">Open Roles</div>
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <div className="text-3xl font-black text-slate-700">{funnel.closedJobs}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">Closed Roles</div>
                    </div>
                    <div className="flex-1 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
                      <div className="text-3xl font-black text-rose-700">{funnel.rejectedCount}</div>
                      <div className="text-xs font-semibold text-rose-600 mt-1">Rejected</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            {activeTab === 'analytics' && !funnel && (
              <Card>
                <div className="py-10 text-center text-sm text-slate-400">Loading analytics...</div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Job Drawer ──────────────────────────────────────────────────────── */}
      <Drawer
        open={jobDrawerOpen}
        title={jobForm.id ? 'Edit Job Posting' : 'Open New Role'}
        description="Create or update a job posting."
        onClose={() => setJobDrawerOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setJobDrawerOpen(false)} disabled={jobMutation.isPending}>Cancel</Button>
            <Button type="button" onClick={() => jobMutation.mutate(jobForm)} disabled={jobMutation.isPending}>
              {jobMutation.isPending ? 'Saving...' : jobForm.id ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          {jobError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{jobError}</div>}
          {(['title', 'department', 'location', 'salary'] as const).map(key => (
            <Input key={key} placeholder={key.charAt(0).toUpperCase() + key.slice(1)} value={jobForm[key]} onChange={e => setJobForm(p => ({ ...p, [key]: e.target.value }))} />
          ))}
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100" value={jobForm.status} onChange={e => setJobForm(p => ({ ...p, status: e.target.value }))}>
            {['Open', 'Closed', 'On Hold'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100" value={jobForm.priority} onChange={e => setJobForm(p => ({ ...p, priority: e.target.value }))}>
            {['High', 'Medium', 'Low'].map(s => <option key={s}>{s}</option>)}
          </select>
          <textarea rows={3} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none w-full" placeholder="Job Description" value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} />
          <textarea rows={2} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none w-full" placeholder="Required skills / keywords (comma separated)" value={jobForm.requirements} onChange={e => setJobForm(p => ({ ...p, requirements: e.target.value }))} />
          <Input type="date" placeholder="Closing Date" value={jobForm.closingDate} onChange={e => setJobForm(p => ({ ...p, closingDate: e.target.value }))} />
        </div>
      </Drawer>

      {/* ── Interview Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        open={interviewDrawerOpen}
        title={interviewForm.id ? 'Edit Interview' : 'Schedule Interview'}
        description="Set up an interview round for a candidate."
        onClose={() => setInterviewDrawerOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setInterviewDrawerOpen(false)} disabled={interviewMutation.isPending}>Cancel</Button>
            <Button type="button" onClick={() => interviewMutation.mutate(interviewForm)} disabled={interviewMutation.isPending}>
              {interviewMutation.isPending ? 'Saving...' : interviewForm.id ? 'Update' : 'Schedule'}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          {interviewError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{interviewError}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Application</label>
            <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100" value={interviewForm.applicationId} onChange={e => setInterviewForm(p => ({ ...p, applicationId: e.target.value }))}>
              <option value="">Select candidate…</option>
              {applications.map(a => <option key={String(a.id)} value={String(a.id)}>{String(a.name)} — {String(a.jobCode)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Round Type</label>
            <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100" value={interviewForm.roundType} onChange={e => setInterviewForm(p => ({ ...p, roundType: e.target.value }))}>
              {ROUND_TYPES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Date &amp; Time</label>
            <Input type="datetime-local" value={interviewForm.scheduledAt} onChange={e => setInterviewForm(p => ({ ...p, scheduledAt: e.target.value }))} />
          </div>
          <Input placeholder="Interviewers (comma separated)" value={interviewForm.interviewers} onChange={e => setInterviewForm(p => ({ ...p, interviewers: e.target.value }))} />
          <Input placeholder="Location or meeting link" value={interviewForm.location} onChange={e => setInterviewForm(p => ({ ...p, location: e.target.value }))} />
          <textarea rows={2} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none w-full" placeholder="Notes" value={interviewForm.notes} onChange={e => setInterviewForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
      </Drawer>

      {/* ── Feedback Drawer ──────────────────────────────────────────────────── */}
      <Drawer
        open={feedbackDrawerOpen}
        title="Interview Feedback"
        description="Submit your evaluation for this interview round."
        onClose={() => setFeedbackDrawerOpen(false)}
      >
        <InterviewFeedbackForm
          interviewId={selectedInterviewId}
          onSuccess={() => { setFeedbackDrawerOpen(false); invalidateAll(); }}
          onCancel={() => setFeedbackDrawerOpen(false)}
        />
      </Drawer>

      {/* ── Convert to Employee Drawer ───────────────────────────────────────── */}
      <Drawer
        open={convertDrawerOpen}
        title="Convert to Employee"
        description="Onboard this candidate as a full employee."
        onClose={() => setConvertDrawerOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setConvertDrawerOpen(false)} disabled={convertMutation.isPending}>Cancel</Button>
            <Button
              type="button"
              onClick={() => convertMutation.mutate({ ...convertForm, id: convertAppId })}
              disabled={convertMutation.isPending || !convertForm.name.trim()}
              className="flex items-center gap-2"
            >
              <UserCheck size={15} />
              {convertMutation.isPending ? 'Converting...' : 'Confirm & Hire'}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            This will create an employee record and mark the application as Hired.
          </div>
          {(['name', 'role', 'department', 'email', 'phone', 'location'] as const).map(key => (
            <Input key={key} placeholder={key.charAt(0).toUpperCase() + key.slice(1)} value={convertForm[key]} onChange={e => setConvertForm(p => ({ ...p, [key]: e.target.value }))} />
          ))}
          <Input type="number" placeholder="Starting Salary" value={convertForm.salary} onChange={e => setConvertForm(p => ({ ...p, salary: e.target.value }))} />
        </div>
      </Drawer>
    </AppShell>
  );
}
