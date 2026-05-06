import axiosInstance from '@shared/auth/axiosInstance';
import { Employe, EmployeFormData } from './types';

const hrService = {
  getEmployees: async () => {
    const response = await axiosInstance.get<Employe[]>('/employes/');
    return response.data;
  },

  createEmployee: async (data: EmployeFormData) => {
    const response = await axiosInstance.post<Employe>('/employes/', data);
    return response.data;
  },

  updateEmployee: async (id: number, data: Partial<EmployeFormData>) => {
    const response = await axiosInstance.patch<Employe>(`/employes/${id}/`, data);
    return response.data;
  },

  deleteEmployee: async (id: number) => {
    await axiosInstance.delete(`/employes/${id}/`);
  }
};

export default hrService;
