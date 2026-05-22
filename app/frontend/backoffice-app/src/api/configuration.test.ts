import { describe, expect, it, vi } from 'vitest';

import { configurationApi } from './configuration';
import { api as axiosInstance } from './axios';
import type { RestaurantConfiguration } from './configuration';

vi.mock('./axios', () => ({
  api: {
    patch: vi.fn(),
  },
}));

describe('configurationApi.updateSettings', () => {
  it('uses JSON payloads when no file is present', async () => {
    const patchMock = vi.mocked(axiosInstance.patch);
    patchMock.mockResolvedValue({ data: {} });

    await configurationApi.updateSettings({ nom: 'Tastify HQ' });

    expect(patchMock).toHaveBeenCalledWith('/settings/1/', { nom: 'Tastify HQ' });
  });

  it('switches to multipart payloads when a logo file is present', async () => {
    const patchMock = vi.mocked(axiosInstance.patch);
    patchMock.mockResolvedValue({ data: {} });
    const logo = new File(['binary'], 'logo.png', { type: 'image/png' });
    const payload = {
      nom: 'Tastify HQ',
      horaires: { lun: '09:00-22:00' },
      logo: logo as unknown as RestaurantConfiguration['logo'],
    };

    await configurationApi.updateSettings(payload);

    const [, submittedPayload, options] = patchMock.mock.calls.at(-1) ?? [];

    expect(submittedPayload).toBeInstanceOf(FormData);
    const formData = submittedPayload as FormData;
    expect(formData.get('nom')).toBe('Tastify HQ');
    expect(formData.get('horaires')).toBe(JSON.stringify({ lun: '09:00-22:00' }));
    expect(formData.get('logo')).toBe(logo);
    expect(options).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });
});
