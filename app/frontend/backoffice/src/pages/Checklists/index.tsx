import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { useAuthStore } from '@shared/auth/useAuthStore';
import checklistService from './checklistService';
import {
  ChecklistExecution,
  ChecklistExecutionStatus,
  ChecklistResponse,
  ChecklistTaskFormData,
  ChecklistTemplate,
  ChecklistTemplatePayload,
  ChecklistType,
} from './types';

const CHECKLIST_TYPE_OPTIONS: Array<{ value: ChecklistType; label: string }> = [
  { value: 'OUVERTURE', label: 'Ouverture' },
  { value: 'FERMETURE', label: 'Fermeture' },
  { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
];

const emptyTemplateForm = (): ChecklistTemplatePayload => ({
  titre: '',
  type: 'OUVERTURE',
  active: true,
  tasks: [{ description: '', ordre: 1, est_obligatoire: true }],
});

const todayDateValue = () => new Date().toISOString().slice(0, 10);

const getStatusLabel = (statut: ChecklistExecutionStatus) =>
  statut === 'TERMINE' ? 'Terminé' : 'En cours';

const getTypeLabel = (value: ChecklistType) =>
  CHECKLIST_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

const computeExecutionStatus = (responses: ChecklistResponse[]): ChecklistExecutionStatus =>
  responses.some((response) => response.task.est_obligatoire && !response.est_complete) ? 'EN_COURS' : 'TERMINE';

const getCompletionRatio = (responses: ChecklistResponse[]) => {
  if (responses.length === 0) {
    return 0;
  }

  const completedCount = responses.filter((response) => response.est_complete).length;
  return Math.round((completedCount / responses.length) * 100);
};

const cloneTasks = (tasks: ChecklistTemplate['tasks']): ChecklistTaskFormData[] =>
  tasks.map((task, index) => ({
    description: task.description,
    ordre: index + 1,
    est_obligatoire: task.est_obligatoire,
  }));

export default function ChecklistsPage() {
  const { user } = useAuthStore();
  const isGerant = user?.role === 'GERANT';
  const [selectedDate, setSelectedDate] = useState(todayDateValue);
  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [creatingExecution, setCreatingExecution] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateForm, setTemplateForm] = useState<ChecklistTemplatePayload>(emptyTemplateForm);
  const [manualExecutionTemplateId, setManualExecutionTemplateId] = useState<number | ''>('');
  const [manualExecutionDate, setManualExecutionDate] = useState(todayDateValue);
  const [pageError, setPageError] = useState<string | null>(null);
  const [managerNotice, setManagerNotice] = useState<string | null>(null);
  const [pendingResponseIds, setPendingResponseIds] = useState<number[]>([]);

  const fetchExecutions = async (date: string, withSpinner = true) => {
    if (withSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setPageError(null);
    try {
      const data = await checklistService.getExecutions(date);
      setExecutions(data);
    } catch (error) {
      console.error('Failed to fetch checklist executions', error);
      setPageError("Impossible de charger les checklists du jour.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTemplates = async () => {
    if (!isGerant) {
      return;
    }

    try {
      const data = await checklistService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch checklist templates', error);
      setManagerNotice("Impossible de charger les modèles de checklist.");
    }
  };

  useEffect(() => {
    void fetchExecutions(selectedDate, true);
  }, [selectedDate]);

  useEffect(() => {
    if (isGerant) {
      void fetchTemplates();
    }
  }, [isGerant]);

  const totalResponses = executions.reduce((sum, execution) => sum + execution.responses.length, 0);
  const completedResponses = executions.reduce(
    (sum, execution) => sum + execution.responses.filter((response) => response.est_complete).length,
    0,
  );
  const completedExecutions = executions.filter((execution) => execution.statut === 'TERMINE').length;
  const overallProgress = totalResponses === 0 ? 0 : Math.round((completedResponses / totalResponses) * 100);

  const openCreateTemplate = () => {
    setSelectedTemplateId(null);
    setTemplateForm(emptyTemplateForm());
    setManagerNotice(null);
  };

  const openEditTemplate = (template: ChecklistTemplate) => {
    setSelectedTemplateId(template.id);
    setTemplateForm({
      titre: template.titre,
      type: template.type,
      active: template.active,
      tasks: cloneTasks(template.tasks),
    });
    setManagerNotice(null);
  };

  const updateTaskRow = (index: number, patch: Partial<ChecklistTaskFormData>) => {
    setTemplateForm((current) => ({
      ...current,
      tasks: current.tasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, ...patch, ordre: taskIndex + 1 } : task,
      ),
    }));
  };

  const addTaskRow = () => {
    setTemplateForm((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          description: '',
          ordre: current.tasks.length + 1,
          est_obligatoire: true,
        },
      ],
    }));
  };

  const removeTaskRow = (index: number) => {
    setTemplateForm((current) => {
      const nextTasks = current.tasks
        .filter((_, taskIndex) => taskIndex !== index)
        .map((task, taskIndex) => ({ ...task, ordre: taskIndex + 1 }));

      return {
        ...current,
        tasks: nextTasks.length > 0 ? nextTasks : [{ description: '', ordre: 1, est_obligatoire: true }],
      };
    });
  };

  const handleTemplateSubmit = async () => {
    const normalizedPayload: ChecklistTemplatePayload = {
      ...templateForm,
      titre: templateForm.titre.trim(),
      tasks: templateForm.tasks
        .map((task, index) => ({
          description: task.description.trim(),
          ordre: index + 1,
          est_obligatoire: task.est_obligatoire,
        }))
        .filter((task) => task.description.length > 0),
    };

    if (!normalizedPayload.titre || normalizedPayload.tasks.length === 0) {
      setManagerNotice("Renseignez un titre et au moins une tâche.");
      return;
    }

    setSavingTemplate(true);
    setManagerNotice(null);
    try {
      if (selectedTemplateId) {
        await checklistService.updateTemplate(selectedTemplateId, normalizedPayload);
        setManagerNotice('Modèle mis à jour.');
      } else {
        await checklistService.createTemplate(normalizedPayload);
        setManagerNotice('Modèle créé.');
      }
      await fetchTemplates();
      openCreateTemplate();
    } catch (error) {
      console.error('Failed to save checklist template', error);
      setManagerNotice("Impossible d'enregistrer le modèle.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleManualExecutionSubmit = async () => {
    if (!manualExecutionTemplateId) {
      setManagerNotice("Sélectionnez un modèle avant de créer une exécution.");
      return;
    }

    setCreatingExecution(true);
    setManagerNotice(null);
    try {
      await checklistService.createManualExecution({
        checklist: manualExecutionTemplateId,
        date: manualExecutionDate,
      });
      setManagerNotice('Exécution créée.');
      await fetchExecutions(selectedDate, true);
    } catch (error) {
      console.error('Failed to create manual checklist execution', error);
      setManagerNotice("Impossible de créer l'exécution.");
    } finally {
      setCreatingExecution(false);
    }
  };

  const handleToggleResponse = async (executionId: number, responseId: number, nextValue: boolean) => {
    const previousExecutions = executions;

    setPendingResponseIds((current) => [...current, responseId]);
    setExecutions((current) =>
      current.map((execution) => {
        if (execution.id !== executionId) {
          return execution;
        }

        const nextResponses = execution.responses.map((response) =>
          response.id === responseId
            ? {
                ...response,
                est_complete: nextValue,
                completed_at: nextValue ? new Date().toISOString() : null,
                completed_by: nextValue ? execution.execute_par : null,
              }
            : response,
        );

        return {
          ...execution,
          responses: nextResponses,
          statut: computeExecutionStatus(nextResponses),
        };
      }),
    );

    try {
      const updatedResponse = await checklistService.updateResponse(responseId, nextValue);
      setExecutions((current) =>
        current.map((execution) => {
          if (execution.id !== executionId) {
            return execution;
          }

          const nextResponses = execution.responses.map((response) =>
            response.id === responseId ? { ...response, ...updatedResponse } : response,
          );

          return {
            ...execution,
            responses: nextResponses,
            statut: computeExecutionStatus(nextResponses),
          };
        }),
      );
    } catch (error) {
      console.error('Failed to update checklist response', error);
      setExecutions(previousExecutions);
      setPageError("La mise à jour d'une tâche a échoué.");
    } finally {
      setPendingResponseIds((current) => current.filter((id) => id !== responseId));
    }
  };

  return (
    <div className="space-y-8 animate-enter">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-teal">
            <ClipboardList className="h-3.5 w-3.5" />
            Routine quotidienne
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">Checklists staff</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
            Suivez les routines d'ouverture, de fermeture et les contrôles hebdomadaires depuis une seule console.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/5 bg-surface px-4 text-sm text-white">
            <CalendarDays className="h-4 w-4 text-teal" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="bg-transparent text-sm text-white outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => void fetchExecutions(selectedDate, false)}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-5 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          {isGerant && (
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(true);
                openCreateTemplate();
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal px-5 text-sm font-black text-surface transition-colors hover:bg-teal/90 active:scale-[0.97]"
            >
              <Settings2 className="h-4 w-4" />
              Gérer les modèles
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: 'Exécutions du jour',
            value: executions.length,
            hint: `${completedExecutions} terminées`,
            tone: 'text-teal',
          },
          {
            label: 'Tâches validées',
            value: `${completedResponses}/${totalResponses}`,
            hint: 'Sur tous les points visibles',
            tone: 'text-white',
          },
          {
            label: 'Progression globale',
            value: `${overallProgress}%`,
            hint: 'Obligatoires et optionnelles',
            tone: 'text-amber',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/5 bg-surface p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-foreground-muted">{stat.label}</p>
            <p className={`mt-3 text-3xl font-black ${stat.tone}`}>{stat.value}</p>
            <p className="mt-2 text-xs font-medium text-foreground-muted">{stat.hint}</p>
          </div>
        ))}
      </section>

      {pageError && (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          {pageError}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-white/5 bg-surface">
          <Loader2 className="h-10 w-10 animate-spin text-teal" />
        </div>
      ) : executions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-surface px-6 py-14 text-center">
          <p className="text-lg font-bold text-white">Aucune checklist pour cette date.</p>
          <p className="mt-2 text-sm text-foreground-muted">
            La génération quotidienne ne remonte rien ici, ou bien une exécution manuelle reste à créer.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {executions.map((execution) => {
            const completionRatio = getCompletionRatio(execution.responses);
            const completedCount = execution.responses.filter((response) => response.est_complete).length;

            return (
              <article
                key={execution.id}
                className="overflow-hidden rounded-3xl border border-white/5 bg-surface shadow-[0_22px_80px_rgba(0,0,0,0.16)]"
              >
                <div className="border-b border-white/5 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-foreground-muted">
                          {getTypeLabel(execution.checklist_details.type)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                            execution.statut === 'TERMINE'
                              ? 'border-teal/20 bg-teal/10 text-teal'
                              : 'border-amber/20 bg-amber/10 text-amber'
                          }`}
                        >
                          {getStatusLabel(execution.statut)}
                        </span>
                      </div>
                      <h2 className="mt-3 text-2xl font-bold text-white">{execution.checklist_details.titre}</h2>
                      <p className="mt-1 text-sm text-foreground-muted">
                        {completedCount} tâche(s) validée(s) sur {execution.responses.length}
                      </p>
                    </div>

                    <div className="min-w-[220px] rounded-2xl border border-white/5 bg-white/5 px-4 py-4">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-foreground-muted">
                        <span>Progression</span>
                        <span>{completionRatio}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-background">
                        <div
                          className="h-2 rounded-full bg-teal transition-[width] duration-200 ease-out"
                          style={{ width: `${completionRatio}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {execution.responses.map((response) => {
                    const pending = pendingResponseIds.includes(response.id);

                    return (
                      <div
                        key={response.id}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                      >
                        <div className="min-w-0">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              aria-label={response.est_complete ? 'Marquer incomplète' : 'Marquer complète'}
                              aria-pressed={response.est_complete}
                              onClick={() => void handleToggleResponse(execution.id, response.id, !response.est_complete)}
                              disabled={pending}
                              className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all active:scale-[0.97] disabled:cursor-not-allowed ${
                                response.est_complete
                                  ? 'border-teal/20 bg-teal/10 text-teal'
                                  : 'border-white/10 bg-white/5 text-foreground-muted hover:text-white'
                              }`}
                            >
                              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                            </button>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white">{response.task.description}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-foreground-muted">
                                <span>Ordre {response.task.ordre}</span>
                                <span>•</span>
                                <span>{response.task.est_obligatoire ? 'Obligatoire' : 'Optionnelle'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:min-w-[200px] sm:justify-end">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                              response.est_complete
                                ? 'border-teal/20 bg-teal/10 text-teal'
                                : 'border-white/10 bg-white/5 text-foreground-muted'
                            }`}
                          >
                            {response.est_complete ? 'Validée' : 'À faire'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isGerant && (
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <div className="flex h-full flex-col bg-surface">
            <div className="border-b border-white/5 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-teal">Pilotage</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Modèles & création manuelle</h2>
                </div>
                <button
                  type="button"
                  onClick={openCreateTemplate}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau
                </button>
              </div>
              {managerNotice && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                  {managerNotice}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground-muted">Modèles</h3>
                  <span className="text-xs text-foreground-muted">{templates.length} disponibles</span>
                </div>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => openEditTemplate(template)}
                      className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-4 text-left transition-colors hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">{template.titre}</p>
                          <p className="mt-1 text-xs text-foreground-muted">
                            {getTypeLabel(template.type)} • {template.tasks.length} tâche(s)
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                            template.active ? 'bg-teal/10 text-teal' : 'bg-white/10 text-foreground-muted'
                          }`}
                        >
                          {template.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground-muted">
                      {selectedTemplateId ? 'Modifier un modèle' : 'Créer un modèle'}
                    </h3>
                    <p className="mt-1 text-xs text-foreground-muted">
                      Les tâches envoyées remplacent la version précédente côté backend.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={templateForm.titre}
                    onChange={(event) => setTemplateForm((current) => ({ ...current, titre: event.target.value }))}
                    placeholder="Titre de la checklist"
                    className="h-12 w-full rounded-2xl border border-white/5 bg-background px-4 text-sm text-white outline-none transition-colors focus:border-teal"
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select
                      value={templateForm.type}
                      onChange={(event) =>
                        setTemplateForm((current) => ({ ...current, type: event.target.value as ChecklistType }))
                      }
                      className="h-12 rounded-2xl border border-white/5 bg-background px-4 text-sm text-white outline-none transition-colors focus:border-teal"
                    >
                      {CHECKLIST_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label className="flex h-12 items-center justify-between rounded-2xl border border-white/5 bg-background px-4 text-sm text-white">
                      <span>Modèle actif</span>
                      <input
                        type="checkbox"
                        checked={templateForm.active}
                        onChange={(event) =>
                          setTemplateForm((current) => ({ ...current, active: event.target.checked }))
                        }
                        className="h-4 w-4 accent-teal"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  {templateForm.tasks.map((task, index) => (
                    <div key={`${index}-${task.ordre}`} className="rounded-2xl border border-white/5 bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground-muted">
                          Tâche {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeTaskRow(index)}
                          className="text-xs font-bold text-error transition-colors hover:text-error/80"
                        >
                          Supprimer
                        </button>
                      </div>
                      <textarea
                        value={task.description}
                        onChange={(event) => updateTaskRow(index, { description: event.target.value })}
                        rows={3}
                        placeholder="Description de la tâche"
                        className="mt-3 w-full rounded-2xl border border-white/5 bg-surface px-4 py-3 text-sm text-white outline-none transition-colors focus:border-teal"
                      />
                      <label className="mt-3 flex items-center justify-between rounded-2xl border border-white/5 bg-surface px-4 py-3 text-sm text-white">
                        <span>Obligatoire</span>
                        <input
                          type="checkbox"
                          checked={task.est_obligatoire}
                          onChange={(event) => updateTaskRow(index, { est_obligatoire: event.target.checked })}
                          className="h-4 w-4 accent-teal"
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={addTaskRow}
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une tâche
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleTemplateSubmit()}
                    disabled={savingTemplate}
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal px-5 text-sm font-black text-surface transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
                    Enregistrer
                  </button>
                </div>
              </section>

              <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground-muted">
                    Créer une exécution manuelle
                  </h3>
                  <p className="mt-1 text-xs text-foreground-muted">
                    À utiliser uniquement quand la génération automatique ne couvre pas le besoin.
                  </p>
                </div>

                <select
                  value={manualExecutionTemplateId}
                  onChange={(event) =>
                    setManualExecutionTemplateId(event.target.value ? Number(event.target.value) : '')
                  }
                  className="h-12 w-full rounded-2xl border border-white/5 bg-background px-4 text-sm text-white outline-none transition-colors focus:border-teal"
                >
                  <option value="">Sélectionner un modèle</option>
                  {templates
                    .filter((template) => template.active)
                    .map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.titre}
                      </option>
                    ))}
                </select>

                <input
                  type="date"
                  value={manualExecutionDate}
                  onChange={(event) => setManualExecutionDate(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/5 bg-background px-4 text-sm text-white outline-none transition-colors focus:border-teal"
                />

                <button
                  type="button"
                  onClick={() => void handleManualExecutionSubmit()}
                  disabled={creatingExecution}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-amber/20 bg-amber/10 px-4 text-sm font-black text-amber transition-colors hover:bg-amber/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingExecution ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Créer l'exécution
                </button>
              </section>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
