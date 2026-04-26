import { render, screen } from '@testing-library/react';
import MemberStats from './MemberStats';

describe('MemberStats', () => {
  it('renders recharts member bars and trend line labels', () => {
    render(<MemberStats
      memberStats={[
        { userId: 1, memberName: 'Alice Dev', role: 'ROLE_DEVELOPER', activityCount: 7, completedTasks: 3 },
        { userId: 2, memberName: 'Sara Manager', role: 'ROLE_MANAGER', activityCount: 4, completedTasks: 1 },
      ]}
      trend={[
        { date: '2026-04-20', activityCount: 2, completedTasks: 0 },
        { date: '2026-04-21', activityCount: 5, completedTasks: 2 },
      ]}
    />);

    expect(screen.getByTestId('member-stats')).toBeInTheDocument();
    expect(screen.getByText('Statistiques membres')).toBeInTheDocument();
    expect(screen.getByText('Evolution quotidienne')).toBeInTheDocument();
    expect(screen.getByText('Alice Dev')).toBeInTheDocument();
    expect(screen.getAllByText('Activites').length).toBeGreaterThan(0);
  });
});
