import axiosInstance from './axiosInstance';

export interface NotificationDTO {
  id: number;
  message: string;
  lu: boolean;
  dateCreation: string;
}

export interface NotificationsPage {
  content: NotificationDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  hasNext: boolean;
}

export const fetchNotifications = async (page: number): Promise<NotificationsPage> => {
  const { data } = await axiosInstance.get<NotificationsPage>('/notifications', {
    params: { page }
  });
  return data;
};

export const markAsRead = async (id: number): Promise<NotificationDTO> => {
  const { data } = await axiosInstance.put<NotificationDTO>(`/notifications/${id}/read`);
  return data;
};

export const markAllAsRead = async (): Promise<void> => {
  await axiosInstance.put('/notifications/read-all');
};

export const deleteNotification = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/notifications/${id}`);
};
