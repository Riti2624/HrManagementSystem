import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Users, Clock3, BriefcaseBusiness, TrendingUp, Download } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { DashboardCharts } from '../components/charts/DashboardCharts';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { mockDashboard } from '../data/mock';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

export function DashboardPage() {
  const { data = mockDashboard } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.getDashboard() });
  const { data: summary, isLoading: summaryLoading } = useQuery({ queryKey: ['daily-summary'], queryFn: () => api.getDailySummary() });

  return (
    <AppShell title="HR Dashboard">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Employees" value={`${data.totalEmployees}`} subtext="Active workforce" accent="bg-blue-600" />
          <StatCard label="Attendance Rate" value={`${data.attendanceRate}%`} subtext="Weekly average" accent="bg-emerald-600" />
          <StatCard label="Attrition Risk" value={`${data.attritionRiskCount}`} subtext="High risk employees" accent="bg-rose-600" />
          <StatCard label="Hiring Pipeline" value={`${data.hiringPipeline}`} subtext="Open candidates" accent="bg-amber-600" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <DashboardCharts workload={data.departmentWorkload} />
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>AI Daily Summary</CardTitle>
                <CardDescription>Auto-generated priorities from the HR Copilot engine.</CardDescription>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    const blob = await api.downloadHrReport();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'hr-summary.pdf';
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('HR report downloaded');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to download report');
                  }
                }}
              >
                <Download size={14} className="mr-2" />
                Download HR Report
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {summaryLoading ? (
                <div className="space-y-3">
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-center gap-2 text-rose-700"><AlertTriangle size={16} /> Executive Summary</div>
                    <p className="mt-2 text-sm text-slate-700">{summary?.summary || 'Daily summary unavailable.'}</p>
                  </div>
                  {(summary?.bullets || []).slice(0, 2).map((bullet) => (
                    <div key={bullet} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 text-amber-700"><TrendingUp size={16} /> Insight</div>
                      <p className="mt-2 text-sm text-slate-700">{bullet}</p>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center gap-2 text-blue-700"><ArrowUpRight size={16} /> Suggested Action</div>
                    <p className="mt-2 text-sm text-slate-700">{summary?.recommendations?.[0] || 'Review workload and retention signals.'}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardTitle>High-Risk Employees</CardTitle>
            <CardDescription>Retention watch list powered by attendance, salary, sentiment, and workload signals.</CardDescription>
            <div className="mt-4 space-y-3">
              {data.highRiskEmployees.map((name, index) => (
                <motion.div key={name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-900">{name}</div>
                    <div className="text-xs text-slate-500">Needs manager intervention</div>
                  </div>
                  <Badge tone="danger">High</Badge>
                </motion.div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Live alerts from attendance, leave, and payroll workflows.</CardDescription>
            <div className="mt-4 space-y-3">
              {data.notifications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900"><Clock3 size={16} /> {item.title}</div>
                  <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400"><BriefcaseBusiness size={16} /> Designed for SaaS-grade HR operations.</div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
