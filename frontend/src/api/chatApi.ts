import axiosInstance from './axiosInstance';
import { ChatMessageDTO, ChannelType } from '../types';
import type { UserPresence, VisibilityStatus } from '../store/presenceStore';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const fetchMessages = async (
  channelType: ChannelType,
  projectId?: number | null,
  recipientId?: number | null,
  page: number = 0
) => {
  const params = new URLSearchParams({
    channelType,
    page: page.toString(),
  });
  
  if (projectId) params.append('projectId', projectId.toString());
  if (recipientId) params.append('recipientId', recipientId.toString());

  const { data } = await axiosInstance.get<Page<ChatMessageDTO>>(`/chat/messages?${params.toString()}`);
  return data;
};

export const fetchPresenceSnapshot = async () => {
  const { data } = await axiosInstance.get<UserPresence[]>('/chat/presence');
  return data;
};

export const updateMyVisibility = async (status: VisibilityStatus) => {
  const { data } = await axiosInstance.put<UserPresence>('/chat/presence/me', { status });
  return data;
};

/** @deprecated Utiliser fetchPresenceSnapshot */
export const fetchOnlineUsers = async () => {
  const snapshot = await fetchPresenceSnapshot();
  return snapshot.filter((p) => p.connected && p.status === 'LIVE').map((p) => p.userId);
};
