import { render, screen } from '@testing-library/react';
import VelocityChart from './VelocityChart';

describe('VelocityChart', () => {
  it('renders velocity chart labels', () => {
    render(<VelocityChart points={[
      {
        sprintId: 1,
        sprintName: 'Sprint 1',
        totalTasks: 10,
        completedTasks: 5,
        completedStoryPoints: 13,
        capacityPoints: 20,
      },
    ]} />);

    expect(screen.getByTestId('velocity-chart')).toBeInTheDocument();
    expect(screen.getByText('Velocity')).toBeInTheDocument();
    expect(screen.getByText('Sprint 1')).toBeInTheDocument();
    expect(screen.getByText('Points livres')).toBeInTheDocument();
  });
});
