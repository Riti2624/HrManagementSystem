import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { api } from '../lib/api';
import { mockRecruitment } from '../data/mock';

type JobFormState = {
  id?: string;
  title: string;
  department: string;
  status: string;
  applicants: string;
  priority: string;
};

type ApplicationFormState = {
  id?: string;
  jobId: string;
  name: string;
  score: string;
  stage: string;
};

const emptyJobForm: JobFormState = {
  title: '',
  department: 'Engineering',
  status: 'Open',
  applicants: '0',
  priority: 'Medium'
};

const emptyApplicationForm: ApplicationFormState = {
  jobId: 'job-001',
  name: '',
  score: '0',
  stage: 'New'
};

export function RecruitmentPage() {
  const queryClient = useQueryClient();
  const { data = mockRecruitment } = useQuery({ queryKey: ['recruitment'], queryFn: () => api.getRecruitment() });
  const [jobForm, setJobForm] = useState<JobFormState>(emptyJobForm);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormState>(emptyApplicationForm);
  const [jobError, setJobError] = useState('');
  const [applicationError, setApplicationError] = useState('');
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);

  const jobMutation = useMutation({
    mutationFn: async (payload: JobFormState) => {
      if (!payload.title.trim()) {
        throw new Error('Job title is required.');
      }
      if (Number(payload.applicants) < 0) {
        throw new Error('Applicants must be zero or greater.');
      }

      const body = {
        ...payload,
        applicants: Number(payload.applicants)
      };

      return payload.id ? api.updateJob(payload.id, body) : api.createJob(body);
    },
    onSuccess: async () => {
      setJobError('');
      await queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      setJobForm(emptyJobForm);
      setJobDrawerOpen(false);
    },
    onError: (error) => {
      setJobError(error instanceof Error ? error.message : 'Unable to save job');
    }
  });

  const applicationMutation = useMutation({
    mutationFn: async (payload: ApplicationFormState) => {
      if (!payload.jobId.trim() || !payload.name.trim()) {
        throw new Error('Job ID and candidate name are required.');
      }
      if (Number(payload.score) < 0 || Number(payload.score) > 100) {
        throw new Error('Resume score must be between 0 and 100.');
      }

      const body = {
        ...payload,
        score: Number(payload.score)
      };

      return payload.id ? api.updateApplication(payload.id, body) : api.createApplication(body);
    },
    onSuccess: async () => {
      setApplicationError('');
      await queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      setApplicationForm(emptyApplicationForm);
      setCandidateDrawerOpen(false);
    },
    onError: (error) => {
      setApplicationError(error instanceof Error ? error.message : 'Unable to save candidate');
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => api.deleteJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruitment'] })
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: (id: string) => api.deleteApplication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruitment'] })
  });

  function openJobDrawer() {
    setJobForm(emptyJobForm);
    setJobError('');
    setJobDrawerOpen(true);
  }

  function openCandidateDrawer() {
    setApplicationForm(emptyApplicationForm);
    setApplicationError('');
    setCandidateDrawerOpen(true);
  }

  function handleEditJob(job: any) {
    setJobForm({
      id: job.id,
      title: job.title,
      department: job.department,
      status: job.status,
      applicants: String(job.applicants ?? 0),
      priority: job.priority
    });
    setJobError('');
    setJobDrawerOpen(true);
  }

  function handleEditApplication(candidate: any) {
    setApplicationForm({
      id: candidate.id,
      jobId: candidate.jobId,
      name: candidate.name,
      score: String(candidate.score ?? 0),
      stage: candidate.stage
    });
    setApplicationError('');
    setCandidateDrawerOpen(true);
  }

  const jobField = (key: keyof JobFormState, placeholder: string, type = 'text') => (
    <Input type={type} value={jobForm[key] || ''} onChange={(event) => setJobForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} />
  );

  const candidateField = (key: keyof ApplicationFormState, placeholder: string, type = 'text') => (
    <Input type={type} value={applicationForm[key] || ''} onChange={(event) => setApplicationForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} />
  );

  return (
    <AppShell title="Recruitment Hub">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Recruitment Workspace</CardTitle>
              <CardDescription>Manage open roles and candidate movement from focused drawers.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={openJobDrawer}><Plus size={16} className="mr-2" /> Open Role</Button>
              <Button type="button" variant="secondary" onClick={openCandidateDrawer}><Plus size={16} className="mr-2" /> Add Candidate</Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardTitle>Open Roles</CardTitle>
            <CardDescription>Hiring priorities and current applicant volume.</CardDescription>
            <div className="mt-4 space-y-3">
              {data.jobs.map((job) => (
                <div key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{job.title}</div>
                      <div className="text-sm text-slate-500">{job.department}</div>
                    </div>
                    <Badge tone={job.priority === 'High' ? 'danger' : job.priority === 'Medium' ? 'warning' : 'neutral'}>{job.priority}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-slate-500">{job.applicants} applicants - {job.status}</div>
                  <div className="mt-4 flex gap-3">
                    <Button size="sm" onClick={() => handleEditJob(job)}><Pencil size={14} className="mr-2" /> Edit</Button>
                    <Button size="sm" variant="secondary" onClick={() => deleteJobMutation.mutate(job.id)} disabled={deleteJobMutation.isPending}><Trash2 size={14} className="mr-2" /> Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>AI Resume Scoring</CardTitle>
            <CardDescription>Shortlist or reject candidates with transparent scoring hints.</CardDescription>
            <div className="mt-4 space-y-3">
              {data.applications.map((candidate) => (
                <div key={candidate.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{candidate.name}</div>
                      <div className="text-sm text-slate-500">Score: {candidate.score}</div>
                    </div>
                    <Badge tone={candidate.score >= 85 ? 'success' : candidate.score >= 70 ? 'warning' : 'danger'}>{candidate.stage}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => api.updateApplication(candidate.id, { ...candidate, stage: 'Shortlisted' }).then(() => queryClient.invalidateQueries({ queryKey: ['recruitment'] }))}>Shortlist</Button>
                    <Button size="sm" variant="secondary" onClick={() => api.updateApplication(candidate.id, { ...candidate, stage: 'Rejected' }).then(() => queryClient.invalidateQueries({ queryKey: ['recruitment'] }))}>Reject</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleEditApplication(candidate)}><Pencil size={14} className="mr-2" /> Edit</Button>
                    <Button size="sm" variant="secondary" onClick={() => deleteApplicationMutation.mutate(candidate.id)} disabled={deleteApplicationMutation.isPending}><Trash2 size={14} className="mr-2" /> Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Drawer
        open={jobDrawerOpen}
        title={jobForm.id ? 'Edit Job Posting' : 'Open New Role'}
        description="Create or update job postings with Mongo persistence."
        onClose={() => setJobDrawerOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setJobDrawerOpen(false)} disabled={jobMutation.isPending}>Cancel</Button>
            <Button type="button" onClick={() => jobMutation.mutate(jobForm)} disabled={jobMutation.isPending}>{jobMutation.isPending ? 'Saving...' : jobForm.id ? 'Update Job' : 'Create Job'}</Button>
          </div>
        }
      >
        <div className="grid gap-3">
          {jobError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{jobError}</div> : null}
          {jobField('title', 'Title')}
          {jobField('department', 'Department')}
          {jobField('status', 'Status')}
          {jobField('applicants', 'Applicants', 'number')}
          {jobField('priority', 'Priority')}
        </div>
      </Drawer>

      <Drawer
        open={candidateDrawerOpen}
        title={applicationForm.id ? 'Edit Candidate' : 'Add Candidate'}
        description="Create or update candidates and resume scores."
        onClose={() => setCandidateDrawerOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCandidateDrawerOpen(false)} disabled={applicationMutation.isPending}>Cancel</Button>
            <Button type="button" onClick={() => applicationMutation.mutate(applicationForm)} disabled={applicationMutation.isPending}>{applicationMutation.isPending ? 'Saving...' : applicationForm.id ? 'Update Candidate' : 'Create Candidate'}</Button>
          </div>
        }
      >
        <div className="grid gap-3">
          {applicationError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{applicationError}</div> : null}
          {candidateField('jobId', 'Job ID')}
          {candidateField('name', 'Candidate Name')}
          {candidateField('score', 'Resume Score', 'number')}
          {candidateField('stage', 'Stage')}
        </div>
      </Drawer>
    </AppShell>
  );
}
