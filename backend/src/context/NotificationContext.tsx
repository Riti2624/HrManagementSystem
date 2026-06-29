import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { api, NotificationItem, SOCKET_BASE } from '../lib/api';
import { useAuth } from './AuthContext';

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function normalizeNotification(notification: NotificationItem): NotificationItem {
  return {
    ...notification,
    id: String(notification.id),
    read: Boolean(notification.read)
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    setIsLoading(true);
    api.getNotifications()
      .then((items) => {
        if (mounted) {
          setNotifications((items as NotificationItem[]).map(normalizeNotification));
        }
      })
      .catch(() => {
        if (mounted) {
          setNotifications([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = io(SOCKET_BASE, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('hrms_token') || '' }
    });

    const handleNotification = (notification: NotificationItem) => {
      const nextNotification = normalizeNotification({
        ...notification,
        id: notification.id || `alert-${Date.now()}`,
        read: false
      });

      setNotifications((current) => {
        if (current.some((item) => item.id === nextNotification.id)) {
          return current;
        }
        return [nextNotification, ...current];
      });
    };

    const invalidateDashboard = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const invalidateNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const invalidateEmployees = () => {
      invalidateDashboard();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    };

    const invalidateAttendance = () => {
      invalidateDashboard();
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    };

    const invalidateLeaves = () => {
      invalidateDashboard();
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    };

    const invalidatePayroll = () => {
      invalidateDashboard();
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    };

    const invalidateRecruitment = () => {
      invalidateDashboard();
      queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    };

    socket.on('hr:alert', handleNotification);
    socket.on('notification:created', handleNotification);
    socket.on('notification:created', invalidateNotifications);
    socket.on('employee:created', invalidateEmployees);
    socket.on('employee:updated', invalidateEmployees);
    socket.on('attendance:updated', invalidateAttendance);
    socket.on('leave:updated', invalidateLeaves);
    socket.on('payroll:updated', invalidatePayroll);
    socket.on('recruitment:updated', invalidateRecruitment);
    socket.on('dashboard:refresh', invalidateDashboard);

    return () => {
      socket.off('hr:alert', handleNotification);
      socket.off('notification:created', handleNotification);
      socket.off('notification:created', invalidateNotifications);
      socket.off('employee:created', invalidateEmployees);
      socket.off('employee:updated', invalidateEmployees);
      socket.off('attendance:updated', invalidateAttendance);
      socket.off('leave:updated', invalidateLeaves);
      socket.off('payroll:updated', invalidatePayroll);
      socket.off('recruitment:updated', invalidateRecruitment);
      socket.off('dashboard:refresh', invalidateDashboard);
      socket.disconnect();
    };
  }, [queryClient, user]);

  const markAsRead = useCallback((id: string) => {
    api.markNotificationRead(id).catch(() => null);
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const markAllAsRead = useCallback(() => {
    api.markAllNotificationsRead().catch(() => null);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, isLoading, markAsRead, markAllAsRead }),
    [isLoading, markAllAsRead, markAsRead, notifications, unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }
  return context;
}
