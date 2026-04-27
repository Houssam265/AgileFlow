import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationPreferences from './NotificationPreferences';

const fetchMyEmailPreferences = vi.fn();
const fetchEmailPreview = vi.fn();
const updateMyEmailPreferences = vi.fn();

vi.mock('../../api/emailPreferencesApi', () => ({
  fetchMyEmailPreferences: (...args: unknown[]) => fetchMyEmailPreferences(...args),
  fetchEmailPreview: (...args: unknown[]) => fetchEmailPreview(...args),
  updateMyEmailPreferences: (...args: unknown[]) => updateMyEmailPreferences(...args),
}));

describe('NotificationPreferences', () => {
  it('loads preferences and updates a toggle', async () => {
    fetchMyEmailPreferences.mockResolvedValue({
      userId: 1,
      sprintStartEnabled: true,
      taskAssignedEnabled: false,
      deadlineEnabled: true,
      mentionEnabled: true,
    });
    fetchEmailPreview.mockResolvedValue({
      type: 'SPRINT_START',
      subject: 'Sprint demarre: Sprint 5',
      html: '<p>Preview sprint</p>',
    });
    updateMyEmailPreferences.mockResolvedValue({
      userId: 1,
      sprintStartEnabled: true,
      taskAssignedEnabled: true,
      deadlineEnabled: true,
      mentionEnabled: true,
    });

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Tache assignee' }));

    await waitFor(() => {
      expect(updateMyEmailPreferences).toHaveBeenCalledWith({ taskAssignedEnabled: true });
    });

    expect(screen.getByTestId('email-preview-card')).toBeInTheDocument();
    expect(screen.getByText('Sprint demarre: Sprint 5')).toBeInTheDocument();
  });
});
