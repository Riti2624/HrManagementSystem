import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { CardDescription, CardTitle } from './Card';
import { cn } from '../../lib/utils';

type DrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Drawer({ open, title, description, children, footer, onClose, className }: DrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <button className="hidden flex-1 cursor-default bg-transparent md:block" type="button" aria-label="Close drawer" onClick={onClose} />
      <section className={cn('flex h-full w-full flex-col bg-white shadow-2xl md:max-w-xl', className)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <Button size="sm" variant="ghost" type="button" onClick={onClose} aria-label="Close drawer">
            <X size={16} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
      </section>
    </div>
  );
}
