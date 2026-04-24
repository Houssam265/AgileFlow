import axiosInstance from './axiosInstance';
import type {
  BacklogData,
  CreateUserStoryPayload,
  StoryPriority,
  UpdateUserStoryPayload,
  UserStoryItem,
} from '../types';

export const fetchBacklogByProject = async (projectId: number, priority?: StoryPriority | 'ALL') => {
  const { data } = await axiosInstance.get<BacklogData>(`/backlogs/project/${projectId}`, {
    params: priority && priority !== 'ALL' ? { priority } : {},
  });
  return data;
};

export const createUserStory = async (projectId: number, payload: CreateUserStoryPayload) => {
  const { data } = await axiosInstance.post<UserStoryItem>(`/backlogs/project/${projectId}/stories`, payload);
  return data;
};

export const updateUserStory = async (storyId: number, payload: UpdateUserStoryPayload) => {
  const { data } = await axiosInstance.put<UserStoryItem>(`/user-stories/${storyId}`, payload);
  return data;
};

export const deleteUserStory = async (storyId: number) => {
  await axiosInstance.delete(`/user-stories/${storyId}`);
};

export const assignStoryToSprint = async (storyId: number, sprintId: number) => {
  const { data } = await axiosInstance.post<UserStoryItem>(`/user-stories/${storyId}/assign-sprint/${sprintId}`);
  return data;
};

export const removeStoryFromSprint = async (storyId: number) => {
  const { data } = await axiosInstance.delete<UserStoryItem>(`/user-stories/${storyId}/assign-sprint`);
  return data;
};
