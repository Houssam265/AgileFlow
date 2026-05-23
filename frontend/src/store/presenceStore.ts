import { create } from 'zustand';

export type VisibilityStatus = 'LIVE' | 'ABSENT' | 'BUSY';

export interface UserPresence {
  userId: number;
  status: VisibilityStatus;
  connected: boolean;
}

export type PresenceDisplay = VisibilityStatus | 'OFFLINE';

const VISIBILITY_STORAGE_KEY = 'agileflow_visibility_status';

export const loadSavedVisibility = (): VisibilityStatus => {
  const saved = localStorage.getItem(VISIBILITY_STORAGE_KEY);
  if (saved === 'LIVE' || saved === 'ABSENT' || saved === 'BUSY') {
    return saved;
  }
  return 'LIVE';
};

export const saveVisibility = (status: VisibilityStatus) => {
  localStorage.setItem(VISIBILITY_STORAGE_KEY, status);
};

export const resolvePresenceDisplay = (
  presence: UserPresence | undefined
): PresenceDisplay => {
  if (!presence || !presence.connected) return 'OFFLINE';
  return presence.status;
};

interface PresenceStore {
  presenceByUser: Record<number, UserPresence>;
  myVisibilityStatus: VisibilityStatus;
  setPresenceSnapshot: (list: UserPresence[]) => void;
  setMyVisibilityStatus: (status: VisibilityStatus) => void;
  getPresence: (userId: number) => UserPresence | undefined;
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  presenceByUser: {},
  myVisibilityStatus: loadSavedVisibility(),
  setPresenceSnapshot: (list) =>
    set({
      presenceByUser: Object.fromEntries(list.map((p) => [p.userId, p])),
    }),
  setMyVisibilityStatus: (status) => {
    saveVisibility(status);
    set({ myVisibilityStatus: status });
  },
  getPresence: (userId) => get().presenceByUser[userId],
}));
