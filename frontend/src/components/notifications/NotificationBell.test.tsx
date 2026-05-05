import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const markAsRead = vi.fn();
const markAllAsRead = vi.fn();
const deleteNotification = vi.fn();
const loadMore = vi.fn();

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: 1,
        message: 'Tache assignee: API login',
        lu: false,
        dateCreation: '2026-05-01T10:00:00',
      },
    ],
    unreadCount: 1,
    hasMore: false,
    loading: false,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  }),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the popover and navigates to the notification center', async () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /ouvrir les notifications/i }));

    await waitFor(() => {
      expect(screen.getByText('Tache assignee: API login')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /voir tout/i }));

    expect(navigateMock).toHaveBeenCalledWith('/notifications');
  });

  it('marks all as read when the shortcut button is used', async () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /ouvrir les notifications/i }));
    await waitFor(() => expect(screen.getByText('Tache assignee: API login')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^tout lu$/i }));

    expect(markAllAsRead).toHaveBeenCalled();
  });
});
