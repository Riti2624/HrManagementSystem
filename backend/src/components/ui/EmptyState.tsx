import { ReactNode } from 'react';
import { Card } from './Card';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="flex min-h-[220px] flex-col items-center justify-center text-center">
      <div className="max-w-lg">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </Card>
  );
}
