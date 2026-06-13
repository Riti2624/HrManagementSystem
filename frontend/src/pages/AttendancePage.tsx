import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '../components/layout/AppShell';
import { AttendanceChart } from '../components/charts/AttendanceChart';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { mockAttendance } from '../data/mock';

type AttendanceFormState = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  geo: string;
};

export function AttendancePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data = mockAttendance } = useQuery({ queryKey: ['attendance'], queryFn: () => api.getAttendance() });
  const [editingRecord, setEditingRecord] = useState<AttendanceFormState | null>(null);
  const [formError, setFormError] = useState('');
  const canManageAttendance = user?.role === 'HR' || user?.role === 'Admin';

  const updateMutation = useMutation({
    mutationFn: async (payload: AttendanceFormState) => {
      if (!payload.employeeId.trim() || !payload.date || !payload.status) {
        throw new Error('Employee, date, and status are required.');
      }

      return api.updateAttendance(payload.id, {
        employeeId: payload.employeeId,
        date: payload.date,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        status: payload.status,
        geo: payload.geo
      });
    },
    onSuccess: async () => {
      setEditingRecord(null);
      setFormError('');
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Attendance record updated');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to update attendance record';
      setFormError(message);
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAttendance(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Attendance record deleted');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to delete attendance record');
    }
  });

  function handleEdit(record: AttendanceFormState) {
    setEditingRecord({
      id: record.id,
      employeeId: record.employeeId,
      date: record.date,
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      status: record.status || 'Present',
      geo: record.geo || ''
    });
    setFormError('');
  }

  function handleDelete(record: AttendanceFormState) {
    if (window.confirm(`Delete attendance record for ${record.employeeId} on ${record.date}?`)) {
      deleteMutation.mutate(record.id);
    }
  }

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Recent Check-ins</CardTitle>
              <CardDescription>Review daily punches and correct records when needed.</CardDescription>
            </div>
            {canManageAttendance ? <Badge tone="info">HR/Admin</Badge> : null}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-medium">Employee</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Check In</th>
                  <th className="px-3 py-3 font-medium">Check Out</th>
                  <th className="px-3 py-3 font-medium">Geo</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  {canManageAttendance ? <th className="px-3 py-3 text-right font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.records.map((record: AttendanceFormState) => (
                  <tr key={record.id} className="bg-white">
                    <td className="px-3 py-3 font-medium text-slate-900">{record.employeeId}</td>
                    <td className="px-3 py-3 text-slate-500">{record.date}</td>
                    <td className="px-3 py-3 text-slate-500">{record.checkIn || '--'}</td>
                    <td className="px-3 py-3 text-slate-500">{record.checkOut || '--'}</td>
                    <td className="px-3 py-3 text-slate-500">{record.geo || '--'}</td>
                    <td className="px-3 py-3">
                      <Badge tone={record.status === 'Present' ? 'success' : record.status === 'Late' ? 'warning' : 'neutral'}>{record.status}</Badge>
                    </td>
                    {canManageAttendance ? (
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(record)} disabled={updateMutation.isPending || deleteMutation.isPending} aria-label="Edit attendance">
                            <Pencil size={14} />
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(record)} disabled={deleteMutation.isPending} aria-label="Delete attendance">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {editingRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Edit Attendance</CardTitle>
                <CardDescription>Update the selected check-in record.</CardDescription>
              </div>
              <Button size="sm" variant="ghost" type="button" onClick={() => setEditingRecord(null)} aria-label="Close edit modal">
                <X size={16} />
              </Button>
            </div>
            <form
              className="mt-5 grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setFormError('');
                updateMutation.mutate(editingRecord);
              }}
            >
              {formError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">{formError}</div> : null}
              <Input value={editingRecord.employeeId} onChange={(event) => setEditingRecord((current) => current ? { ...current, employeeId: event.target.value } : current)} placeholder="Employee ID" />
              <Input type="date" value={editingRecord.date} onChange={(event) => setEditingRecord((current) => current ? { ...current, date: event.target.value } : current)} />
              <Input type="time" value={editingRecord.checkIn} onChange={(event) => setEditingRecord((current) => current ? { ...current, checkIn: event.target.value } : current)} />
              <Input type="time" value={editingRecord.checkOut} onChange={(event) => setEditingRecord((current) => current ? { ...current, checkOut: event.target.value } : current)} />
              <Input value={editingRecord.geo} onChange={(event) => setEditingRecord((current) => current ? { ...current, geo: event.target.value } : current)} placeholder="Geo location" />
              <select value={editingRecord.status} onChange={(event) => setEditingRecord((current) => current ? { ...current, status: event.target.value } : current)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                {['Present', 'Late', 'Absent', 'On Leave'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <div className="flex justify-end gap-3 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setEditingRecord(null)} disabled={updateMutation.isPending}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
