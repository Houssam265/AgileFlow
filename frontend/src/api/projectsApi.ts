import axiosInstance from './axiosInstance';
import type { CreateProjectPayload, ProjectListItem, UpdateProjectPayload } from '../types';

export const fetchProjects = async (q?: string) => {
  const { data } = await axiosInstance.get<ProjectListItem[]>('/projects', { params: q ? { q } : {} });
  return data;
};

export const fetchProjectById = async (id: number) => {
  const { data } = await axiosInstance.get<ProjectListItem>(`/projects/${id}`);
  return data;
};

export const createProject = async (payload: CreateProjectPayload) => {
  const { data } = await axiosInstance.post<ProjectListItem>('/projects', payload);
  return data;
};

export const updateProject = async (id: number, payload: UpdateProjectPayload) => {
  const { data } = await axiosInstance.put<ProjectListItem>(`/projects/${id}`, payload);
  return data;
};

export const deleteProject = async (id: number) => {
  await axiosInstance.delete(`/projects/${id}`);
};
