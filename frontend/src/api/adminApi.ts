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

export type ActivityLog = {
  id: number;
  actorId: number;
  actorName: string;
  actorEmail: string;
  actorRole: string | null;
  action: string;
  message: string | null;
  projectId: number | null;
  projectName: string | null;
  sprintId: number | null;
  sprintName: string | null;
  taskId: number | null;
  taskTitle: string | null;
  activityDate: string;
  createdAt: string;
};

export type ActivityLogsPage = {
  content: ActivityLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  hasNext: boolean;
};

export type ActivityLogFilters = {
  q?: string;
  projectId?: number | '';
  actorId?: number | '';
  action?: string;
  startDate?: string;
  endDate?: string;
};

export type AnnouncementTargetType = 'ALL_USERS' | 'PROJECT_MEMBERS' | 'SPECIFIC_USER';

export type SendAnnouncementPayload = {
  targetType: AnnouncementTargetType;
  projectId?: number | null;
  userId?: number | null;
  message: string;
};

export const fetchAdminDashboard = async () => {
  const { data } = await axiosInstance.get<AdminDashboard>('/admin/dashboard');
  return data;
};

export const fetchActivityLogs = async (page = 0, size = 20, filters: ActivityLogFilters = {}) => {
  const params = Object.fromEntries(
    Object.entries({ page, size, ...filters }).filter(([, value]) => value !== '' && value != null),
  );
  const { data } = await axiosInstance.get<ActivityLogsPage>('/admin/activity-logs', {
    params,
  });
  return data;
};

export const sendAnnouncement = async (payload: SendAnnouncementPayload) => {
  const { data } = await axiosInstance.post<{ sentCount: number }>('/admin/announcements', payload);
  return data;
};
