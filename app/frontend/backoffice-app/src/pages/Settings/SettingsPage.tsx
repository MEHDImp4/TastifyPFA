import React, { useState, useEffect } from 'react';
import { configurationApi } from '../../api/configuration';
import type { RestaurantConfiguration } from '../../api/configuration';
import {
  Building2,
  Save,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<RestaurantConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await configurationApi.getSettings();
      setConfig(res.data);
    } catch (err) {
      console.error(err);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await configurationApi.updateSettings(config);
      toast.success('Paramètres enregistrés');
    } catch (err) {
      toast.error('Enregistrement impossible');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex flex-wrap justify-between items-center px-4 md:px-8 py-3 md:py-0 min-h-20 border-b border-outline bg-surface gap-3">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-4">
          <button onClick={fetchSettings} className="btn-ghost h-10 px-4">
            <RotateCcw className="w-3.5 h-3.5" /> <span>Réinitialiser</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !config}
            aria-label="Enregistrer les paramètres"
            className="btn-primary h-10 px-6"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> <span>Enregistrer</span></>}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        {!config ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm font-bold text-error uppercase tracking-widest">Service indisponible.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="atelier-card p-6 md:p-10 space-y-10">
              <div className="flex items-center gap-3 border-b border-outline pb-4">
                <Building2 className="w-5 h-5 text-on-surface-variant opacity-40" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-background">Identité Visuelle & Légale</h3>
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-nom" className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Nom de l'enseigne
                </label>
                <input
                  id="settings-nom"
                  aria-label="Nom de l'enseigne"
                  value={config.nom ?? ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, nom: e.target.value } : null)}
                  className="field-control uppercase"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-description" className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Description
                </label>
                <textarea
                  id="settings-description"
                  aria-label="Description"
                  value={config.description ?? ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                  className="field-control min-h-28 py-3 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-telephone" className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Téléphone
                </label>
                <input
                  id="settings-telephone"
                  aria-label="Téléphone"
                  value={config.telephone ?? ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, telephone: e.target.value } : null)}
                  className="field-control"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
