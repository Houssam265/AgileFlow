import axiosInstance from './axiosInstance';
import type { CollaboratorInfo, CreateDiagramPayload, DiagramData, UpdateDiagramPayload } from '../types';

export const fetchDiagrams = async (projectId?: number) => {
  const { data } = await axiosInstance.get<DiagramData[]>('/diagrams', {
    params: projectId ? { projectId } : {},
  });
  return data;
};

export const fetchDiagram = async (id: number) => {
  const { data } = await axiosInstance.get<DiagramData>(`/diagrams/${id}`);
  return data;
};

export const fetchDiagramsByProject = async (projectId: number) => {
  const { data } = await axiosInstance.get<DiagramData[]>(`/diagrams/project/${projectId}`);
  return data;
};

export const fetchDiagramsByTask = async (taskId: number) => {
  const { data } = await axiosInstance.get<DiagramData[]>(`/diagrams/task/${taskId}`);
  return data;
};

export const createDiagram = async (payload: CreateDiagramPayload) => {
  const { data } = await axiosInstance.post<DiagramData>('/diagrams', payload);
  return data;
};

export const updateDiagram = async (id: number, payload: UpdateDiagramPayload) => {
  const { data } = await axiosInstance.put<DiagramData>(`/diagrams/${id}`, payload);
  return data;
};

export const updateDiagramContent = async (id: number, payload: UpdateDiagramPayload) => {
  const { data } = await axiosInstance.put<DiagramData>(`/diagrams/${id}/content`, payload);
  return data;
};

export const deleteDiagram = async (id: number) => {
  await axiosInstance.delete(`/diagrams/${id}`);
};

export const fetchDiagramCollaborators = async (id: number) => {
  const { data } = await axiosInstance.get<CollaboratorInfo[]>(`/diagrams/${id}/collaborators`);
  return data;
};

export const addDiagramCollaborator = async (id: number, userId: number, permission: 'EDIT' | 'COMMENT' | 'VIEW') => {
  await axiosInstance.post(`/diagrams/${id}/collaborators`, { userId, permission });
};

export const removeDiagramCollaborator = async (id: number, userId: number) => {
  await axiosInstance.delete(`/diagrams/${id}/collaborators/${userId}`);
};
