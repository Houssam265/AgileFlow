import { useEffect, useState, useCallback } from 'react';
import type { IMessage } from '@stomp/stompjs';
import { useWebSocket } from './useWebSocket';
import { useAuthStore } from '../store/authStore';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  NotificationDTO
} from '../api/notificationsApi';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(state => state.user);
  const { subscribe, connectionState } = useWebSocket();

  // Load initial notifications
  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchNotifications(0);
      setNotifications(page.content);
      setCurrentPage(0);
      setTotalPages(page.totalPages);
      setUnreadCount(page.content.filter(n => !n.lu).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more (next page)
  const loadMore = useCallback(async () => {
    if (currentPage >= totalPages - 1) return;
    setLoading(true);
    try {
      const page = await fetchNotifications(currentPage + 1);
      setNotifications(prev => [...prev, ...page.content]);
      setCurrentPage(page.number);
      setTotalPages(page.totalPages);
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, totalPages]);

  // Mark single notification as read
  const markOneAsRead = useCallback(async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lu: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsReadLocal = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteOne = useCallback(async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== id);
        const wasUnread = prev.find(n => n.id === id)?.lu === false;
        if (wasUnread) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return filtered;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  // Subscribe to WebSocket notifications
  useEffect(() => {
    if (!user?.id || connectionState !== 'CONNECTED') return;

    const subscription = subscribe(
      `/topic/notifications/${user.id}`,
      (message: IMessage) => {
        let newNotification: NotificationDTO;
        try {
          newNotification = JSON.parse(message.body) as NotificationDTO;
        } catch (error) {
          console.error('Failed to parse notification message:', error);
          return;
        }

        setNotifications(prev => [newNotification, ...prev]);
        if (!newNotification.lu) {
          setUnreadCount(prev => prev + 1);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user?.id, subscribe, connectionState]);

  // Load initial data on mount
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const hasMore = currentPage < totalPages - 1;

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead: markOneAsRead,
    markAllAsRead: markAllAsReadLocal,
    deleteNotification: deleteOne,
    loadMore
  };
};
