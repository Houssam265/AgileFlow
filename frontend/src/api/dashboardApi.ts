import axiosInstance from './axiosInstance';
import type { DashboardStats } from '../types';

export const fetchDashboardStats = async () => {
  const { data } = await axiosInstance.get<DashboardStats>('/dashboard/stats');
  return data;
};
