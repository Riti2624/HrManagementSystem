import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Download, UserX, UserCheck, ChevronLeft, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { mockRecruitment } from '../data/mock';

// Types (re-used from other parts for simplicity)
type Application = Record<string, unknown>;
type Job = Record<string, unknown>;

export function ApplicantsPage() {
  const queryClient = useQueryClient();
  const { data = mockRecruitment, isLoading } = useQuery({ 
    queryKey: ['recruitment'], 
    queryFn: () => api.getRecruitment() 
  });

  const jobs: Job[] = data?.jobs || [];
  const applications: Application[] = data?.applications || [];

  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const stageMutation = useMutation({
    mutationFn: ({ id, stage, recruiterNotes }: { id: string; stage: string; recruiterNotes?: string }) => 
      api.updateApplication(id, recruiterNotes !== undefined ? { stage, recruiterNotes } : { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    }
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, recruiterNotes }: { id: string; recruiterNotes: string }) => 
      api.updateApplication(id, { recruiterNotes }),
    onSuccess: (updatedApp) => {
      queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      setSelectedApp(updatedApp as any);
    }
  });

  // Derived state
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchSearch = String(app.name).toLowerCase().includes(search.toLowerCase());
      const matchJob = jobFilter ? app.jobCode === jobFilter : true;
      const matchStage = stageFilter ? app.stage === stageFilter : true;
      return matchSearch && matchJob && matchStage;
    });
  }, [applications, search, jobFilter, stageFilter]);

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApps.slice(start, start + itemsPerPage);
  }, [filteredApps, currentPage]);

  // Reset pagination if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, jobFilter, stageFilter]);

  const openProfile = (app: Application) => {
    setSelectedApp(app);
    setNotes(String(app.recruiterNotes || ''));
    setDrawerOpen(true);
  };

  const handleSaveNotes = () => {
    if (selectedApp) {
      notesMutation.mutate({ id: String(selectedApp.id), recruiterNotes: notes });
    }
  };

  const handleStageChange = (newStage: string) => {
    if (selectedApp) {
      stageMutation.mutate({ id: String(selectedApp.id), stage: newStage });
      setSelectedApp({ ...selectedApp, stage: newStage });
    }
  };

  const STAGES = ['New', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

  if (isLoading) {
    return (
      <AppShell title="Applicant Management">
        <div className="flex justify-center items-center h-64 text-slate-500">Loading applicants...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Applicant Management">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Candidates ({filteredApps.length})</CardTitle>
              <CardDescription>Manage your candidate pipeline, view profiles, and update application status.</CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search candidates by name..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[180px]"
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              {jobs.map(job => (
                <option key={String(job.jobCode)} value={String(job.jobCode)}>
                  {String(job.title)}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[150px]"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </Card>

        {/* Candidate List */}
        <div className="grid gap-3">
          {paginatedApps.length === 0 ? (
            <Card className="py-12 text-center text-sm text-slate-500">
              No candidates found matching your filters.
            </Card>
          ) : (
            paginatedApps.map((app) => {
              const job = jobs.find(j => j.jobCode === app.jobCode);
              return (
                <Card 
                  key={String(app.id)} 
                  className="cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => openProfile(app)}
                >
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">
                        {String(app.name).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{String(app.name)}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{job ? String(job.title) : String(app.jobCode)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className="hidden md:block w-32">
                        {Number(app.aiScore) > 0 ? (
                          <div className="text-xs">
                            <span className="font-semibold text-blue-700">AI Score: {Number(app.aiScore)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not screened</span>
                        )}
                      </div>
                      <div className="w-24">
                        <Badge tone={
                          app.stage === 'Hired' || app.stage === 'Offer' ? 'success' :
                          app.stage === 'Rejected' ? 'danger' : 'info'
                        }>
                          {String(app.stage)}
                        </Badge>
                      </div>
                      <Button variant="secondary" size="sm" className="ml-auto sm:ml-0 shrink-0">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredApps.length)} of {filteredApps.length} candidates
            </span>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Profile Drawer */}
      {selectedApp && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Candidate Profile"
          description={`Details for ${String(selectedApp.name)}`}
          footer={
            <div className="flex justify-between items-center w-full">
              <Button 
                variant="secondary" 
                className="text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                onClick={() => handleStageChange('Rejected')}
                disabled={selectedApp.stage === 'Rejected' || stageMutation.isPending}
              >
                <UserX size={15} className="mr-1.5" /> Reject
              </Button>
              <Button onClick={() => setDrawerOpen(false)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{String(selectedApp.name)}</h3>
                <p className="text-sm text-slate-500">
                  Applying for: <span className="font-semibold text-slate-700">
                    {String(jobs.find(j => j.jobCode === selectedApp.jobCode)?.title || selectedApp.jobCode)}
                  </span>
                </p>
              </div>
              <Badge tone="neutral" className="text-sm px-3 py-1">{String(selectedApp.stage)}</Badge>
            </div>

            {/* Stage update */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Update Hiring Stage</label>
              <div className="flex gap-2 items-center">
                <select
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={String(selectedApp.stage)}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={stageMutation.isPending}
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {stageMutation.isPending && <span className="text-xs text-slate-400">Saving...</span>}
              </div>
            </div>

            {/* AI Summary & Cover Letter & Skills */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-blue-600" /> AI Summary
                  </h4>
                  {selectedApp.aiSummary ? (
                    <p className="text-sm text-slate-600">{String(selectedApp.aiSummary)}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No AI screening performed yet.</p>
                  )}
                </div>
                
                {Array.isArray(selectedApp.skills) && selectedApp.skills.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 mb-2">Candidate Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedApp.skills as string[]).map((skill: string, i: number) => (
                        <span key={i} className="inline-block bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Cover Letter</h4>
                {selectedApp.coverLetter ? (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{String(selectedApp.coverLetter)}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No cover letter provided.</p>
                )}
              </div>
            </div>

            {/* Resume Download */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">Attachments</h4>
              <Button 
                variant="secondary" 
                className="w-full flex items-center justify-between bg-white border border-slate-200"
                onClick={() => {
                  if (selectedApp.resumeUrl) {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                    const url = String(selectedApp.resumeUrl).startsWith('http') 
                      ? String(selectedApp.resumeUrl) 
                      : `${baseUrl}${selectedApp.resumeUrl}`;
                    window.open(url, '_blank');
                  } else {
                    alert('No resume file attached for this candidate.');
                  }
                }}
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <FileText size={16} className="text-blue-600" /> 
                  {selectedApp.resumeUrl ? 'Resume_Document.pdf' : 'No Resume Attached'}
                </span>
                <Download size={16} className="text-slate-400" />
              </Button>
            </div>

            {/* Recruiter Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900">Recruiter Notes</h4>
                {notes !== String(selectedApp.recruiterNotes || '') && (
                  <Button 
                    size="sm" 
                    className="h-6 text-[10px] px-2 py-0"
                    onClick={handleSaveNotes}
                    disabled={notesMutation.isPending}
                  >
                    {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
                  </Button>
                )}
              </div>
              <textarea
                className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y"
                placeholder="Add private notes about this candidate..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
              />
            </div>

          </div>
        </Drawer>
      )}
    </AppShell>
  );
}
