import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { mockLeaves } from '../data/mock';

type LeaveFormState = {
  id?: string;
  employeeId: string;
  type: string;
  from: string;
  to: string;
  reason: string;
  status: string;
  balanceAfter: string;
};

const emptyForm: LeaveFormState = {
  employeeId: 'emp-001',
  type: 'Casual',
  from: '',
  to: '',
  reason: '',
  status: 'Pending',
  balanceAfter: '12'
};

export function LeavePage() {
  const queryClient = useQueryClient();
  const { data = mockLeaves } = useQuery({ queryKey: ['leaves'], queryFn: () => api.getLeaves() });
  const [form, setForm] = useState<LeaveFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  const saveMutation = useMutation({
    mutationFn: async (payload: LeaveFormState) => {
      if (!payload.employeeId.trim() || !payload.from || !payload.to) {
        throw new Error('Employee, from date, and to date are required.');
      }
      if (new Date(payload.from) > new Date(payload.to)) {
        throw new Error('"From" date must be on or before "To" date.');
      }

      const body = {
        ...payload,
        balanceAfter: Number(payload.balanceAfter)
      };

      return payload.id ? api.updateLeave(payload.id, body) : api.createLeave(body);
    },
    onSuccess: async () => {
      setFormError('');
      await queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setForm(emptyForm);
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Unable to save leave request');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteLeave(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] })
  });

  function handleEdit(request: any) {
    setForm({
      id: request.id,
      employeeId: request.employeeId,
      type: request.type,
      from: request.from,
      to: request.to,
      reason: request.reason,
      status: request.status,
      balanceAfter: String(request.balanceAfter ?? '')
    });
  }

  function changeStatus(request: any, status: string) {
    api.updateLeave(request.id, { ...request, status }).then(() => queryClient.invalidateQueries({ queryKey: ['leaves'] }));
  }

  return (
    <AppShell title="Leave Management">
      <div className="space-y-6">
        <Card>
          <CardTitle>Smart Leave Suggestions</CardTitle>
          <CardDescription>Best time recommendations based on workload and team pressure.</CardDescription>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.suggestions.map((item) => (
              <div key={item} className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>{form.id ? 'Edit Leave Request' : 'Apply Leave'}</CardTitle>
          <CardDescription>Create or update leave requests persisted in MongoDB.</CardDescription>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              setFormError('');
              saveMutation.mutate(form);
            }}
          >
            {formError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2 xl:col-span-3">{formError}</div> : null}
            {[ 
              ['employeeId', 'Employee ID'],
              ['type', 'Type'],
              ['from', 'From'],
              ['to', 'To'],
              ['reason', 'Reason'],
              ['status', 'Status'],
              ['balanceAfter', 'Balance After']
            ].map(([key, label]) => (
              <Input
                key={key}
                value={form[key as keyof LeaveFormState]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={label}
              />
            ))}
            <div className="flex gap-3 md:col-span-2 xl:col-span-3">
              <Button type="submit" disabled={saveMutation.isPending}>{form.id ? 'Update Request' : 'Submit Request'}</Button>
              <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>Reset</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle>Leave Requests</CardTitle>
          <div className="mt-4 space-y-3">
            {data.requests.map((request) => (
              <div key={request.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-medium text-white">{request.employeeId} · {request.type}</div>
                  <div className="text-sm text-slate-400">{request.from} to {request.to} · {request.reason}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={request.status === 'Approved' ? 'success' : request.status === 'Pending' ? 'warning' : 'danger'}>{request.status}</Badge>
                  <div className="text-sm text-slate-600">Balance after: {request.balanceAfter}</div>
                  <Button size="sm" variant="secondary" onClick={() => changeStatus(request, 'Approved')}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => changeStatus(request, 'Rejected')}>Reject</Button>
                  <Button size="sm" onClick={() => handleEdit(request)}><Pencil size={14} className="mr-2" /> Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => deleteMutation.mutate(request.id)} disabled={deleteMutation.isPending}><Trash2 size={14} className="mr-2" /> Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
