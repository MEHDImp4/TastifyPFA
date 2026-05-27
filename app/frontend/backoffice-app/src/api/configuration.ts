import { api as axiosInstance } from './axios';

export interface RestaurantConfiguration {
  id: number;
  nom: string;
  description: string | null;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  logo: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  horaires: Record<string, string>;
  devise: string;
  tax_rate: string;
  gratuity_threshold: number;
  default_gratuity_rate: string;
  primary_color: string;
  prep_target_minutes: number;
  auto_send_main_course: boolean;
  updated_at: string;
}

export const configurationApi = {
  getSettings: () => axiosInstance.get<RestaurantConfiguration>('/settings/'),
  updateSettings: (data: Partial<RestaurantConfiguration>) => {
    // Handle multipart/form-data if logo is being updated
    if ((data.logo as any) instanceof File) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'horaires') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value as any);
          }
        }
      });
      return axiosInstance.patch<RestaurantConfiguration>('/settings/1/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return axiosInstance.patch<RestaurantConfiguration>('/settings/1/', data);
  }
};
