import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotifCenter from './NotifCenter';

const markAllAsRead = vi.fn();
const loadMore = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 2,
      email: 'dev@agileflow.dev',
      role: 'ROLE_DEVELOPER',
      firstName: 'Dev',
      lastName: 'User',
    },
  }),
}));

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: 2,
        message: 'Sprint demarre',
        lu: false,
        dateCreation: '2026-05-02T12:00:00',
      },
    ],
    unreadCount: 1,
    hasMore: true,
    loading: false,
    markAsRead: vi.fn(),
    markAllAsRead,
    deleteNotification: vi.fn(),
    loadMore,
  }),
}));

vi.mock('../../api/adminApi', () => ({
  sendAnnouncement: vi.fn(),
}));

vi.mock('../../api/projectsApi', () => ({
  fetchProjects: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/usersApi', () => ({
  fetchUsers: vi.fn().mockResolvedValue([]),
}));

describe('NotifCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the list and marks all notifications as read', async () => {
    render(
      <MemoryRouter>
        <NotifCenter />
      </MemoryRouter>,
    );

    expect(screen.getByText('Centre de notifications')).toBeInTheDocument();
    expect(screen.getByText('Sprint demarre')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /tout marquer comme lu/i }));
    expect(markAllAsRead).toHaveBeenCalled();
  });

  it('loads more when requested', async () => {
    render(
      <MemoryRouter>
        <NotifCenter />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /charger plus/i }));
    expect(loadMore).toHaveBeenCalled();
  });
});
