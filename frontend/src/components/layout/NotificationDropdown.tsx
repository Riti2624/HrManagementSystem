import { CheckCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export function NotificationDropdown() {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Notifications</div>
          <div className="text-xs text-slate-500">{notifications.length} total</div>
        </div>
        <button onClick={markAllAsRead} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Mark all notifications as read">
          <CheckCheck size={16} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">No notifications yet.</div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
            >
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-slate-300' : 'bg-blue-600'}`} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">{notification.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{notification.detail}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
