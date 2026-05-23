import type { EpicStatus } from '../types';

export const EPIC_STATUS_ORDER: EpicStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const EPIC_STATUS_CONFIG: Record<EpicStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' }> = {
  TODO: { label: 'A faire', color: 'default' },
  IN_PROGRESS: { label: 'En cours', color: 'info' },
  REVIEW: { label: 'En revue', color: 'warning' },
  DONE: { label: 'Termine', color: 'success' },
};

export const SPRINT_STATUS_LABEL: Record<string, string> = {
  PLANIFIE: 'Planifie',
  ACTIF: 'Actif',
  EN_COURS: 'En cours',
  FERME: 'Ferme',
};

export const SPRINT_STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PLANIFIE: 'default',
  ACTIF: 'success',
  EN_COURS: 'success',
  FERME: 'warning',
};
