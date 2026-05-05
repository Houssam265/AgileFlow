import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserManagement from './UserManagement';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const fetchUsers = vi.fn();
const deleteUser = vi.fn();

vi.mock('../../api/usersApi', () => ({
  fetchUsers: (...a: unknown[]) => fetchUsers(...a),
  deleteUser: (...a: unknown[]) => deleteUser(...a),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'admin@agileflow.dev',
      role: 'ROLE_ADMIN',
      firstName: 'Ada',
      lastName: 'Admin',
    },
  }),
}));

describe('UserManagement (admin CRUD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchUsers.mockResolvedValue([
      {
        id: 10,
        email: 'bob@agileflow.dev',
        firstName: 'Bob',
        lastName: 'Dev',
        role: 'ROLE_DEVELOPER',
        createdAt: '2026-04-01T08:00:00',
        active: true,
        lastLogin: null,
      },
    ]);
    deleteUser.mockResolvedValue(undefined);
  });

  it('lists users and opens the create modal for an admin', async () => {
    render(
      <MemoryRouter>
        <UserManagement variant="full" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('bob@agileflow.dev')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /nouvel utilisateur/i }));
    expect(screen.getByRole('heading', { name: /nouvel utilisateur/i })).toBeInTheDocument();
  });

  it('confirms soft-delete for an admin', async () => {
    render(
      <MemoryRouter>
        <UserManagement variant="full" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('bob@agileflow.dev')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Désactiver bob@agileflow.dev' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Désactiver cet utilisateur ?' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^confirmer$/i }));

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith(10);
    });
  });
});
