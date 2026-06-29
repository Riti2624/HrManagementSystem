import { AppShell } from '../components/layout/AppShell';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function SecurityPage() {
  return (
    <AppShell title="Security & Access">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>RBAC Overview</CardTitle>
          <CardDescription>Role-based access designed for Admin, HR, and Employee personas.</CardDescription>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {['Admin: full system control', 'HR: employee and workflow management', 'Employee: self-service attendance and leave'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">{item}</div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Risk Protections</CardTitle>
          <CardDescription>Built-in safeguards for secure AI and operational workflows.</CardDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="success">JWT Auth</Badge>
            <Badge tone="info">Rate limiting ready</Badge>
            <Badge tone="info">Environment secrets only</Badge>
            <Badge tone="warning">Audit logs recommended</Badge>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
