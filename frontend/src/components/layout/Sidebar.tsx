import { motion } from 'framer-motion';
import { BarChart3, Users, Clock3, CalendarRange, Wallet, BriefcaseBusiness, Sparkles, MessageSquareText, ShieldCheck, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navItems = [
  { label: 'Dashboard', to: '/', icon: BarChart3 },
  { label: 'Employees', to: '/employees', icon: Users },
  { label: 'Attendance', to: '/attendance', icon: Clock3 },
  { label: 'Leave', to: '/leave', icon: CalendarRange },
  { label: 'Payroll', to: '/payroll', icon: Wallet },
  { label: 'Recruitment', to: '/recruitment', icon: BriefcaseBusiness },
  { label: 'AI Copilot', to: '/copilot', icon: Sparkles },
  { label: 'Security', to: '/security', icon: ShieldCheck }
];

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: { collapsed: boolean; mobileOpen: boolean; onCloseMobile: () => void }) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-xl transition-transform xl:static xl:z-auto xl:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0',
        collapsed ? 'xl:w-20' : 'xl:w-72'
      )}
    >
      <div className="mb-8 flex items-center justify-between">
        <div className={cn(collapsed && 'xl:hidden')}>
          <div className="text-xs uppercase tracking-[0.35em] text-blue-600">HRMS</div>
          <div className="text-xl font-semibold text-slate-900">Copilot Suite</div>
        </div>
        <div className={cn('hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white', collapsed && 'xl:flex')}>H</div>
        <button onClick={onCloseMobile} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 xl:hidden" aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      <nav className="space-y-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.to} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                    collapsed && 'xl:justify-center xl:px-3',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
                onClick={onCloseMobile}
              >
                <Icon size={18} />
                <span className={cn(collapsed && 'xl:hidden')}>{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div className={cn('mt-auto rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700', collapsed && 'xl:hidden')}>
        <MessageSquareText className="mb-3 text-blue-600" size={22} />
        Ask the HR Copilot for leave advice, attrition risks, or team summaries.
      </div>
    </aside>
  );
}
