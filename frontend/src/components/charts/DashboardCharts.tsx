import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardDescription, CardTitle } from '../ui/Card';

const COLORS = ['#2563eb', '#0f766e', '#e11d48', '#16a34a', '#d97706'];

export function DashboardCharts({ workload }: { workload: Array<{ department: string; workload: number }> }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="min-h-[360px]">
        <CardTitle>Department Workload</CardTitle>
        <CardDescription>Departments carrying the most pressure this week.</CardDescription>
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workload}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
              <XAxis dataKey="department" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="workload" radius={[10, 10, 0, 0]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6">
        <Card className="min-h-[172px]">
          <CardTitle>Attendance Trend</CardTitle>
          <CardDescription>Weekly attendance behavior and day-over-day movement.</CardDescription>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { day: 'Mon', rate: 89 },
                { day: 'Tue', rate: 92 },
                { day: 'Wed', rate: 88 },
                { day: 'Thu', rate: 94 },
                { day: 'Fri', rate: 90 }
              ]}>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="min-h-[172px]">
          <CardTitle>Recruitment Pipeline</CardTitle>
          <CardDescription>Current stage distribution across candidates.</CardDescription>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: 'Shortlisted', value: 1 },
                  { name: 'Interview', value: 1 },
                  { name: 'New', value: 1 },
                  { name: 'Rejected', value: 1 }
                ]} dataKey="value" nameKey="name" outerRadius={70} innerRadius={38} paddingAngle={4}>
                  {COLORS.map((color) => <Cell key={color} fill={color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
