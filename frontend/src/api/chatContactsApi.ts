import axiosInstance from './axiosInstance';

export type ChatContactRelationshipStatus =
  | 'NONE'
  | 'CONTACT'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED';

export interface ChatContact {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  invitationId: number;
}

export interface ChatContactInvitation {
  id: number;
  requesterId: number;
  requesterFirstName: string;
  requesterLastName: string;
  requesterEmail: string;
  recipientId: number;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  respondedAt: string | null;
}

export interface ChatUserSearchResult {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  relationshipStatus: ChatContactRelationshipStatus;
}

export const fetchChatContacts = async () => {
  const { data } = await axiosInstance.get<ChatContact[]>('/chat/contacts');
  return data;
};

export const searchChatUsers = async (q: string) => {
  const { data } = await axiosInstance.get<ChatUserSearchResult[]>('/chat/contacts/search', { params: { q } });
  return data;
};

export const fetchPendingReceivedInvitations = async () => {
  const { data } = await axiosInstance.get<ChatContactInvitation[]>('/chat/contacts/invitations/received');
  return data;
};

export const fetchPendingSentInvitations = async () => {
  const { data } = await axiosInstance.get<ChatContactInvitation[]>('/chat/contacts/invitations/sent');
  return data;
};

export const sendChatContactInvitation = async (recipientId: number) => {
  const { data } = await axiosInstance.post<ChatContactInvitation>('/chat/contacts/invitations', { recipientId });
  return data;
};

export const acceptChatContactInvitation = async (invitationId: number) => {
  const { data } = await axiosInstance.post<ChatContactInvitation>(`/chat/contacts/invitations/${invitationId}/accept`);
  return data;
};

export const rejectChatContactInvitation = async (invitationId: number) => {
  const { data } = await axiosInstance.post<ChatContactInvitation>(`/chat/contacts/invitations/${invitationId}/reject`);
  return data;
};
