import axiosInstance from './axiosInstance';
import type { CreateTeamPayload, TeamDetail, TeamListItem, UpdateTeamPayload } from '../types';

export const fetchTeams = async (q?: string) => {
  const { data } = await axiosInstance.get<TeamListItem[]>('/teams', { params: q ? { q } : {} });
  return data;
};

export const fetchTeamById = async (id: number) => {
  const { data } = await axiosInstance.get<TeamDetail>(`/teams/${id}`);
  return data;
};

export const createTeam = async (payload: CreateTeamPayload) => {
  const { data } = await axiosInstance.post<TeamListItem>('/teams', payload);
  return data;
};

export const updateTeam = async (id: number, payload: UpdateTeamPayload) => {
  const { data } = await axiosInstance.put<TeamListItem>(`/teams/${id}`, payload);
  return data;
};

export const deleteTeam = async (id: number) => {
  await axiosInstance.delete(`/teams/${id}`);
};

export const addTeamMember = async (teamId: number, userId: number) => {
  await axiosInstance.post(`/teams/${teamId}/members/${userId}`);
};

export const removeTeamMember = async (teamId: number, userId: number) => {
  await axiosInstance.delete(`/teams/${teamId}/members/${userId}`);
};
