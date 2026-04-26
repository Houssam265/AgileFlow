import { render, screen } from '@testing-library/react';
import ActivityHeatmap from './ActivityHeatmap';

describe('ActivityHeatmap', () => {
  it('renders one CSS-grid cell per activity day', () => {
    render(<ActivityHeatmap items={[
      { date: '2026-04-20', activityCount: 0 },
      { date: '2026-04-21', activityCount: 4 },
      { date: '2026-04-22', activityCount: 10 },
    ]} />);

    expect(screen.getByTestId('activity-heatmap')).toBeInTheDocument();
    expect(screen.getAllByTestId('heatmap-cell')).toHaveLength(3);
    expect(screen.getByTitle(/4 activites/)).toBeInTheDocument();
  });
});
