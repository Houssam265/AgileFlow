import { fireEvent, render, screen } from '@testing-library/react';
import CreateStoryModal from './CreateStoryModal';

describe('CreateStoryModal', () => {
  it('submits the story payload', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateStoryModal
        open
        saving={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Story backlog' } });
    fireEvent.change(screen.getByLabelText('Story points'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Creer' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Story backlog',
      priority: 'MEDIUM',
      storyPoints: 8,
    }));
  });
});
