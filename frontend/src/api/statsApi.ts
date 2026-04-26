import axiosInstance from './axiosInstance';
import type { StatsData } from '../types';

export interface StatsParams {
  projectId?: number;
  sprintId?: number;
}

const toQuery = (params: StatsParams) => ({
  ...(params.projectId ? { projectId: params.projectId } : {}),
  ...(params.sprintId ? { sprintId: params.sprintId } : {}),
});

export const fetchStats = async (params: StatsParams = {}) => {
  const { data } = await axiosInstance.get<StatsData>('/stats', {
    params: toQuery(params),
  });
  return data;
};

export const exportStatsPdf = async (params: StatsParams = {}) => {
  const { data } = await axiosInstance.get<Blob>('/stats/export.pdf', {
    params: toQuery(params),
    responseType: 'blob',
  });
  return data;
};

export const exportStatsCsv = async (params: StatsParams = {}) => {
  const { data } = await axiosInstance.get<Blob>('/stats/export.csv', {
    params: toQuery(params),
    responseType: 'blob',
  });
  return data;
};
