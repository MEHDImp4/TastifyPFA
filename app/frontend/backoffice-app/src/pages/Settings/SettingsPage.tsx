import React, { useState, useEffect } from 'react';
import { configurationApi } from '../../api/configuration';
import type { RestaurantConfiguration } from '../../api/configuration';
import { 
  Building2, 
  Save, 
  Loader2,
  Timer,
  Palette,
  RotateCcw,
  CloudUpload,
  Coins,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<RestaurantConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fetchSettings = () => {
    setIsLoading(true);
    configurationApi.getSettings()
      .then(res => {
        setConfig(res.data);
        if (res.data.logo) setLogoPreview(res.data.logo);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch settings', err);
        toast.error('Erreur de chargement des paramètres');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!config) return;
    const { name, value, type } = e.target;
    let processedValue: any = value;
    if (type === 'number') processedValue = value === '' ? 0 : parseFloat(value);
    setConfig({ ...config, [name]: processedValue });
  };

  const handleToggleChange = (name: string) => {
    if (!config) return;
    setConfig({ ...config, [name as keyof RestaurantConfiguration]: !((config as any)[name]) });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    try {
      const updateData: any = { ...config };
      delete updateData.logo;
      delete updateData.updated_at;
      delete updateData.id;

      if (logoFile) updateData.logo = logoFile;
      
      const res = await configurationApi.updateSettings(updateData);
      setConfig(res.data);
      if (res.data.logo) setLogoPreview(res.data.logo);
      setLogoFile(null);
      
      toast.success('SYSTÈME DÉPLOYÉ AVEC SUCCÈS (System parameters deployed)');
    } catch (err) {
      toast.error('ÉCHEC DU DÉPLOIEMENT (Deployment failure)');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;
  if (!config) return <div className="h-full flex items-center justify-center text-error font-black uppercase tracking-widest">ERREUR SYSTÈME <span className="sr-only">CRITICAL: UNAVAILABLE.</span></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-sans selection:bg-primary/20 overflow-hidden">
      
      {/* Settings Header */}
      <div className="flex-none flex justify-between items-end px-8 py-8 border-b border-outline bg-surface-container-lowest">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface uppercase italic leading-none">Console Système <span className="sr-only">System Settings</span></h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.4em] mt-3 opacity-50">Configuration de l'Établissement et Paramètres Globaux</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchSettings} className="h-12 px-6 border border-outline rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all">
             <RotateCcw className="w-4 h-4 inline-block mr-2" /> Réinitialiser
          </button>
          <button 
            onClick={() => handleSave()} 
            disabled={isSaving} 
            className="btn-primary"
            aria-label="Deploy Changes"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Sauvegarder & Déployer <span className="sr-only">Deploy Changes</span></>}
          </button>
        </div>
      </div>

      {/* Main Configuration Console */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-8 pb-20">
            
            {/* Left Console: Entity & Localization */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
                <section className="bg-surface-container-lowest border border-outline rounded-xl p-10">
                    <div className="flex items-center gap-4 mb-10 border-b border-outline pb-4">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.2em]">Identité de l'Entité</h2>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-10">
                        <div className="col-span-2 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Raison Sociale / Enseigne</label>
                            <input type="text" aria-label="Trading Name" name="nom" value={config.nom} onChange={handleInputChange} className="w-full h-16 px-6 bg-background border border-outline rounded-xl font-black text-2xl text-on-surface uppercase focus:border-primary" />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Devise Opérationnelle</label>
                            <div className="relative">
                                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                <select name="devise" value={config.devise} onChange={handleInputChange} className="w-full h-14 pl-12 pr-6 bg-background border border-outline rounded-lg text-on-surface font-bold text-xs uppercase focus:border-primary">
                                    <option value="DH">MAD / DIRHAM (DH)</option>
                                    <option value="EUR">EUR / EURO (€)</option>
                                    <option value="USD">USD / DOLLAR ($)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Ligne de Contact</label>
                            <input type="text" aria-label="Primary Contact" name="telephone" value={config.telephone || ''} onChange={handleInputChange} className="w-full h-14 px-6 bg-background border border-outline rounded-lg font-mono text-lg font-black text-on-surface focus:border-primary" />
                        </div>

                        <div className="col-span-2 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Adresse Physique de l'Établissement</label>
                            <textarea rows={2} name="adresse" value={config.adresse || ''} onChange={handleInputChange} className="w-full p-6 bg-background border border-outline rounded-xl font-bold text-sm text-on-surface uppercase focus:border-primary resize-none" />
                        </div>
                    </div>
                </section>

                <section className="bg-surface-container-lowest border border-outline rounded-xl p-10">
                    <div className="flex items-center gap-4 mb-10 border-b border-outline pb-4">
                        <Globe className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.2em]">Présence Digitale</h2>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Description Gastronomique (Client App)</label>
                        <textarea rows={3} aria-label="Restaurant Description" name="description" value={config.description || ''} onChange={handleInputChange} className="w-full p-6 bg-background border border-outline rounded-xl font-bold text-sm text-on-surface uppercase focus:border-primary resize-none italic" />
                    </div>
                </section>
            </div>

            {/* Right Console: Ops & Performance */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
                <section className="bg-surface-container-low border border-outline rounded-xl p-8 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8 border-b border-outline pb-4 relative z-10">
                        <Timer className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.2em]">Flux Opérationnel</h2>
                    </div>

                    <div className="space-y-10 relative z-10">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60">Objectif Prép. Moyen</label>
                                <span className="font-mono text-lg font-black text-primary">{config.prep_target_minutes} MIN</span>
                            </div>
                            <input type="range" min="5" max="60" name="prep_target_minutes" value={config.prep_target_minutes} onChange={handleInputChange} className="w-full accent-primary h-1 bg-surface-container-high rounded-full cursor-pointer appearance-none" />
                        </div>

                        <button 
                            type="button" onClick={() => handleToggleChange('auto_send_main_course')}
                            className={`w-full flex items-center justify-between p-5 rounded-xl border-2 transition-all ${config.auto_send_main_course ? 'bg-primary/5 border-primary/40' : 'bg-surface-container-lowest border-outline'}`}
                        >
                            <div className="text-left">
                                <p className="text-[11px] font-black text-on-surface uppercase tracking-tight">Séquençage Auto</p>
                                <p className="text-[9px] font-bold text-on-surface-variant/40 uppercase mt-1">Envoi automatique en cuisine</p>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-all ${config.auto_send_main_course ? 'bg-primary' : 'bg-surface-container-high'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.auto_send_main_course ? 'right-1' : 'left-1'}`} />
                            </div>
                        </button>
                    </div>
                </section>

                <section className="bg-surface-container-lowest border border-outline rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-8 border-b border-outline pb-4">
                        <Palette className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.2em]">Identité Visuelle</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Sceau de l'Établissement (Logo)</label>
                        <div className="relative group aspect-square bg-background border-2 border-dashed border-outline rounded-xl flex flex-col items-center justify-center overflow-hidden hover:border-primary transition-all">
                            {logoPreview ? (
                                <>
                                    <img src={logoPreview} className="absolute inset-0 w-full h-full object-contain p-10 opacity-60 group-hover:opacity-20 transition-all duration-700" alt="" />
                                    <CloudUpload className="relative z-10 w-10 h-10 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                </>
                            ) : (
                                <div className="flex flex-col items-center opacity-20">
                                    <CloudUpload className="w-12 h-12 mb-3" strokeWidth={1} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Injecter Logo PNG</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                        </div>
                    </div>
                </section>

                <div className="p-8 bg-success/5 border border-success/20 rounded-xl flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-success shrink-0" />
                    <p className="text-[10px] font-bold text-success uppercase leading-relaxed tracking-widest">
                        Le déploiement des paramètres est instantané et affecte l'ensemble de l'écosystème Tastify (Staff & Clients).
                    </p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};
