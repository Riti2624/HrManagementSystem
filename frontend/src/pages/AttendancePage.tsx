import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/layout/AppShell';
import { AttendanceChart } from '../components/charts/AttendanceChart';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { mockAttendance } from '../data/mock';

export function AttendancePage() {
  const { data = mockAttendance } = useQuery({ queryKey: ['attendance'], queryFn: () => api.getAttendance() });

  return (
    <AppShell title="Attendance System">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardTitle>Present</CardTitle>
            <div className="mt-3 text-3xl font-bold text-slate-900">{data.summary.presentCount}</div>
            <CardDescription>Employees logged in on time.</CardDescription>
          </Card>
          <Card>
            <CardTitle>Late</CardTitle>
            <div className="mt-3 text-3xl font-bold text-slate-900">{data.summary.lateCount}</div>
            <CardDescription>Late arrivals flagged this week.</CardDescription>
          </Card>
          <Card>
            <CardTitle>Absent</CardTitle>
            <div className="mt-3 text-3xl font-bold text-slate-900">{data.summary.absentCount}</div>
            <CardDescription>Missing check-ins requiring review.</CardDescription>
          </Card>
        </div>

        <AttendanceChart data={data.trend} />

        <Card>
          <CardTitle>Recent Check-ins</CardTitle>
          <div className="mt-4 space-y-3">
            {data.records.map((record) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-medium text-slate-900">{record.employeeId}</div>
                  <div className="text-sm text-slate-400">{record.date} · Geo: {record.geo}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={record.status === 'Present' ? 'success' : record.status === 'Late' ? 'warning' : 'neutral'}>{record.status}</Badge>
                  <div className="text-sm text-slate-300">In {record.checkIn} · Out {record.checkOut || '--'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
