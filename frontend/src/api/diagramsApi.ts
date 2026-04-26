import axiosInstance from './axiosInstance';
import type { CreateDiagramPayload, DiagramData, UpdateDiagramPayload } from '../types';

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

export const createDiagram = async (payload: CreateDiagramPayload) => {
  const { data } = await axiosInstance.post<DiagramData>('/diagrams', payload);
  return data;
};

export const updateDiagram = async (id: number, payload: UpdateDiagramPayload) => {
  const { data } = await axiosInstance.put<DiagramData>(`/diagrams/${id}`, payload);
  return data;
};

export const deleteDiagram = async (id: number) => {
  await axiosInstance.delete(`/diagrams/${id}`);
};
