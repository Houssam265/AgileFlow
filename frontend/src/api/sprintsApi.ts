import axiosInstance from './axiosInstance';

export interface SprintItem {
  id: number;
  nom: string;
  description: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  capacitePoints: number | null;
  pointsUtilises: number | null;
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE';
  projetId: number;
}

export interface SprintPayload {
  nom: string;
  description?: string | null;
  dateDebut: string;
  dateFin?: string | null;
  capacitePoints?: number | null;
  projetId: number;
}

export const fetchSprintsByProject = async (projectId: number) => {
  const { data } = await axiosInstance.get<SprintItem[]>(`/sprints/projet/${projectId}`);
  return data;
};

export const createSprint = async (payload: SprintPayload) => {
  const { data } = await axiosInstance.post<SprintItem>('/sprints', payload);
  return data;
};

export const updateSprint = async (id: number, payload: SprintPayload) => {
  const { data } = await axiosInstance.put<SprintItem>(`/sprints/${id}`, payload);
  return data;
};

export const deleteSprint = async (id: number) => {
  await axiosInstance.delete(`/sprints/${id}`);
};

export const startSprint = async (id: number) => {
  const { data } = await axiosInstance.post<SprintItem>(`/sprints/${id}/demarrer`);
  return data;
};

export const finishSprint = async (id: number) => {
  const { data } = await axiosInstance.post<SprintItem>(`/sprints/${id}/terminer`);
  return data;
};

export const addStoryToSprint = async (sprintId: number, storyId: number) => {
  await axiosInstance.post(`/sprints/${sprintId}/stories/${storyId}`);
};

export const removeStoryFromSprint = async (sprintId: number, storyId: number) => {
  await axiosInstance.delete(`/sprints/${sprintId}/stories/${storyId}`);
};
