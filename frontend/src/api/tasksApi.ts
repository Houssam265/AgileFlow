import axiosInstance from './axiosInstance';
import type { CreateTaskPayload, TaskItem, TaskStatut, UpdateTaskPayload } from '../types';

export const fetchTasksBySprint = async (sprintId: number) => {
  const { data } = await axiosInstance.get<TaskItem[]>(`/tasks?sprintId=${sprintId}`);
  return data;
};

export const fetchTasksByProject = async (projectId: number) => {
  const { data } = await axiosInstance.get<TaskItem[]>(`/tasks?projectId=${projectId}`);
  return data;
};

export const createTask = async (payload: CreateTaskPayload) => {
  const { data } = await axiosInstance.post<TaskItem>('/tasks', payload);
  return data;
};

export const updateTask = async (taskId: number, payload: UpdateTaskPayload) => {
  const { data } = await axiosInstance.put<TaskItem>(`/tasks/${taskId}`, payload);
  return data;
};

export const moveTask = async (taskId: number, statut: TaskStatut) => {
  const { data } = await axiosInstance.put<TaskItem>(`/tasks/${taskId}/move`, { statut });
  return data;
};

export const assignTask = async (taskId: number, assignedToId: number) => {
  const { data } = await axiosInstance.put<TaskItem>(`/tasks/${taskId}/assign`, { assignedToId });
  return data;
};

export const deleteTask = async (taskId: number) => {
  await axiosInstance.delete(`/tasks/${taskId}`);
};
