import axiosInstance from './axiosInstance';
import { ChatMessageDTO, ChannelType } from '../types';

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

export const fetchOnlineUsers = async () => {
  const { data } = await axiosInstance.get<number[]>('/chat/presence');
  return data;
};
