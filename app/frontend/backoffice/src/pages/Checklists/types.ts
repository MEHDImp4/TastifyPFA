export type ChecklistType = 'OUVERTURE' | 'FERMETURE' | 'HEBDOMADAIRE';
export type ChecklistExecutionStatus = 'EN_COURS' | 'TERMINE';

export interface ChecklistTask {
  id: number;
  description: string;
  ordre: number;
  est_obligatoire: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: number;
  titre: string;
  type: ChecklistType;
  active: boolean;
  tasks: ChecklistTask[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistResponse {
  id: number;
  task: ChecklistTask;
  est_complete: boolean;
  completed_at: string | null;
  completed_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistExecution {
  id: number;
  checklist: number;
  checklist_details: ChecklistTemplate;
  date: string;
  execute_par: number;
  statut: ChecklistExecutionStatus;
  responses: ChecklistResponse[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistTaskFormData {
  description: string;
  ordre: number;
  est_obligatoire: boolean;
}

export interface ChecklistTemplatePayload {
  titre: string;
  type: ChecklistType;
  active: boolean;
  tasks: ChecklistTaskFormData[];
}

export interface ManualExecutionPayload {
  checklist: number;
  date: string;
}
