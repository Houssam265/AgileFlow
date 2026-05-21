import { create } from 'zustand';
import {
  addDiagramCollaborator,
  createDiagram as createDiagramApi,
  deleteDiagram as deleteDiagramApi,
  fetchDiagram as fetchDiagramApi,
  fetchDiagramCollaborators,
  fetchDiagramsByProject,
  updateDiagram as updateDiagramApi,
} from '../api/diagramsApi';
import type { CollaboratorInfo, CreateDiagramPayload, DiagramData, UpdateDiagramPayload } from '../types';

interface DiagramStore {
  diagrams: DiagramData[];
  currentDiagram: DiagramData | null;
  collaborators: CollaboratorInfo[];
  isLoading: boolean;
  error: string | null;
  fetchDiagrams: (projectId: number) => Promise<void>;
  fetchDiagram: (id: number) => Promise<void>;
  createDiagram: (data: CreateDiagramPayload) => Promise<DiagramData>;
  updateDiagram: (id: number, data: UpdateDiagramPayload) => Promise<void>;
  deleteDiagram: (id: number) => Promise<void>;
  fetchCollaborators: (id: number) => Promise<void>;
  addCollaborator: (id: number, userId: number, permission: 'EDIT' | 'COMMENT' | 'VIEW') => Promise<void>;
  setCurrentDiagram: (diagram: DiagramData | null) => void;
  setCollaborators: (collaborators: CollaboratorInfo[]) => void;
  updateCollaboratorCursor: (userId: number, x: number, y: number) => void;
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  diagrams: [],
  currentDiagram: null,
  collaborators: [],
  isLoading: false,
  error: null,

  fetchDiagrams: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      set({ diagrams: await fetchDiagramsByProject(projectId) });
    } catch {
      set({ error: 'Impossible de charger les diagrammes.' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDiagram: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set({ currentDiagram: await fetchDiagramApi(id) });
    } catch {
      set({ error: 'Impossible de charger le diagramme.' });
    } finally {
      set({ isLoading: false });
    }
  },

  createDiagram: async (data) => {
    const created = await createDiagramApi(data);
    set({ diagrams: [created, ...get().diagrams], currentDiagram: created });
    return created;
  },

  updateDiagram: async (id, data) => {
    const updated = await updateDiagramApi(id, data);
    set({
      currentDiagram: updated,
      diagrams: get().diagrams.map((diagram) => (diagram.id === id ? updated : diagram)),
    });
  },

  deleteDiagram: async (id) => {
    await deleteDiagramApi(id);
    set({
      diagrams: get().diagrams.filter((diagram) => diagram.id !== id),
      currentDiagram: get().currentDiagram?.id === id ? null : get().currentDiagram,
    });
  },

  fetchCollaborators: async (id) => {
    set({ collaborators: await fetchDiagramCollaborators(id) });
  },

  addCollaborator: async (id, userId, permission) => {
    await addDiagramCollaborator(id, userId, permission);
    set({ collaborators: await fetchDiagramCollaborators(id) });
  },

  setCurrentDiagram: (diagram) => set({ currentDiagram: diagram }),
  setCollaborators: (collaborators) => set({ collaborators }),
  updateCollaboratorCursor: (userId, x, y) => set((state) => ({
    collaborators: state.collaborators.map((user) => (
      user.userId === userId ? { ...user, cursorX: x, cursorY: y, isActive: true, lastSeen: Date.now() } : user
    )),
  })),
}));
