import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepInputForm from './StepInputForm';
import type { ProjectListItem } from '../../types';

vi.mock('reactflow', () => ({
  MarkerType: { ArrowClosed: 'arrowclosed' },
}));

const projects: ProjectListItem[] = [
  {
    id: 10,
    name: 'AgileFlow Platform',
    description: null,
    startDate: '2026-04-01',
    endDate: null,
    status: 'ACTIF',
    managerId: 1,
    managerName: 'Sara Manager',
    sprintCount: 1,
    taskCount: 3,
  },
];

describe('StepInputForm', () => {
  it('generates diagram JSON from submitted steps', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<StepInputForm projects={projects} onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox', { name: /Titre/i }), 'Release flow');
    await user.type(screen.getByRole('textbox', { name: /Etape 1/i }), 'Backlog');
    await user.click(screen.getByRole('button', { name: /Ajouter/i }));
    await user.type(screen.getByRole('textbox', { name: /Etape 2/i }), 'Review');
    await user.click(screen.getByLabelText('Partager'));
    await user.click(screen.getByRole('button', { name: /Enregistrer/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      titre: 'Release flow',
      projectId: 10,
      etapes: ['Backlog', 'Review'],
      shared: true,
    });
    expect(onSubmit.mock.calls[0][0].json).toContain('flowchart TD');
  });
});
