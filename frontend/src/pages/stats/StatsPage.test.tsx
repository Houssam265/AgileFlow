import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatsPage from './StatsPage';
import { exportStatsCsv, exportStatsPdf, fetchStats } from '../../api/statsApi';

vi.mock('../../api/statsApi', () => ({
  fetchStats: vi.fn().mockResolvedValue({
    projectId: null,
    sprintId: null,
    startDate: '2026-04-20',
    endDate: '2026-04-26',
    totalTasks: 10,
    todoTasks: 2,
    inProgressTasks: 3,
    reviewTasks: 1,
    completedTasks: 4,
    completionRate: 40,
    activeSprints: 1,
    averageVelocity: 8,
    burndown: [
      { date: '2026-04-20', remainingTasks: 10, idealRemainingTasks: 10 },
      { date: '2026-04-21', remainingTasks: 8, idealRemainingTasks: 8 },
    ],
    velocity: [
      { sprintId: 1, sprintName: 'Sprint 1', totalTasks: 10, completedTasks: 4, completedStoryPoints: 8, capacityPoints: 20 },
    ],
  }),
  exportStatsPdf: vi.fn().mockResolvedValue(new Blob(['%PDF stats'], { type: 'application/pdf' })),
  exportStatsCsv: vi.fn().mockResolvedValue(new Blob(['metric,value'], { type: 'text/csv' })),
}));

vi.mock('../../api/projectsApi', () => ({
  fetchProjects: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/sprintsApi', () => ({
  fetchSprintsByProject: vi.fn().mockResolvedValue([]),
}));

describe('StatsPage', () => {
  beforeEach(() => {
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:stats'),
      writable: true,
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      value: vi.fn(),
      writable: true,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('renders stats charts and exports reports', async () => {
    const user = userEvent.setup();
    render(<StatsPage />);

    expect(await screen.findByText('Stats & Rapports')).toBeInTheDocument();
    expect(screen.getByTestId('burndown-chart')).toBeInTheDocument();
    expect(screen.getByTestId('velocity-chart')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /pdf/i }));
    await user.click(screen.getByRole('button', { name: /csv/i }));

    await waitFor(() => {
      expect(exportStatsPdf).toHaveBeenCalledWith({});
      expect(exportStatsCsv).toHaveBeenCalledWith({});
    });
    expect(fetchStats).toHaveBeenCalledWith({});
  });
});
