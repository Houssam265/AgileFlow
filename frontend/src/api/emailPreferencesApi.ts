import axiosInstance from './axiosInstance';
import type { EmailNotificationType, EmailPreferences, EmailPreview, UpdateEmailPreferencesPayload } from '../types';

export const fetchMyEmailPreferences = async () => {
  const { data } = await axiosInstance.get<EmailPreferences>('/email-preferences/me');
  return data;
};

export const updateMyEmailPreferences = async (payload: UpdateEmailPreferencesPayload) => {
  const { data } = await axiosInstance.put<EmailPreferences>('/email-preferences/me', payload);
  return data;
};

export const fetchEmailPreview = async (type: EmailNotificationType) => {
  const { data } = await axiosInstance.get<EmailPreview>('/email-preferences/me/preview', { params: { type } });
  return data;
};
