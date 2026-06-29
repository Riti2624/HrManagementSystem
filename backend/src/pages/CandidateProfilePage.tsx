import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Briefcase, FileText, Upload, Save, CheckCircle, ExternalLink } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function CandidateProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch candidate profile details
  const { data: profile, isLoading } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: () => api.getCandidateProfile()
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Set form states when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setSkills(profile.skills ? profile.skills.join(', ') : '');
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. If a new resume file is selected, upload it first
      let resumeUrl = profile?.resumeUrl || '';
      if (selectedFile) {
        const uploadRes = await api.uploadResume(selectedFile);
        resumeUrl = uploadRes.resumeUrl;
        setSelectedFile(null);
        toast.success('Resume uploaded successfully.');
      }

      // 2. Update profile details
      await api.updateCandidateProfile({
        name,
        phone,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean)
      });

      toast.success('Profile details updated successfully!');
      
      // Invalidate queries to refresh view
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const getResumeName = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  // Helper to construct download link
  const getResumeDownloadUrl = (url: string) => {
    if (!url) return '';
    // If it's a relative url starting with /uploads, prepend the backend API base url
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${apiBase}${url}`;
  };

  if (isLoading) {
    return (
      <AppShell title="My Profile">
        <div className="space-y-6">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="My Profile">
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr] items-start">
          {/* Personal Info Card */}
          <Card className="p-6 md:p-8 space-y-6">
            <div>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Manage your primary contact information and skills settings.</CardDescription>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Aarav Mehta"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address (Read-only)</label>
                <Input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="E.g. +91 98765 43210"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Core Skills (Comma-separated)</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="E.g. React, Node.js, SQL, TypeScript"
                    className="pl-10"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Helpful for automated keyword matching in job applications.</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {profile?.skills && profile.skills.map((skill) => (
                <div key={skill} className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1">
                  {skill}
                </div>
              ))}
            </div>
          </Card>

          {/* Resume Upload Card */}
          <div className="space-y-6">
            <Card className="p-6 space-y-5">
              <div>
                <CardTitle>Curriculum Vitae</CardTitle>
                <CardDescription>Upload your resume (PDF or DOCX format, limit 5MB).</CardDescription>
              </div>

              {/* Upload Drop Zone / Input */}
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all"
                >
                  <Upload size={32} className="text-slate-400 mx-auto mb-2" />
                  <span className="block text-xs font-semibold text-slate-700">Select new file</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Supports PDF / DOCX (5MB)</span>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <span className="text-xs font-medium text-blue-800 truncate">{selectedFile.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 shrink-0 bg-blue-100 px-1.5 py-0.5 rounded uppercase">Pending Save</span>
                  </div>
                )}

                {profile?.resumeUrl && !selectedFile && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      <span className="text-xs text-slate-700 truncate">{getResumeName(profile.resumeUrl)}</span>
                    </div>
                    <a 
                      href={getResumeDownloadUrl(profile.resumeUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 shrink-0"
                    >
                      View <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </Card>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 shadow-lg shadow-blue-500/10"
              disabled={submitting}
            >
              <Save size={16} /> {submitting ? 'Saving Changes...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
