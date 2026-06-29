import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Briefcase, Users, FileText, Upload, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { toast } from 'sonner';

// Custom job detail content generator based on role title
const getJobDetailsData = (title: string) => {
  const t = (title || '').toLowerCase();
  if (t.includes('backend') || t.includes('engineer') && (t.includes('server') || t.includes('api'))) {
    return {
      description: "We are seeking a talented Backend Engineer to join our core product team. You will be responsible for developing scalable APIs, optimizing database performance, and building automated integrations using Node.js, Express, and PostgreSQL.",
      requirements: [
        "3+ years of professional backend development experience.",
        "Deep expertise in Node.js, TypeScript, and SQL (PostgreSQL).",
        "Experience building secure RESTful APIs and microservice architectures.",
        "Familiarity with Docker and basic AWS infrastructure services is a plus."
      ],
      responsibilities: [
        "Design, write, and maintain clean, performant, and secure database schemas and queries.",
        "Build reusable software components and maintain API endpoints.",
        "Collaborate with frontend engineers to integrate user-facing designs with server-side logic.",
        "Analyze and optimize application bottlenecks to ensure low latency and high availability."
      ]
    };
  } else if (t.includes('frontend') || t.includes('react') || t.includes('design') || t.includes('ui') || t.includes('engineer')) {
    return {
      description: "We are looking for a creative Frontend Engineer to help us design and implement beautiful, fast user interfaces. You will work closely with designers and backend engineers to build a seamless experience in our core SaaS application.",
      requirements: [
        "3+ years of experience with modern frontend frameworks, particularly React and TailwindCSS.",
        "Strong understanding of web core concepts, including DOM, TypeScript, and HTML5/CSS3.",
        "Experience with animation libraries like Framer Motion and responsive UI design rules.",
        "Comfortable working with state management libraries (Zustand, Redux) and RESTful integrations."
      ],
      responsibilities: [
        "Build highly interactive, accessible, and responsive components using React.",
        "Collaborate with UX/UI designers to translate high-fidelity mocks into living code.",
        "Maintain clean modular CSS/Tailwind utilities and optimize overall client bundle sizes.",
        "Participate in design systems development and component libraries curation."
      ]
    };
  } else if (t.includes('hr') || t.includes('generalist') || t.includes('people') || t.includes('recruitment')) {
    return {
      description: "We are in search of an HR Specialist/Generalist to join our People Operations department. You will assist in managing internal employee queries, coordinate hiring cycles, prepare payroll summaries, and implement team culture workflows.",
      requirements: [
        "2+ years of human resource coordination or generalist experience.",
        "Excellent communication skills and strong emotional intelligence.",
        "Familiarity with compliance standards, labor legislation, and candidate tracking software.",
        "Detail-oriented mindset with high discretion and data management capability."
      ],
      responsibilities: [
        "Co-manage applicant interview pipelines, scheduling, and onboarding activities.",
        "Assist in leave requests reviews, employee records auditing, and payroll runs validation.",
        "Facilitate employee relations, wellness check-ins, and organize internal events.",
        "Oversee compliance reporting and workspace policy upgrades implementation."
      ]
    };
  } else {
    return {
      description: "We are hiring for this role to expand our cross-functional delivery team. In this position, you will work on core client integrations, product features delivery, and operational workflows optimizations under our agile execution model.",
      requirements: [
        "Bachelor's degree or equivalent practical experience in the relevant field.",
        "Strong problem-solving capability, organization skill, and adaptability.",
        "Proven ability to work in cooperative, collaborative team setups.",
        "Experience utilizing CRM, productivity, or standard engineering software suites."
      ],
      responsibilities: [
        "Participate in sprint plans, standups, and contribute to delivery benchmarks.",
        "Troubleshoot operational bottlenecks and provide efficient, timely resolution plans.",
        "Document systems procedures, guides, and update operational reference logs.",
        "Partner with cross-department teams to coordinate product launch timelines."
      ]
    };
  }
};

export function CandidateJobDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch job details
  const { data: job, isLoading: jobLoading, error: jobError } = useQuery({
    queryKey: ['candidate-job-detail', id],
    queryFn: () => api.getCandidateJobDetails(id),
    retry: false
  });

  // Fetch candidate profile to get profile resume
  const { data: profile } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: () => api.getCandidateProfile()
  });

  // Fetch applications to see if candidate already applied
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.getCandidateApplications()
  });

  const alreadyApplied = applications.find(app => app.jobCode === job?.jobCode);

  const detailData = job ? getJobDetailsData(job.title) : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUseProfileResume(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setSubmitting(true);

    try {
      let finalResumeUrl = profile?.resumeUrl || '';

      // If uploading a new resume, call the upload API first
      if (!useProfileResume) {
        if (!selectedFile) {
          toast.error('Please select a resume file to upload.');
          setSubmitting(false);
          return;
        }
        const uploadRes = await api.uploadResume(selectedFile);
        finalResumeUrl = uploadRes.resumeUrl;
      }

      if (!finalResumeUrl && !selectedFile) {
        toast.error('Resume is required. Please upload one or configure it in your profile.');
        setSubmitting(false);
        return;
      }

      await api.applyForJob({
        jobCode: job.jobCode,
        resumeUrl: finalResumeUrl,
        coverLetter
      });

      toast.success(`Successfully applied for the ${job.title} position!`);
      
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-job-detail', id] });

      setSelectedFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply for job');
    } finally {
      setSubmitting(false);
    }
  };

  if (jobLoading || appsLoading) {
    return (
      <AppShell title="Job Details">
        <div className="space-y-6">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (jobError || !job) {
    return (
      <AppShell title="Job Details">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle size={48} className="text-amber-500 mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Job Opening Not Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            The job you are looking for might have been closed or deleted.
          </p>
          <Link to="/jobs" className="mt-4">
            <Button size="sm">Back to Job Openings</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const priorityColors: Record<string, 'danger' | 'warning' | 'info'> = {
    'High': 'danger',
    'Medium': 'warning',
    'Low': 'info'
  };

  const stageColors: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
    'New': 'info',
    'Shortlisted': 'info',
    'Interview': 'warning',
    'Offer': 'success',
    'Rejected': 'danger',
    'Withdrawn': 'danger'
  };

  const getProfileResumeName = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <AppShell title="Job Details">
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={16} /> Back to Openings
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
          {/* Main Description */}
          <div className="space-y-6">
            <Card className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{job.department}</div>
                  <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{job.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><MapPin size={12} /> Remote / HQ</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {job.applicants || 0} applicants</span>
                    <span>•</span>
                    <span>Job Code: {job.jobCode}</span>
                  </div>
                </div>
                <Badge tone={priorityColors[job.priority] || 'info'}>
                  {job.priority} Priority
                </Badge>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-2">Job Description</h3>
                <p className="text-sm leading-relaxed text-slate-600">{detailData?.description}</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-3">Key Responsibilities</h3>
                <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-600 space-y-2">
                  {detailData?.responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-3">Requirements & Experience</h3>
                <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-600 space-y-2">
                  {detailData?.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          {/* Sidebar Application Card */}
          <div className="sticky top-24">
            {alreadyApplied ? (
              <Card className="p-6 border-blue-200 bg-blue-50/50 space-y-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Check size={16} />
                  </div>
                  <div className="font-bold text-base">Application Submitted!</div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Thank you for applying. Our hiring managers are currently reviewing your profile and credentials.
                </p>
                <div className="border-t border-slate-200/80 pt-4 flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Application Status:</span>
                  <Badge tone={stageColors[alreadyApplied.stage] || 'info'}>
                    {alreadyApplied.stage}
                  </Badge>
                </div>
              </Card>
            ) : (
              <Card className="p-6 space-y-5">
                <div>
                  <CardTitle className="text-lg">Apply for this role</CardTitle>
                  <CardDescription>Upload your resume to submit your application details.</CardDescription>
                </div>

                <form onSubmit={handleApply} className="space-y-4">
                  {/* Select Resume Source */}
                  <div className="space-y-3">
                    {profile?.resumeUrl ? (
                      <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="resumeSource"
                          checked={useProfileResume}
                          onChange={() => setUseProfileResume(true)}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-left">
                          <span className="block text-xs font-semibold text-slate-800">Use Profile Resume</span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <FileText size={12} /> {getProfileResumeName(profile.resumeUrl)}
                          </span>
                        </div>
                      </label>
                    ) : (
                      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <div>
                          No resume found in profile. Please upload one below or update it on your{' '}
                          <Link to="/profile" className="underline font-semibold text-amber-900">
                            profile page
                          </Link>
                          .
                        </div>
                      </div>
                    )}

                    <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer transition">
                      <input
                        type="radio"
                        name="resumeSource"
                        checked={!useProfileResume}
                        onChange={() => setUseProfileResume(false)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="text-left flex-1">
                        <span className="block text-xs font-semibold text-slate-800">Upload new resume</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">Accepts PDF or DOCX (Max 5MB)</span>
                        
                        {!useProfileResume && (
                          <div className="mt-3">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".pdf,.docx"
                              className="hidden"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5"
                            >
                              <Upload size={13} /> {selectedFile ? 'Change File' : 'Select Resume'}
                            </Button>
                            
                            {selectedFile && (
                              <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                <FileText size={12} className="shrink-0" />
                                <span className="truncate">{selectedFile.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Cover Letter Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1.5">Cover Letter (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Introduce yourself and explain why you're a great fit..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 shadow-lg shadow-blue-500/10"
                    disabled={submitting || (!useProfileResume && !selectedFile) || (useProfileResume && !profile?.resumeUrl)}
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                  </Button>
                </form>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-start gap-2">
                  <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Applying updates the job's candidate logs. Our matching algorithm reviews key terms against requirements.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
