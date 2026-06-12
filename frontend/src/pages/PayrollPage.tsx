import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { mockPayroll } from '../data/mock';

export function PayrollPage() {
  const { data = mockPayroll } = useQuery({ queryKey: ['payroll'], queryFn: () => api.getPayroll() });

  return (
    <AppShell title="Payroll Insights">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Salary Breakdown</CardTitle>
          <CardDescription>Net pay, bonus, deductions, and market benchmark positioning.</CardDescription>
          <div className="mt-4 space-y-3">
            {data.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-900">{item.employeeId}</div>
                  <Badge tone={item.benchmark >= 0.9 ? 'success' : 'warning'}>{item.benchmarkLabel}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                  <div>Base: <span className="text-slate-900">${item.base.toLocaleString()}</span></div>
                  <div>Bonus: <span className="text-slate-900">${item.bonus.toLocaleString()}</span></div>
                  <div>Deductions: <span className="text-slate-900">${item.deductions.toLocaleString()}</span></div>
                  <div>Net: <span className="text-slate-900">${item.net.toLocaleString()}</span></div>
                </div>
                <p className="mt-3 text-sm text-slate-400">{item.raiseSuggestion}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Benchmark Comparison</CardTitle>
          <CardDescription>Payroll vs market insights for faster compensation decisions.</CardDescription>
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="text-sm text-slate-600">Recommended actions</div>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>Review support salaries first because benchmark pressure is highest there.</li>
              <li>Increase salary bands for select engineering roles to reduce attrition risk.</li>
              <li>Use payroll insights alongside performance score before approving raises.</li>
            </ul>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
