import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../context/AuthContext', () => ({
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

vi.mock('../api/dashboardApi', () => ({
  fetchDashboardStats: vi.fn().mockResolvedValue({
    role: 'ROLE_MANAGER',
    totalUsers: 0,
    activeUsers: 0,
    totalTeams: 1,
    managedTeams: 1,
    totalProjects: 2,
    managedProjects: 2,
    activeProjects: 1,
    activeSprints: 1,
    totalTasks: 7,
    todoTasks: 2,
    inProgressTasks: 3,
    doneTasks: 2,
  }),
}));

vi.mock('../api/projectsApi', () => ({
  fetchProjects: vi.fn().mockResolvedValue([
    {
      id: 10,
      name: 'Portail Web',
      description: 'Livraison sprint 2',
      startDate: '2026-04-01',
      endDate: '2026-05-30',
      status: 'ACTIF',
      managerId: 1,
      managerName: 'Sara Manager',
      sprintCount: 2,
      taskCount: 7,
    },
  ]),
}));

describe('DashboardPage', () => {
  it('renders dashboard stats and recent projects', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Indicateurs')).toBeInTheDocument();
    });

    expect(screen.getByText('Projets recents')).toBeInTheDocument();
    expect(screen.getByText('Portail Web')).toBeInTheDocument();
    expect(screen.getByText('Livraison sprint 2')).toBeInTheDocument();
    expect(screen.getByText('Projets actifs')).toBeInTheDocument();
  });
});
