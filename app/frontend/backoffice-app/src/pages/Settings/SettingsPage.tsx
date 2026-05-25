import React, { useState, useEffect } from 'react';
import { configurationApi } from '../../api/configuration';
import type { RestaurantConfiguration } from '../../api/configuration';
import { 
  Building2, 
  Save, 
  Loader2,
  DollarSign,
  Timer,
  Palette,
  RotateCcw,
  CloudUpload
} from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<RestaurantConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    configurationApi.getSettings()
      .then(res => {
        setConfig(res.data);
        if (res.data.logo) setLogoPreview(res.data.logo);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch settings', err);
        toast.error('System config load error');
        setIsLoading(false);
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!config) return;
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    try {
      const updateData: any = { ...config };
      if (logoFile) updateData.logo = logoFile;
      
      const res = await configurationApi.updateSettings(updateData);
      setConfig(res.data);
      toast.success('System parameters deployed');
    } catch (err) {
      console.error('Failed to update settings', err);
      toast.error('Deployment failure');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;
  if (!config) return <div className="p-10 text-center font-sans text-error">CRITIQUE : INDISPONIBLE.</div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-surface-main overflow-hidden font-body selection:bg-primary/20">
      
      {/* Dynamic Header */}
      <header className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">Paramètres Système</h1>
          <h2 className="sr-only">Configuration</h2>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Paramètres globaux et valeurs par défaut</p>
        </div>
        <div className="flex gap-unit-md items-center">
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded font-sans text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> Annuler
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all border border-primary"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Déployer Modifications</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-staff-margin bg-surface-container-lowest custom-scrollbar">
        <form onSubmit={handleSave} className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-staff-gutter">
          
          {/* Left Column (Core Settings) */}
          <div className="col-span-1 md:col-span-8 space-y-staff-gutter">
            
            {/* Entity Details */}
            <section className="bg-surface-container border border-outline-variant rounded p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-outline-variant/30 pb-3">
                <Building2 className="w-4.5 h-4.5 text-primary" />
                <h2 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Détails de l'Entité</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-unit-xs">
                  <label htmlFor="settings-nom" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nom Commercial</label>
                  <input 
                    id="settings-nom" type="text" name="nom" value={config.nom} onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase"
                  />
                </div>

                <div className="col-span-2 md:col-span-1 space-y-unit-xs">
                  <label htmlFor="settings-registration" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">N° d'Enregistrement</label>
                  <input 
                    id="settings-registration" type="text" value="REG-8839-AB" disabled
                    className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant rounded font-mono font-bold text-on-surface-variant outline-none"
                  />
                </div>

                <div className="col-span-2 md:col-span-1 space-y-unit-xs">
                  <label htmlFor="settings-telephone" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Contact Principal</label>
                  <input 
                    id="settings-telephone" type="text" name="telephone" value={config.telephone || ''} onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="col-span-2 space-y-unit-xs">
                  <label htmlFor="settings-description" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Description du Restaurant</label>
                  <textarea 
                    id="settings-description" name="description" value={config.description || ''} onChange={handleInputChange}
                    className="w-full p-4 bg-surface-main border border-outline-variant rounded font-sans text-[13px] font-bold text-on-surface focus:border-primary outline-none transition-all resize-none uppercase"
                    rows={2}
                  />
                </div>

                <div className="col-span-2 space-y-unit-xs">
                  <label htmlFor="settings-adresse" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Adresse Physique</label>
                  <textarea 
                    id="settings-adresse" name="adresse" value={config.adresse || ''} onChange={handleInputChange}
                    className="w-full p-4 bg-surface-main border border-outline-variant rounded font-sans text-[13px] font-bold text-on-surface focus:border-primary outline-none transition-all resize-none uppercase"
                    rows={2}
                  />
                </div>
              </div>
            </section>

            {/* Financial Parameters */}
            <section className="bg-surface-container border border-outline-variant rounded p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-outline-variant/30 pb-3">
                <DollarSign className="w-4.5 h-4.5 text-primary" />
                <h2 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Paramètres Financiers</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-unit-xs">
                    <label htmlFor="settings-tax" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Taxe d'État (%)</label>
                    <div className="relative">
                      <input 
                        id="settings-tax" type="number" step="0.001" value="8.875" disabled
                        className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant rounded font-mono font-bold text-on-surface-variant text-right"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/80 font-bold">%</span>
                    </div>
                 </div>
                 <div className="space-y-unit-xs">
                    <label htmlFor="settings-gratuity-threshold" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Seuil Pourboire Auto</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/80 font-bold">PAX</span>
                       <input 
                        id="settings-gratuity-threshold" type="number" value="6" disabled
                        className="w-full h-12 pl-12 pr-4 bg-surface-container-low border border-outline-variant rounded font-mono font-bold text-on-surface-variant text-right"
                      />
                    </div>
                 </div>
                 <div className="space-y-unit-xs">
                    <label htmlFor="settings-default-gratuity" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Pourboire par Défaut (%)</label>
                    <div className="relative">
                      <input 
                        id="settings-default-gratuity" type="number" value="20" disabled
                        className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant rounded font-mono font-bold text-on-surface-variant text-right"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/80 font-bold">%</span>
                    </div>
                 </div>
              </div>
            </section>
          </div>

          {/* Right Column (Ops & Brand) */}
          <div className="col-span-1 md:col-span-4 space-y-staff-gutter">
            
            {/* Throughput Targets */}
            <section className="bg-surface-container border border-outline-variant rounded p-6 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" style={{ clipPath: 'polygon(100% 0, 100% 30%, 50% 100%, 0 100%, 0 0)' }} />
              <div className="flex items-center gap-3 mb-8 border-b border-outline-variant/30 pb-3 relative z-10">
                <Timer className="w-4.5 h-4.5 text-primary" />
                <h2 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Objectifs de Débit</h2>
              </div>
              
              <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label htmlFor="settings-prep-target" className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Objectif Prép. Moyen</label>
                    <span className="font-sans text-[12px] font-black text-primary uppercase">18 Minutes</span>
                  </div>
                  <input id="settings-prep-target" aria-describedby="settings-prep-target-range" aria-label="Objectif de préparation moyen" title="Objectif de préparation moyen" type="range" min="5" max="45" value="18" className="w-full accent-primary h-1 bg-surface-container-highest rounded-full cursor-pointer" />
                  <div id="settings-prep-target-range" className="flex justify-between font-mono text-[9px] text-on-surface-variant/90">
                    <span>5M</span>
                    <span>45M</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-main border border-outline-variant rounded-lg" role="switch" aria-checked="true" aria-label="Envoi auto des plats">
                  <div>
                    <p className="font-sans text-[11px] font-black text-on-surface uppercase tracking-tight">Envoi Auto des Plats</p>
                    <p className="font-sans text-[9px] text-on-surface-variant/90 uppercase mt-1">Envoyer les plats principaux après les entrées</p>
                  </div>
                  <div className="w-10 h-5 bg-primary rounded-full relative border border-primary">
                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </section>

            {/* Brand Identity */}
            <section className="bg-surface-container border border-outline-variant rounded p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-outline-variant/30 pb-3">
                <Palette className="w-4.5 h-4.5 text-primary" />
                <h2 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Identité de Marque</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="settings-logo" className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Logo Ticket Client</label>
                  <div className="relative group aspect-video bg-surface-main border-2 border-dashed border-outline-variant rounded flex flex-col items-center justify-center transition-all hover:border-primary overflow-hidden">
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} className="absolute inset-0 w-full h-full object-contain p-4 opacity-40 group-hover:opacity-20 transition-opacity" alt="Logo" />
                        <CloudUpload className="relative z-10 w-6 h-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                       <>
                        <CloudUpload className="w-8 h-8 text-on-surface-variant/20 mb-2" />
                        <span className="font-sans text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Sélectionner PNG Monochrome</span>
                       </>
                    )}
                    <input id="settings-logo" aria-label="Télécharger le logo du ticket client" title="Télécharger le logo du ticket client" type="file" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Couleur d'Accentuation TPV</label>
                  <div className="flex items-center gap-3 bg-surface-main border border-outline-variant rounded p-1.5 pr-4">
                    <div className="w-6 h-6 rounded bg-primary shadow-sm" />
                    <span className="font-mono text-[11px] font-bold text-on-surface">#FFB785</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </form>
      </main>
    </div>
  );
};
