import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Wizard } from '../components/ui/Wizard';
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

const wizardSteps = [
  { title: 'Profile', description: 'Identity and contact' },
  { title: 'Role', description: 'Team and employment' },
  { title: 'Metrics', description: 'Risk and performance' }
];

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const { data = mockEmployees } = useQuery({ queryKey: ['employees'], queryFn: () => api.getEmployees() });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(0);

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
      await queryClient.invalidateQueries({ queryKey: ['leaves'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setForm(emptyForm);
      setIsWizardOpen(false);
      setStep(0);
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Unable to save employee');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] })
  });

  function openCreateWizard() {
    setForm(emptyForm);
    setFormError('');
    setStep(0);
    setIsWizardOpen(true);
  }

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
    setFormError('');
    setStep(0);
    setIsWizardOpen(true);
  }

  const field = (key: keyof EmployeeFormState, placeholder: string, type = 'text') => (
    <Input type={type} value={form[key] || ''} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} />
  );

  return (
    <AppShell title="Employee Management">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Search, filter, and keep employee records persisted in MongoDB.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees" className="pl-10" />
              </div>
              <select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900">
                {departments.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <Button type="button" onClick={openCreateWizard}><Plus size={16} className="mr-2" /> Add Employee</Button>
            </div>
          </div>
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

      <Wizard
        open={isWizardOpen}
        title={form.id ? 'Edit Employee' : 'Add Employee'}
        description="Complete the employee profile in focused steps."
        steps={wizardSteps}
        currentStep={step}
        onClose={() => setIsWizardOpen(false)}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || saveMutation.isPending}>Back</Button>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsWizardOpen(false)} disabled={saveMutation.isPending}>Cancel</Button>
              {step < wizardSteps.length - 1 ? (
                <Button type="button" onClick={() => setStep((current) => current + 1)}>Next</Button>
              ) : (
                <Button type="button" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : form.id ? 'Update Employee' : 'Create Employee'}</Button>
              )}
            </div>
          </div>
        }
      >
        {formError ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div> : null}
        {step === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {field('name', 'Name')}
            {field('email', 'Email')}
            {field('phone', 'Phone')}
            {field('location', 'Location')}
          </div>
        ) : null}
        {step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {field('role', 'Role')}
            {field('department', 'Department')}
            {field('status', 'Status')}
            {field('skillsText', 'Skills')}
          </div>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {field('salary', 'Salary', 'number')}
            {field('performanceScore', 'Performance Score', 'number')}
            {field('attendanceRate', 'Attendance Rate', 'number')}
            {field('sentimentScore', 'Sentiment Score', 'number')}
            {field('workload', 'Workload', 'number')}
            {field('attritionRisk', 'Attrition Risk')}
          </div>
        ) : null}
      </Wizard>
    </AppShell>
  );
}
