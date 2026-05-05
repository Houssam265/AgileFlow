import axiosInstance from './axiosInstance';

export type AdminDashboard = {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalTasks: number;
  totalTeams: number;
  totalDiagrams: number;
  totalNotifications: number;
};

export const fetchAdminDashboard = async () => {
  const { data } = await axiosInstance.get<AdminDashboard>('/admin/dashboard');
  return data;
};
