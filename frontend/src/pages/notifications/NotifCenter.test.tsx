import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotifCenter from './NotifCenter';

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
        id: 2,
        message: 'Sprint demarre',
        lu: false,
        dateCreation: '2026-05-02T12:00:00',
      },
    ],
    unreadCount: 1,
    hasMore: true,
    loading: false,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  }),
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

  it('goes back via the toolbar button', () => {
    render(
      <MemoryRouter>
        <NotifCenter />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /retour/i }));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
