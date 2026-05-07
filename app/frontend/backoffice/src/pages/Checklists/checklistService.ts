import axiosInstance from '@shared/auth/axiosInstance';
import {
  ChecklistExecution,
  ChecklistResponse,
  ChecklistTemplate,
  ChecklistTemplatePayload,
  ManualExecutionPayload,
} from './types';

const checklistService = {
  getExecutions: async (date: string) => {
    const response = await axiosInstance.get<ChecklistExecution[]>('/checklists/executions/', {
      params: { date },
    });
    return response.data;
  },

  getTemplates: async () => {
    const response = await axiosInstance.get<ChecklistTemplate[]>('/checklists/');
    return response.data;
  },

  createTemplate: async (payload: ChecklistTemplatePayload) => {
    const response = await axiosInstance.post<ChecklistTemplate>('/checklists/', payload);
    return response.data;
  },

  updateTemplate: async (id: number, payload: ChecklistTemplatePayload) => {
    const response = await axiosInstance.patch<ChecklistTemplate>(`/checklists/${id}/`, payload);
    return response.data;
  },

  createManualExecution: async (payload: ManualExecutionPayload) => {
    const response = await axiosInstance.post<ChecklistExecution>('/checklists/executions/', payload);
    return response.data;
  },

  updateResponse: async (id: number, est_complete: boolean) => {
    const response = await axiosInstance.patch<ChecklistResponse>(`/checklists/responses/${id}/`, {
      est_complete,
    });
    return response.data;
  },
};

export default checklistService;
