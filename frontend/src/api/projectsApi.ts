import axiosInstance from './axiosInstance';
import type {
  CreateProjectPayload,
  InviteProjectMemberResult,
  ProjectInvitation,
  ProjectInvitationPreview,
  ProjectListItem,
  ProjectMember,
  UpdateProjectPayload,
} from '../types';

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

export const fetchProjectMembers = async (projectId: number) => {
  const { data } = await axiosInstance.get<ProjectMember[]>(`/projects/${projectId}/members`);
  return data;
};

export const inviteProjectMember = async (projectId: number, payload: { userId?: number; email?: string }) => {
  const { data } = await axiosInstance.post<InviteProjectMemberResult>(`/projects/${projectId}/members/invite`, payload);
  return data;
};

export const removeProjectMember = async (projectId: number, userId: number) => {
  await axiosInstance.delete(`/projects/${projectId}/members/${userId}`);
};

export const previewProjectInvitation = async (token: string) => {
  const { data } = await axiosInstance.get<ProjectInvitationPreview>('/projects/invitations/preview', { params: { token } });
  return data;
};

export const fetchReceivedProjectInvitations = async () => {
  const { data } = await axiosInstance.get<ProjectInvitation[]>('/projects/invitations/received');
  return data;
};

export const fetchPendingProjectInvitations = async (projectId: number) => {
  const { data } = await axiosInstance.get<ProjectInvitation[]>(`/projects/${projectId}/invitations/pending`);
  return data;
};

export const acceptProjectInvitation = async (token: string) => {
  const { data } = await axiosInstance.post<ProjectMember>('/projects/invitations/accept', { token });
  return data;
};

export const acceptProjectInvitationById = async (invitationId: number) => {
  const { data } = await axiosInstance.post<ProjectMember>(`/projects/invitations/${invitationId}/accept`);
  return data;
};

export const rejectProjectInvitation = async (invitationId: number) => {
  await axiosInstance.post(`/projects/invitations/${invitationId}/reject`);
};

export const rejectProjectInvitationByToken = async (token: string) => {
  await axiosInstance.post('/projects/invitations/reject', { token });
};
