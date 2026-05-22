import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Register } from './Register';

const navigateMock = vi.fn();
const setAuthMock = vi.fn();
const postMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../api/axios', () => ({
  api: {
    post: (...args: unknown[]) => postMock(...args),
  },
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { setAuth: typeof setAuthMock }) => unknown) =>
    selector({ setAuth: setAuthMock }),
}));

describe('Register page', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    setAuthMock.mockReset();
    postMock.mockReset();
  });

  it('registers then logs in and persists auth state', async () => {
    postMock
      .mockResolvedValueOnce({ data: { message: 'Compte cree avec succes' } })
      .mockResolvedValueOnce({
        data: { access: 'client-token', role: 'CLIENT', username: 'fresh_client' },
      });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('USERNAME'), 'fresh_client');
    await user.type(screen.getByPlaceholderText('EMAIL_ADDRESS'), 'fresh@tastify.ma');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon Compte/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenNthCalledWith(1, '/users/register/', {
        username: 'fresh_client',
        email: 'fresh@tastify.ma',
        password: 'password123',
        role: 'CLIENT',
      });
      expect(postMock).toHaveBeenNthCalledWith(2, '/users/login/', {
        username: 'fresh_client',
        password: 'password123',
      });
      expect(setAuthMock).toHaveBeenCalledWith('client-token', 'CLIENT', 'fresh_client');
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('shows backend errors without navigating away', async () => {
    postMock.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Nom d’utilisateur déjà pris.',
        },
      },
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('USERNAME'), 'duplicate');
    await user.type(screen.getByPlaceholderText('EMAIL_ADDRESS'), 'duplicate@tastify.ma');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon Compte/i }));

    await waitFor(() => {
      expect(screen.getByText('Nom d’utilisateur déjà pris.')).toBeInTheDocument();
      expect(setAuthMock).not.toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
