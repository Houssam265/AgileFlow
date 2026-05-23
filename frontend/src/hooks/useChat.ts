import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { IMessage, StompSubscription } from '@stomp/stompjs';
import { useWebSocket } from './useWebSocket';
import { useAuthStore } from '../store/authStore';
import { fetchMessages, fetchPresenceSnapshot } from '../api/chatApi';
import { usePresenceStore } from '../store/presenceStore';
import { ChatMessageDTO, ChannelType } from '../types';

export interface ChatIncomingAlert {
  channelId: string;
  channelName: string;
  senderName: string;
  preview: string;
}

interface ChatStore {
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  incomingAlert: ChatIncomingAlert | null;
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  setIncomingAlert: (alert: ChatIncomingAlert | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  unreadCounts: {},
  totalUnreadCount: 0,
  incomingAlert: null,
  incrementUnread: (channelId) =>
    set((state) => {
      const newCounts = {
        ...state.unreadCounts,
        [channelId]: (state.unreadCounts[channelId] || 0) + 1,
      };
      const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
      return { unreadCounts: newCounts, totalUnreadCount: total };
    }),
  clearUnread: (channelId) =>
    set((state) => {
      const newCounts = { ...state.unreadCounts, [channelId]: 0 };
      const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
      return { unreadCounts: newCounts, totalUnreadCount: total };
    }),
  setIncomingAlert: (alert) => set({ incomingAlert: alert }),
}));

interface UseChatProps {
  channelType?: ChannelType;
  projectId?: number | null;
  recipientId?: number | null;
  isMonitor?: boolean;
  projectNames?: Record<number, string>;
  contactNames?: Record<number, string>;
}

export const useChat = (props: UseChatProps = {}) => {
  const {
    channelType,
    projectId,
    recipientId,
    isMonitor = false,
    projectNames = {},
    contactNames = {},
  } = props;
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { subscribe, publish, connectionState } = useWebSocket();
  const { user } = useAuthStore();
  const {
    incrementUnread,
    clearUnread,
    totalUnreadCount,
    setIncomingAlert,
  } = useChatStore();
  const setPresenceSnapshot = usePresenceStore((s) => s.setPresenceSnapshot);

  const getChannelId = useCallback((msg: ChatMessageDTO) => {
    if (msg.channelType === 'PROJECT') return `project-${msg.projectId}`;
    if (msg.channelType === 'PRIVATE') {
      const otherId = msg.senderId === user?.id ? msg.recipientId : msg.senderId;
      return `private-${otherId}`;
    }
    return 'unknown';
  }, [user?.id]);

  const getChannelName = useCallback((msg: ChatMessageDTO) => {
    if (msg.channelType === 'PROJECT' && msg.projectId) {
      return projectNames[msg.projectId] ?? `Projet #${msg.projectId}`;
    }
    if (msg.channelType === 'PRIVATE') {
      const otherId = msg.senderId === user?.id ? msg.recipientId : msg.senderId;
      if (otherId && contactNames[otherId]) return contactNames[otherId];
      return msg.senderName ?? 'Message direct';
    }
    return 'Chat';
  }, [user?.id, projectNames, contactNames]);

  const currentChannelId =
    channelType === 'PROJECT'
      ? `project-${projectId}`
      : channelType === 'PRIVATE'
        ? `private-${recipientId}`
        : null;

  const loadHistory = useCallback(async (page: number, clear: boolean = false) => {
    if (!channelType) return;
    setIsLoadingHistory(true);
    try {
      const data = await fetchMessages(channelType, projectId, recipientId, page);
      if (clear) {
        setMessages(data.content);
      } else {
        setMessages((prev) => [...data.content, ...prev]);
      }
      setHasMore(data.content.length === 50);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [channelType, projectId, recipientId]);

  const handleIncomingMessage = useCallback((msg: ChatMessageDTO) => {
    const msgChannelId = getChannelId(msg);
    const isFromOther = msg.senderId !== user?.id;
    const isOutsideCurrentView = isMonitor || msgChannelId !== currentChannelId;

    if (isFromOther && isOutsideCurrentView) {
      incrementUnread(msgChannelId);
      setIncomingAlert({
        channelId: msgChannelId,
        channelName: getChannelName(msg),
        senderName: msg.senderName ?? 'Utilisateur',
        preview: msg.content.length > 80 ? `${msg.content.slice(0, 80)}…` : msg.content,
      });
    }

    if (!isMonitor) {
      const isProjectMatch =
        channelType === 'PROJECT' && msg.channelType === 'PROJECT' && msg.projectId === projectId;
      const isPrivateMatch =
        channelType === 'PRIVATE' &&
        msg.channelType === 'PRIVATE' &&
        ((msg.senderId === user?.id && msg.recipientId === recipientId) ||
          (msg.senderId === recipientId && msg.recipientId === user?.id));

      if (isProjectMatch || isPrivateMatch) {
        setMessages((prev) => [...prev, msg]);
      }
    }
  }, [
    channelType,
    projectId,
    recipientId,
    user?.id,
    isMonitor,
    currentChannelId,
    getChannelId,
    getChannelName,
    incrementUnread,
    setIncomingAlert,
  ]);

  useEffect(() => {
    if (connectionState !== 'CONNECTED' || !user) return;

    const subscriptions: StompSubscription[] = [];

    if (isMonitor) {
      const inboxSub = subscribe(`/topic/chat/inbox/${user.id}`, (m: IMessage) =>
        handleIncomingMessage(JSON.parse(m.body))
      );
      if (inboxSub) subscriptions.push(inboxSub);
    } else if (channelType) {
      let topic = '';
      if (channelType === 'PROJECT' && projectId) {
        topic = `/topic/chat/project/${projectId}`;
      } else if (channelType === 'PRIVATE') {
        topic = `/topic/chat/private/${user.id}`;
      }

      if (topic) {
        const mainSub = subscribe(topic, (m: IMessage) => handleIncomingMessage(JSON.parse(m.body)));
        if (mainSub) subscriptions.push(mainSub);
      }

      loadHistory(0, true);
      if (currentChannelId) clearUnread(currentChannelId);
    }

    return () => {
      subscriptions.forEach((s) => s?.unsubscribe());
    };
  }, [
    connectionState,
    channelType,
    projectId,
    recipientId,
    user,
    subscribe,
    loadHistory,
    isMonitor,
    currentChannelId,
    handleIncomingMessage,
    clearUnread,
  ]);

  useEffect(() => {
    if (!user || connectionState !== 'CONNECTED') return;

    const presenceSub = subscribe('/topic/chat/presence', (message: IMessage) => {
      setPresenceSnapshot(JSON.parse(message.body));
    });

    fetchPresenceSnapshot()
      .then(setPresenceSnapshot)
      .catch(console.error);

    return () => {
      if (presenceSub) presenceSub.unsubscribe();
    };
  }, [connectionState, user?.id, subscribe, setPresenceSnapshot]);

  const sendMessage = useCallback(
    (content: string) => {
      if (connectionState !== 'CONNECTED' || !user || !content.trim() || !channelType) return;

      const messagePayload = {
        senderId: user.id,
        channelType,
        projectId: channelType === 'PROJECT' ? projectId : null,
        recipientId: channelType === 'PRIVATE' ? recipientId : null,
        content: content.trim(),
      };

      publish('/chat/send', messagePayload);
    },
    [connectionState, user, channelType, projectId, recipientId, publish]
  );

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isLoadingHistory) {
      loadHistory(currentPage + 1);
    }
  }, [hasMore, isLoadingHistory, currentPage, loadHistory]);

  return {
    messages,
    sendMessage,
    loadMoreMessages,
    isLoadingHistory,
    hasMore,
    totalUnreadCount,
  };
};
