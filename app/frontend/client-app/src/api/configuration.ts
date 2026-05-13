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
  updated_at: string;
}

export const configurationApi = {
  getPublicSettings: () => axiosInstance.get<RestaurantConfiguration>('/settings/public/'),
};
