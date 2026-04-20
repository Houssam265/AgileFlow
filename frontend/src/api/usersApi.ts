import axiosInstance from './axiosInstance';
import type { CreateUserPayload, UpdateUserPayload, UserDetail, UserListItem } from '../types';

export const fetchUsers = async (q?: string) => {
  const { data } = await axiosInstance.get<UserListItem[]>('/users', { params: q ? { q } : {} });
  return data;
};

export const fetchUserById = async (id: number) => {
  const { data } = await axiosInstance.get<UserDetail>(`/users/${id}`);
  return data;
};

export const createUser = async (payload: CreateUserPayload) => {
  const { data } = await axiosInstance.post<UserListItem>('/users', payload);
  return data;
};

export const updateUser = async (id: number, payload: UpdateUserPayload) => {
  const { data } = await axiosInstance.put<UserListItem>(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id: number) => {
  await axiosInstance.delete(`/users/${id}`);
};
