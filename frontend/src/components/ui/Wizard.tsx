import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { CardDescription, CardTitle } from './Card';
import { cn } from '../../lib/utils';

type WizardStep = {
  title: string;
  description?: string;
};

type WizardProps = {
  open: boolean;
  title: string;
  description?: string;
  steps: WizardStep[];
  currentStep: number;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
};

export function Wizard({ open, title, description, steps, currentStep, children, footer, onClose }: WizardProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <section className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <Button size="sm" variant="ghost" type="button" onClick={onClose} aria-label="Close wizard">
            <X size={16} />
          </Button>
        </div>
        <div className="grid min-h-0 flex-1 md:grid-cols-[220px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50 p-4 md:border-b-0 md:border-r">
            <div className="grid gap-2">
              {steps.map((step, index) => (
                <div key={step.title} className={cn('rounded-xl px-3 py-2', index === currentStep ? 'bg-white shadow-sm' : 'bg-transparent')}>
                  <div className={cn('text-sm font-medium', index === currentStep ? 'text-blue-700' : 'text-slate-600')}>{index + 1}. {step.title}</div>
                  {step.description ? <div className="mt-1 text-xs text-slate-400">{step.description}</div> : null}
                </div>
              ))}
            </div>
          </aside>
          <div className="min-h-0 overflow-y-auto p-5">{children}</div>
        </div>
        <div className="border-t border-slate-200 px-5 py-4">{footer}</div>
      </section>
    </div>
  );
}
