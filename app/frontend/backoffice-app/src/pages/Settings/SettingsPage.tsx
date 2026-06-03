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
      toast.success('System parameters deployed');
    } catch (err) {
      toast.error('Deployment failure');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex justify-between items-center px-8 h-20 border-b border-outline bg-surface">
        <div>
          <h1 aria-label="System Settings" className="text-sm font-bold tracking-widest text-on-background uppercase">Console Système</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Configuration globale de l'établissement</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchSettings} className="btn-ghost h-10 px-4">
            <RotateCcw className="w-3.5 h-3.5" /> <span>Réinitialiser</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !config}
            aria-label="Deploy Changes"
            className="btn-primary h-10 px-6"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> <span>Deploy Changes</span></>}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {!config ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm font-bold text-error uppercase tracking-widest">CRITICAL: UNAVAILABLE.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="atelier-card p-10 space-y-10">
              <div className="flex items-center gap-3 border-b border-outline pb-4">
                <Building2 className="w-5 h-5 text-on-surface-variant opacity-40" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-background">Identité Visuelle & Légale</h3>
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-nom" className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Nom de l'enseigne <span className="sr-only">Trading Name</span>
                </label>
                <input
                  id="settings-nom"
                  aria-label="Trading Name"
                  value={config.nom ?? ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, nom: e.target.value } : null)}
                  className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm uppercase"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-description" className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Description <span className="sr-only">Restaurant Description</span>
                </label>
                <textarea
                  id="settings-description"
                  aria-label="Restaurant Description"
                  value={config.description ?? ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                  className="w-full bg-background border border-outline rounded-md px-4 py-3 font-bold text-sm resize-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-telephone" className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Téléphone <span className="sr-only">Primary Contact</span>
                </label>
                <input
                  id="settings-telephone"
                  aria-label="Primary Contact"
                  value={config.telephone ?? ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, telephone: e.target.value } : null)}
                  className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
