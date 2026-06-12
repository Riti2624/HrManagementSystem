import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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

  function handleEditJob(job: any) {
    setJobForm({
      id: job.id,
      title: job.title,
      department: job.department,
      status: job.status,
      applicants: String(job.applicants ?? 0),
      priority: job.priority
    });
  }

  function handleEditApplication(candidate: any) {
    setApplicationForm({
      id: candidate.id,
      jobId: candidate.jobId,
      name: candidate.name,
      score: String(candidate.score ?? 0),
      stage: candidate.stage
    });
  }

  return (
    <AppShell title="Recruitment Hub">
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardTitle>{jobForm.id ? 'Edit Job Posting' : 'Open New Role'}</CardTitle>
            <CardDescription>Create or update job postings with Mongo persistence.</CardDescription>
            <form
              className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              setJobError('');
              jobMutation.mutate(jobForm);
            }}
          >
              {jobError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">{jobError}</div> : null}
              {[
                ['title', 'Title'],
                ['department', 'Department'],
                ['status', 'Status'],
                ['applicants', 'Applicants'],
                ['priority', 'Priority']
              ].map(([key, label]) => (
                <Input
                  key={key}
                  value={jobForm[key as keyof JobFormState]}
                  onChange={(event) => setJobForm((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder={label}
                />
              ))}
              <div className="flex gap-3 md:col-span-2">
                <Button type="submit" disabled={jobMutation.isPending}>{jobForm.id ? 'Update Job' : 'Create Job'}</Button>
                <Button type="button" variant="secondary" onClick={() => setJobForm(emptyJobForm)}>Reset</Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardTitle>{applicationForm.id ? 'Edit Candidate' : 'Add Candidate'}</CardTitle>
            <CardDescription>Create or update candidates and resume scores.</CardDescription>
            <form
              className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              setApplicationError('');
              applicationMutation.mutate(applicationForm);
            }}
          >
              {applicationError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">{applicationError}</div> : null}
              {[
                ['jobId', 'Job ID'],
                ['name', 'Candidate Name'],
                ['score', 'Resume Score'],
                ['stage', 'Stage']
              ].map(([key, label]) => (
                <Input
                  key={key}
                  value={applicationForm[key as keyof ApplicationFormState]}
                  onChange={(event) => setApplicationForm((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder={label}
                />
              ))}
              <div className="flex gap-3 md:col-span-2">
                <Button type="submit" disabled={applicationMutation.isPending}>{applicationForm.id ? 'Update Candidate' : 'Create Candidate'}</Button>
                <Button type="button" variant="secondary" onClick={() => setApplicationForm(emptyApplicationForm)}>Reset</Button>
              </div>
            </form>
          </Card>
        </div>

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
                  <div className="mt-3 text-sm text-slate-300">{job.applicants} applicants · {job.status}</div>
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
    </AppShell>
  );
}
