import { render, screen } from '@testing-library/react';
import BurndownChart from './BurndownChart';

describe('BurndownChart', () => {
  it('renders burndown chart labels', () => {
    render(<BurndownChart points={[
      { date: '2026-04-20', remainingTasks: 8, idealRemainingTasks: 10 },
      { date: '2026-04-21', remainingTasks: 6, idealRemainingTasks: 8 },
    ]} />);

    expect(screen.getByTestId('burndown-chart')).toBeInTheDocument();
    expect(screen.getByText('Burndown')).toBeInTheDocument();
    expect(screen.getByText('Restant')).toBeInTheDocument();
    expect(screen.getByText('Ideal')).toBeInTheDocument();
  });
});
