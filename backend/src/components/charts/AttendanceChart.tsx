import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardDescription, CardTitle } from '../ui/Card';

export function AttendanceChart({ data }: { data: Array<{ day: string; rate: number }> }) {
  return (
    <Card className="min-h-[320px]">
      <CardTitle>Attendance Trends</CardTitle>
      <CardDescription>Spot lateness patterns before they impact productivity.</CardDescription>
      <div className="mt-4 h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
            <Tooltip />
            <Area type="monotone" dataKey="rate" stroke="#2563eb" fill="#dbeafe" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
