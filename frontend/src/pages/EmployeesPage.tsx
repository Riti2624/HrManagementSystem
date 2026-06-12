import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../lib/api';
import { mockEmployees } from '../data/mock';

type EmployeeFormState = {
  id?: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  salary: string;
  performanceScore: string;
  attendanceRate: string;
  sentimentScore: string;
  workload: string;
  attritionRisk: string;
  skillsText: string;
};

const emptyForm: EmployeeFormState = {
  name: '',
  role: '',
  department: 'Engineering',
  email: '',
  phone: '',
  location: '',
  status: 'Active',
  salary: '',
  performanceScore: '',
  attendanceRate: '',
  sentimentScore: '',
  workload: '',
  attritionRisk: 'Low',
  skillsText: ''
};

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const { data = mockEmployees } = useQuery({ queryKey: ['employees'], queryFn: () => api.getEmployees() });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  const departments = ['All', ...Array.from(new Set(data.map((employee) => employee.department)))];
  const filtered = useMemo(() => data.filter((employee) => {
    const matchesSearch = [employee.name, employee.role, employee.department, employee.email].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = department === 'All' || employee.department === department;
    return matchesSearch && matchesDepartment;
  }), [data, search, department]);

  const saveMutation = useMutation({
    mutationFn: async (payload: EmployeeFormState) => {
      if (!payload.name.trim() || !payload.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        throw new Error('Please provide a valid employee name and email.');
      }
      if (Number(payload.salary) < 0 || Number(payload.performanceScore) < 0 || Number(payload.attendanceRate) < 0 || Number(payload.attendanceRate) > 100) {
        throw new Error('Employee metrics must be valid numbers within range.');
      }

      const body = {
        ...payload,
        salary: Number(payload.salary),
        performanceScore: Number(payload.performanceScore),
        attendanceRate: Number(payload.attendanceRate),
        sentimentScore: Number(payload.sentimentScore),
        workload: Number(payload.workload),
        skills: payload.skillsText.split(',').map((skill) => skill.trim()).filter(Boolean)
      };

      return payload.id ? api.updateEmployee(payload.id, body) : api.createEmployee(body);
    },
    onSuccess: async () => {
      setFormError('');
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      setForm(emptyForm);
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Unable to save employee');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] })
  });

  function handleEdit(employee: any) {
    setForm({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      email: employee.email,
      phone: employee.phone || '',
      location: employee.location || '',
      status: employee.status || 'Active',
      salary: String(employee.salary || ''),
      performanceScore: String(employee.performanceScore || ''),
      attendanceRate: String(employee.attendanceRate || ''),
      sentimentScore: String(employee.sentimentScore || ''),
      workload: String(employee.workload || ''),
      attritionRisk: employee.attritionRisk || 'Low',
      skillsText: Array.isArray(employee.skills) ? employee.skills.join(', ') : ''
    });
  }

  return (
    <AppShell title="Employee Management">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Search, filter, and keep employee records persisted in MongoDB.</CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees" className="pl-10" />
              </div>
              <select value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                {departments.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>{form.id ? 'Edit Employee' : 'Add Employee'}</CardTitle>
          <CardDescription>Create or update records without leaving the page.</CardDescription>
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
              ['name', 'Name'],
              ['role', 'Role'],
              ['department', 'Department'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['location', 'Location'],
              ['status', 'Status'],
              ['salary', 'Salary'],
              ['performanceScore', 'Performance Score'],
              ['attendanceRate', 'Attendance Rate'],
              ['sentimentScore', 'Sentiment Score'],
              ['workload', 'Workload'],
              ['attritionRisk', 'Attrition Risk'],
              ['skillsText', 'Skills']
            ].map(([key, label]) => (
              <Input
                key={key}
                value={form[key as keyof EmployeeFormState]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={label}
              />
            ))}
            <div className="flex gap-3 md:col-span-2 xl:col-span-3">
              <Button type="submit" disabled={saveMutation.isPending}>{form.id ? 'Update Employee' : 'Create Employee'}</Button>
              <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>Reset</Button>
            </div>
          </form>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState title="No employees found" description="Try another search term or switch to a different department filter." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((employee) => (
              <Card key={employee.id} className="transition-transform hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{employee.name}</div>
                    <div className="text-sm text-slate-500">{employee.role}</div>
                  </div>
                  <Badge tone={employee.attritionRisk === 'High' ? 'danger' : employee.attritionRisk === 'Medium' ? 'warning' : 'success'}>{employee.attritionRisk} risk</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
                  <div>Department: <span className="text-slate-900">{employee.department}</span></div>
                  <div>Email: <span className="text-slate-900">{employee.email}</span></div>
                  <div>Attendance: <span className="text-slate-900">{employee.attendanceRate}%</span></div>
                  <div>Performance: <span className="text-slate-900">{employee.performanceScore}</span></div>
                  <div>Salary: <span className="text-slate-900">${employee.salary.toLocaleString()}</span></div>
                  <div>Workload: <span className="text-slate-900">{employee.workload}%</span></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {employee.skills.map((skill) => <Badge key={skill} tone="info">{skill}</Badge>)}
                </div>
                <div className="mt-5 flex gap-3">
                  <Button size="sm" onClick={() => handleEdit(employee)}><Pencil size={14} className="mr-2" /> Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => deleteMutation.mutate(employee.id)} disabled={deleteMutation.isPending}><Trash2 size={14} className="mr-2" /> Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
