import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CopilotWidget } from '../copilot/CopilotWidget';

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen((value) => !value)} onSidebarToggle={() => setSidebarCollapsed((value) => !value)} title={title} />
          <main className="relative flex-1 px-4 py-5 md:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
      <CopilotWidget />
      {mobileOpen ? <div className="fixed inset-0 z-40 bg-slate-900/40 xl:hidden" onClick={() => setMobileOpen(false)} /> : null}
    </div>
  );
}
