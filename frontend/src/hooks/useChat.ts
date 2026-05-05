import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { IMessage, StompSubscription } from '@stomp/stompjs';
import { useWebSocket } from './useWebSocket';
import { useAuthStore } from '../store/authStore';
import { fetchMessages, fetchOnlineUsers } from '../api/chatApi';
import { ChatMessageDTO, ChannelType } from '../types';

interface ChatStore {
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  onlineUsers: number[];
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  setOnlineUsers: (users: number[]) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  unreadCounts: {},
  totalUnreadCount: 0,
  onlineUsers: [],
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
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));

interface UseChatProps {
  channelType?: ChannelType;
  projectId?: number | null;
  recipientId?: number | null;
  isMonitor?: boolean;
}

export const useChat = (props: UseChatProps = {}) => {
  const { channelType, projectId, recipientId, isMonitor = false } = props;
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const { subscribe, publish, connectionState } = useWebSocket();
  const { user } = useAuthStore();
  const { incrementUnread, clearUnread, totalUnreadCount, onlineUsers, setOnlineUsers } = useChatStore();

  const getChannelId = useCallback((msg: ChatMessageDTO) => {
    if (msg.channelType === 'GLOBAL') return 'global';
    if (msg.channelType === 'PROJECT') return `project-${msg.projectId}`;
    if (msg.channelType === 'PRIVATE') {
      const otherId = msg.senderId === user?.id ? msg.recipientId : msg.senderId;
      return `private-${otherId}`;
    }
    return 'unknown';
  }, [user?.id]);

  const currentChannelId = channelType === 'GLOBAL' ? 'global' : 
                          channelType === 'PROJECT' ? `project-${projectId}` :
                          channelType === 'PRIVATE' ? `private-${recipientId}` : null;

  // Load initial history
  const loadHistory = useCallback(async (page: number, clear: boolean = false) => {
    if (!channelType) return;
    setIsLoadingHistory(true);
    try {
      const data = await fetchMessages(channelType, projectId, recipientId, page);
      if (clear) {
        setMessages(data.content);
      } else {
        // Prepend old messages for pagination
        setMessages((prev) => [...data.content, ...prev]);
      }
      // Set hasMore based on content length (50 is the page size in backend)
      setHasMore(data.content.length === 50);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [channelType, projectId, recipientId]);

  // Handle subscription management
  useEffect(() => {
    if (connectionState !== 'CONNECTED' || !user) return;

    const subscriptions: StompSubscription[] = [];

    const handleNewMessage = (msg: ChatMessageDTO) => {
      const msgChannelId = getChannelId(msg);
      
      // If we are monitoring or if this message is for a channel we aren't currently viewing
      // AND the message was NOT sent by the current user
      if (msg.senderId !== user.id && (isMonitor || msgChannelId !== currentChannelId)) {
        incrementUnread(msgChannelId);
      }

      // If this message belongs to the current view, add it to messages list
      if (!isMonitor) {
        const isGlobalMatch = channelType === 'GLOBAL' && msg.channelType === 'GLOBAL';
        const isProjectMatch = channelType === 'PROJECT' && msg.channelType === 'PROJECT' && msg.projectId === projectId;
        const isPrivateMatch = channelType === 'PRIVATE' && msg.channelType === 'PRIVATE' && 
          ((msg.senderId === user.id && msg.recipientId === recipientId) || 
           (msg.senderId === recipientId && msg.recipientId === user.id));

        if (isGlobalMatch || isProjectMatch || isPrivateMatch) {
          setMessages((prev) => [...prev, msg]);
        }
      }
    };

    if (isMonitor) {
      // Monitor mode: subscribe to global and private topics to track ALL unread
      const globalSub = subscribe('/topic/chat/global', (m: IMessage) => handleNewMessage(JSON.parse(m.body)));
      const privateSub = subscribe(`/topic/chat/private/${user.id}`, (m: IMessage) => handleNewMessage(JSON.parse(m.body)));
      if (globalSub) subscriptions.push(globalSub);
      if (privateSub) subscriptions.push(privateSub);
    } else if (channelType) {
      // Normal mode: subscribe to specific channel
      let topic = '/topic/chat/global';
      if (channelType === 'PROJECT' && projectId) {
        topic = `/topic/chat/project/${projectId}`;
      } else if (channelType === 'PRIVATE') {
        topic = `/topic/chat/private/${user.id}`;
      }

      const mainSub = subscribe(topic, (m: IMessage) => handleNewMessage(JSON.parse(m.body)));
      if (mainSub) subscriptions.push(mainSub);
      
      // Load history when channel changes
      loadHistory(0, true);
      // Clear unread for this channel
      if (currentChannelId) clearUnread(currentChannelId);
    }

    return () => {
      subscriptions.forEach(s => s?.unsubscribe());
    };
  }, [connectionState, channelType, projectId, recipientId, user, subscribe, loadHistory, isMonitor, currentChannelId, getChannelId, incrementUnread, clearUnread]);

  // Presence management
  useEffect(() => {
    if (!user || connectionState !== 'CONNECTED') return;

    // Send online status
    publish('/chat/presence', { userId: user.id, isOnline: true });

    // Subscribe to presence updates
    const presenceSub = subscribe('/topic/chat/presence', (message: IMessage) => {
      const onlineIds: number[] = JSON.parse(message.body);
      setOnlineUsers(onlineIds);
    });

    // Fetch initial online users
    fetchOnlineUsers().then((ids) => {
      setOnlineUsers(ids);
    }).catch(console.error);

    return () => {
      if (user && connectionState === 'CONNECTED') {
        publish('/chat/presence', { userId: user.id, isOnline: false });
      }
      if (presenceSub) presenceSub.unsubscribe();
    };
  }, [connectionState, user?.id, subscribe, publish, setOnlineUsers]);

  const sendMessage = useCallback((content: string) => {
    if (connectionState !== 'CONNECTED' || !user || !content.trim()) return;

    const messagePayload = {
      senderId: user.id,
      channelType,
      projectId: channelType === 'PROJECT' ? projectId : null,
      recipientId: channelType === 'PRIVATE' ? recipientId : null,
      content: content.trim(),
    };

    publish('/chat/send', messagePayload);
  }, [connectionState, user, channelType, projectId, recipientId, publish]);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isLoadingHistory) {
      loadHistory(currentPage + 1);
    }
  }, [hasMore, isLoadingHistory, currentPage, loadHistory]);

  return {
    messages,
    onlineUsers,
    sendMessage,
    loadMoreMessages,
    isLoadingHistory,
    hasMore,
    totalUnreadCount,
  };
};
