import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Users, Sparkles, Filter, Search, ArrowRight } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';

export function CandidateJobsPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['candidate-jobs'],
    queryFn: () => api.getCandidateJobs()
  });

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Extract unique departments
  const departments = useMemo(() => {
    const deps = new Set(jobs.map(j => j.department).filter(Boolean));
    return ['All', ...Array.from(deps)];
  }, [jobs]);

  // Filter jobs based on search term & department
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(search.toLowerCase()) || 
        job.department.toLowerCase().includes(search.toLowerCase()) ||
        job.jobCode.toLowerCase().includes(search.toLowerCase());
      
      const matchesDept = departmentFilter === 'All' || job.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [jobs, search, departmentFilter]);

  const priorityColors: Record<string, 'danger' | 'warning' | 'info'> = {
    'High': 'danger',
    'Medium': 'warning',
    'Low': 'info'
  };

  return (
    <AppShell title="Job Openings">
      <div className="space-y-6">
        {/* Banner header */}
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 md:p-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-semibold text-blue-700">
              <Sparkles size={12} /> Join our growing team
            </div>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Find your next career step</h2>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">
              Discover opportunities that align with your experience and interests. Submit applications, upload your resume, and track interview progress in real-time.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs by title or keyword..."
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 transition"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 px-4 text-center">
            <Briefcase size={44} className="text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-900">No open positions found</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Try adjusting your keyword search or category filters to explore other roles.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="flex flex-col h-full hover:shadow-lg hover:border-blue-200 transition-all p-6 group">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{job.department}</div>
                      <CardTitle className="group-hover:text-blue-700 transition-colors text-lg font-bold">{job.title}</CardTitle>
                    </div>
                    <Badge tone={priorityColors[job.priority] || 'info'}>
                      {job.priority} Priority
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-6 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} /> Remote / HQ
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} /> {job.applicants || 0} applicants
                    </div>
                    <div className="font-medium text-slate-400">Code: {job.jobCode}</div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      Posted recently
                    </span>
                    <Link to={`/jobs/${job.jobCode}`}>
                      <Button className="flex items-center gap-1 group/btn" size="sm">
                        View Details <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
