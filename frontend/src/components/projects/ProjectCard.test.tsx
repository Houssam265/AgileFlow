import { render, screen } from '@testing-library/react';
import ProjectCard from './ProjectCard';

describe('ProjectCard', () => {
  it('renders project details and metrics', () => {
    render(
      <ProjectCard
        project={{
          id: 1,
          name: 'Migration API',
          description: 'Refonte du module projet',
          startDate: '2026-04-01',
          endDate: '2026-05-15',
          status: 'ACTIF',
          managerId: 2,
          managerName: 'Sara Manager',
          sprintCount: 3,
          taskCount: 12,
        }}
      />,
    );

    expect(screen.getByText('Migration API')).toBeInTheDocument();
    expect(screen.getByText('Refonte du module projet')).toBeInTheDocument();
    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByText('Manager: Sara Manager')).toBeInTheDocument();
    expect(screen.getByText('Sprints: 3')).toBeInTheDocument();
    expect(screen.getByText('Taches: 12')).toBeInTheDocument();
  });
});
