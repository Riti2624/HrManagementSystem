import { Bell, Search, LogOut, Menu } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';
import { api } from '../../lib/api';

export function Topbar({ onMenuClick, onSidebarToggle, title }: { onMenuClick: () => void; onSidebarToggle: () => void; title: string }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ label: string; sublabel: string; route?: string }>>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const query = search.trim();
      if (!query) {
        setSearchResults([]);
        setSearchOpen(false);
        return;
      }

      api.search(query)
        .then((result) => {
          const flattened = [
            ...result.employees.slice(0, 3).map((item: any) => ({ label: item.name || 'Employee', sublabel: `${item.role || ''} ${item.department ? `· ${item.department}` : ''}`, route: '/employees' })),
            ...result.leaves.slice(0, 2).map((item: any) => ({ label: item.leaveCode || item.employeeId || 'Leave', sublabel: `${item.status || ''} ${item.type ? `· ${item.type}` : ''}`, route: '/leave' })),
            ...result.payrolls.slice(0, 2).map((item: any) => ({ label: item.payrollCode || item.employeeId || 'Payroll', sublabel: item.month || '', route: '/payroll' })),
            ...result.recruitment.jobs.slice(0, 2).map((item: any) => ({ label: item.title || 'Job', sublabel: item.department || '', route: '/recruitment' }))
          ];
          setSearchResults(flattened.slice(0, 7));
          setSearchOpen(true);
          setActiveIndex(flattened.length ? 0 : -1);
        })
        .catch(() => {
          setSearchResults([]);
          setSearchOpen(true);
        });
    }, 220);

    return () => clearTimeout(timeout);
  }, [search]);

  const activeItem = useMemo(() => searchResults[activeIndex] || null, [activeIndex, searchResults]);

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!searchResults.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, searchResults.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && activeItem?.route) {
      event.preventDefault();
      navigate(activeItem.route);
      setSearch('');
      setSearchOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 xl:hidden" aria-label="Open sidebar">
            <Menu size={18} />
          </button>
          <button onClick={onSidebarToggle} className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700 xl:inline-flex" aria-label="Collapse sidebar">
            <Menu size={18} />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-600">HR Management System</p>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 lg:justify-end">
          <div ref={searchRef} className="relative hidden min-w-[280px] max-w-lg flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={() => search && setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Global search employees, leave, payroll..."
                className="pl-10"
              />
            </div>
            {searchOpen ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">No results found.</div>
                ) : (
                  searchResults.map((item, index) => (
                    <button
                      key={`${item.label}-${index}`}
                      onClick={() => {
                        if (item.route) {
                          navigate(item.route);
                        }
                        setSearch('');
                        setSearchOpen(false);
                      }}
                      className={`flex w-full flex-col items-start border-b border-slate-100 px-4 py-3 text-left last:border-b-0 ${index === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <span className="text-sm font-medium text-slate-900">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.sublabel}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="relative rounded-xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:bg-slate-50"
              aria-label="Open notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>
            {isNotificationsOpen ? <NotificationDropdown /> : null}
          </div>
          <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">{user?.name?.slice(0, 1) || 'H'}</div>
            <div>
              <div className="font-medium text-slate-900">{user?.name || 'HR Admin'}</div>
              <div className="text-xs text-slate-500">{user?.role || 'Admin'}</div>
            </div>
            <button onClick={logout} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
