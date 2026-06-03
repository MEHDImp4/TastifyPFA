import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SettingsPage } from './SettingsPage';
import { configurationApi } from '../../api/configuration';
import type { RestaurantConfiguration } from '../../api/configuration';
import { toast } from 'sonner';

vi.mock('../../api/configuration', () => ({
  configurationApi: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SettingsPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(configurationApi.getSettings).mockReturnValue(new Promise(() => {}));
    render(<SettingsPage />);
    expect(screen.queryByText('Console Système')).toBeNull();
  });

  it('renders settings fields and saves successfully', async () => {
    const mockConfig: RestaurantConfiguration = {
      id: 1,
      nom: 'Tastify Restaurant',
      description: 'Gourmet experience',
      telephone: '0522446688',
      adresse: 'Casablanca',
      email: 'contact@tastify.com',
      logo: null,
      facebook: null,
      instagram: null,
      twitter: null,
      horaires: {},
      devise: 'MAD',
      tax_rate: '20.00',
      gratuity_threshold: 0,
      default_gratuity_rate: '0.00',
      primary_color: '#ff5722',
      prep_target_minutes: 15,
      auto_send_main_course: false,
      updated_at: '2026-06-03T12:00:00Z',
    };

    vi.mocked(configurationApi.getSettings).mockResolvedValue({
      data: mockConfig,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    vi.mocked(configurationApi.updateSettings).mockResolvedValue({
      data: mockConfig,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Console Système')).toBeDefined();
    });

    const nomInput = screen.getByLabelText('Trading Name') as HTMLInputElement;
    const descInput = screen.getByLabelText('Restaurant Description') as HTMLTextAreaElement;
    const phoneInput = screen.getByLabelText('Primary Contact') as HTMLInputElement;

    expect(nomInput.value).toBe('Tastify Restaurant');
    expect(descInput.value).toBe('Gourmet experience');
    expect(phoneInput.value).toBe('0522446688');

    // Make an edit
    fireEvent.change(nomInput, { target: { value: 'New Tastify' } });
    expect(nomInput.value).toBe('New Tastify');

    // Click Deploy Changes
    const deployButton = screen.getByRole('button', { name: 'Deploy Changes' });
    fireEvent.click(deployButton);

    await waitFor(() => {
      expect(configurationApi.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ nom: 'New Tastify' })
      );
    });

    expect(toast.success).toHaveBeenCalledWith('System parameters deployed');
  });

  it('renders critical fallback state when fetch fails', async () => {
    vi.mocked(configurationApi.getSettings).mockRejectedValue(new Error('Fetch error'));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('CRITICAL: UNAVAILABLE.')).toBeDefined();
    });
  });
});
