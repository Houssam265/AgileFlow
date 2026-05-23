import axiosInstance from './axiosInstance';
import type { CreateEpicPayload, EpicItem } from '../types';

export const fetchEpicsByProject = async (projectId: number) => {
  const { data } = await axiosInstance.get<EpicItem[]>(`/epics/project/${projectId}`);
  return data;
};

export const createEpic = async (projectId: number, payload: CreateEpicPayload) => {
  const { data } = await axiosInstance.post<EpicItem>(`/epics/project/${projectId}`, payload);
  return data;
};

export const updateEpic = async (epicId: number, payload: CreateEpicPayload & { sortOrder?: number }) => {
  const { data } = await axiosInstance.put<EpicItem>(`/epics/${epicId}`, payload);
  return data;
};

export const deleteEpic = async (epicId: number) => {
  await axiosInstance.delete(`/epics/${epicId}`);
};
