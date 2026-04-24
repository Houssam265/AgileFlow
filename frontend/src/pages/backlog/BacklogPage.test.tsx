import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BacklogPage from './BacklogPage';

const { fetchBacklogByProject } = vi.hoisted(() => ({
  fetchBacklogByProject: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'manager@agileflow.dev',
      role: 'ROLE_MANAGER',
      firstName: 'Sara',
      lastName: 'Manager',
    },
  }),
}));

vi.mock('../../api/projectsApi', () => ({
  fetchProjects: vi.fn().mockResolvedValue([
    {
      id: 12,
      name: 'Plateforme Agile',
      description: null,
      startDate: '2026-04-01',
      endDate: null,
      status: 'ACTIF',
      managerId: 1,
      managerName: 'Sara Manager',
      sprintCount: 2,
      taskCount: 0,
    },
  ]),
}));

vi.mock('../../api/backlogApi', () => ({
  fetchBacklogByProject,
  createUserStory: vi.fn(),
  updateUserStory: vi.fn(),
  deleteUserStory: vi.fn(),
  assignStoryToSprint: vi.fn(),
  removeStoryFromSprint: vi.fn(),
}));

vi.mock('../../api/sprintsApi', () => ({
  fetchSprintsByProject: vi.fn().mockResolvedValue([
    {
      id: 1,
      nom: 'Sprint 1',
      description: 'Initial',
      dateDebut: '2026-04-24',
      dateFin: '2026-05-08',
      capacitePoints: 20,
      pointsUtilises: 0,
      statut: 'PLANIFIE',
      projetId: 12,
    },
  ]),
}));

describe('BacklogPage', () => {
  it('reloads stories when the priority filter changes', async () => {
    fetchBacklogByProject.mockImplementation((_projectId: number, priority?: string) => Promise.resolve({
      id: 2,
      projectId: 12,
      projectName: 'Plateforme Agile',
      stories: priority === 'HIGH'
        ? [{
            id: 101,
            title: 'Story haute',
            description: 'Backlog prioritaire',
            priority: 'HIGH',
            storyPoints: 5,
            acceptanceCriteria: null,
            backlogId: 2,
            projectId: 12,
            sprintId: null,
            sprintLabel: null,
            createdAt: '2026-04-24T10:00:00',
          }]
        : [{
            id: 100,
            title: 'Story moyenne',
            description: 'Backlog standard',
            priority: 'MEDIUM',
            storyPoints: 3,
            acceptanceCriteria: null,
            backlogId: 2,
            projectId: 12,
            sprintId: null,
            sprintLabel: null,
            createdAt: '2026-04-24T09:00:00',
          }],
    }));

    render(<BacklogPage />);

    await waitFor(() => {
      expect(screen.getByText('Story moyenne')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByLabelText('Priorite'));
    fireEvent.click(await screen.findByRole('option', { name: 'Haute' }));

    await waitFor(() => {
      expect(fetchBacklogByProject).toHaveBeenLastCalledWith(12, 'HIGH');
    });

    expect(screen.getByText('Story haute')).toBeInTheDocument();
  });
});
