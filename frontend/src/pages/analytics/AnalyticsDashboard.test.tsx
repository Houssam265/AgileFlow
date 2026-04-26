import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalyticsDashboard from './AnalyticsDashboard';
import { exportAnalyticsPdf, fetchAnalytics } from '../../api/analyticsApi';

vi.mock('../../api/analyticsApi', () => ({
  fetchAnalytics: vi.fn().mockResolvedValue({
    period: 'WEEK',
    startDate: '2026-04-20',
    endDate: '2026-04-26',
    sprintId: null,
    totalActivities: 11,
    completedTasks: 4,
    activeMembers: 2,
    memberStats: [
      { userId: 1, memberName: 'Alice Dev', role: 'ROLE_DEVELOPER', activityCount: 7, completedTasks: 3 },
      { userId: 2, memberName: 'Sara Manager', role: 'ROLE_MANAGER', activityCount: 4, completedTasks: 1 },
    ],
    heatmap: [
      { date: '2026-04-20', activityCount: 2 },
      { date: '2026-04-21', activityCount: 5 },
      { date: '2026-04-22', activityCount: 4 },
    ],
    trend: [
      { date: '2026-04-20', activityCount: 2, completedTasks: 1 },
      { date: '2026-04-21', activityCount: 5, completedTasks: 2 },
      { date: '2026-04-22', activityCount: 4, completedTasks: 1 },
    ],
  }),
  exportAnalyticsPdf: vi.fn().mockResolvedValue(new Blob(['%PDF analytics'], { type: 'application/pdf' })),
}));

vi.mock('../../api/projectsApi', () => ({
  fetchProjects: vi.fn().mockResolvedValue([
    {
      id: 10,
      name: 'AgileFlow',
      description: null,
      startDate: '2026-04-01',
      endDate: null,
      status: 'ACTIF',
      managerId: 2,
      managerName: 'Sara Manager',
      sprintCount: 1,
      taskCount: 3,
    },
  ]),
}));

vi.mock('../../api/sprintsApi', () => ({
  fetchSprintsByProject: vi.fn().mockResolvedValue([
    {
      id: 20,
      nom: 'Sprint Analytics',
      description: null,
      dateDebut: '2026-04-20',
      dateFin: '2026-04-26',
      capacitePoints: 20,
      pointsUtilises: 8,
      statut: 'EN_COURS',
      projetId: 10,
    },
  ]),
}));

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:analytics'),
      writable: true,
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      value: vi.fn(),
      writable: true,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('renders analytics charts and exports the PDF', async () => {
    const user = userEvent.setup();
    render(<AnalyticsDashboard />);

    expect(await screen.findByText('Membres actifs')).toBeInTheDocument();
    expect(screen.getByTestId('activity-heatmap')).toBeInTheDocument();
    expect(screen.getByTestId('member-stats')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /exporter pdf/i }));

    await waitFor(() => {
      expect(exportAnalyticsPdf).toHaveBeenCalledWith({ period: 'WEEK' });
    });
    expect(fetchAnalytics).toHaveBeenCalledWith({ period: 'WEEK' });
  });
});
