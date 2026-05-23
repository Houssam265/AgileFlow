import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPage from './AdminPage';

const authStore = vi.hoisted(() => ({
  role: 'ROLE_ADMIN' as 'ROLE_ADMIN' | 'ROLE_DEVELOPER',
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'admin@agileflow.dev',
      role: authStore.role,
      firstName: 'Ada',
      lastName: 'Admin',
    },
  }),
}));

const fetchAdminDashboard = vi.fn();
const fetchActivityLogs = vi.fn();

vi.mock('../../api/adminApi', () => ({
  fetchAdminDashboard: (...a: unknown[]) => fetchAdminDashboard(...a),
  fetchActivityLogs: (...a: unknown[]) => fetchActivityLogs(...a),
}));

vi.mock('../../api/usersApi', () => ({
  fetchUsers: vi.fn().mockResolvedValue([
    { id: 1, email: 'admin@agileflow.dev', firstName: 'Ada', lastName: 'Admin', role: 'ROLE_ADMIN', active: true, createdAt: null, lastLogin: null },
  ]),
  deleteUser: vi.fn(),
}));

vi.mock('../../api/projectsApi', () => ({
  fetchProjects: vi.fn().mockResolvedValue([
    { id: 1, name: 'Core', description: null, startDate: null, endDate: null, status: 'ACTIF', managerId: 1, managerName: 'Ada Admin', sprintCount: 0, taskCount: 0 },
  ]),
}));

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStore.role = 'ROLE_ADMIN';
    fetchAdminDashboard.mockResolvedValue({
      totalUsers: 4,
      activeUsers: 3,
      totalProjects: 2,
      totalTasks: 12,
      totalTeams: 1,
      totalDiagrams: 2,
      totalNotifications: 30,
    });
    fetchActivityLogs.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, size: 5, number: 0, hasNext: false });
  });

  it('loads dashboard metrics for an administrator', async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchAdminDashboard).toHaveBeenCalled();
    });

    expect(screen.getByText('Tableau de bord administrateur')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
  });

  it('does not render the admin dashboard for a developer', async () => {
    authStore.role = 'ROLE_DEVELOPER';

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchAdminDashboard).not.toHaveBeenCalled();
    });

    expect(screen.queryByText('Tableau de bord administrateur')).not.toBeInTheDocument();
  });
});
