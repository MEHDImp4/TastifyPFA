import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { configurationApi } from '../../api/configuration';
import type { RestaurantConfiguration } from '../../api/configuration';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Save, 
  Upload,
  Settings as SettingsIcon,
  AtSign,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const }
};

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
        toast.error('Erreur lors du chargement des paramètres');
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
      toast.success('Paramètres enregistrés avec succès');
    } catch (err) {
      console.error('Failed to update settings', err);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center font-sans">Chargement...</div>;
  if (!config) return <div className="p-10 text-center font-sans text-error">Impossible de charger la configuration.</div>;

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-10 pb-20"
      initial="initial"
      animate="animate"
    >
      <motion.div className="flex items-center justify-between" variants={fadeInUp}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface font-sans flex items-center gap-3">
            Establishment Settings
            <SettingsIcon className="w-6 h-6 text-primary/40" />
          </h1>
          <p className="text-on-surface-variant mt-1.5 font-sans font-medium opacity-70">Configure your restaurant's identity and operational details.</p>
        </div>
      </motion.div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Branding Section */}
        <motion.div className="double-bezel p-5 md:p-10 bg-white" variants={fadeInUp}>
          <h2 className="text-base font-bold text-on-surface mb-8 flex items-center gap-3 font-sans">
            <Building2 className="w-5 h-5 text-primary"  strokeWidth={1.5}/>
            Branding & Identity
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
            <div className="space-y-4">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60">Logo Restaurant</p>
              <div className="relative group w-full aspect-square rounded-none overflow-hidden bg-surface-container-low border-2 border-dashed border-surface-container-high flex flex-col items-center justify-center transition-all hover:border-primary/40">
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-white text-on-surface px-4 py-2 rounded-none text-xs font-bold shadow-[2px_2px_0px_rgba(15,23,42,0.1)]">
                            Modifier le logo
                            <input type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                        </label>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 w-full h-full justify-center">
                    <Upload className="w-8 h-8 text-on-surface-variant"  strokeWidth={1.5}/>
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-on-surface-variant">Upload Logo</span>
                    <input type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                  </label>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Nom de l'établissement</label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="nom"
                    value={config.nom}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border-none rounded-none px-3 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Ex: Le Petit Tajine"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Description Courte</label>
                <div className="relative">
                  <textarea 
                    name="description"
                    value={config.description || ''}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border-none rounded-none px-3 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                    placeholder="Une brève description de votre restaurant..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Devise Locale</label>
                <input 
                  type="text" 
                  name="devise"
                  value={config.devise}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-low border-none rounded-none px-3 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all max-w-[100px]"
                  placeholder="DH"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact & Location Section */}
        <motion.div className="double-bezel p-5 md:p-10 bg-white" variants={fadeInUp}>
          <h2 className="text-base font-bold text-on-surface mb-8 flex items-center gap-3 font-sans">
            <MapPin className="w-5 h-5 text-primary"  strokeWidth={1.5}/>
            Contact & Location
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Email de contact</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-5 w-4 h-4 text-on-surface-variant opacity-40"  strokeWidth={1.5}/>
                <input 
                  type="email" 
                  name="email"
                  value={config.email || ''}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-low border-none rounded-none pl-12 pr-5 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="contact@restaurant.ma"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Téléphone</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-5 w-4 h-4 text-on-surface-variant opacity-40"  strokeWidth={1.5}/>
                <input 
                  type="text" 
                  name="telephone"
                  value={config.telephone || ''}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-low border-none rounded-none pl-12 pr-5 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="+212 5XX XXX XXX"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Adresse physique</label>
              <div className="relative flex items-start">
                <MapPin className="absolute left-5 top-5 w-4 h-4 text-on-surface-variant opacity-40"  strokeWidth={1.5}/>
                <textarea 
                  name="adresse"
                  value={config.adresse || ''}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-low border-none rounded-none pl-12 pr-5 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                  placeholder="123 Rue de la Gastronomie, Casablanca"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Media Section */}
        <motion.div className="double-bezel p-5 md:p-10 bg-white" variants={fadeInUp}>
          <h2 className="text-base font-bold text-on-surface mb-8 flex items-center gap-3 font-sans">
            <Globe className="w-5 h-5 text-primary"  strokeWidth={1.5}/>
            Réseaux Sociaux
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Facebook</label>
              <div className="relative flex items-center">
                <Globe className="absolute left-5 w-4 h-4 text-on-surface-variant opacity-40"  strokeWidth={1.5}/>
                <input 
                  type="url" 
                  name="facebook"
                  value={config.facebook || ''}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-low border-none rounded-none pl-12 pr-5 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Instagram</label>
              <div className="relative flex items-center">
                <AtSign className="absolute left-5 w-4 h-4 text-on-surface-variant opacity-40"  strokeWidth={1.5}/>
                <input 
                  type="url" 
                  name="instagram"
                  value={config.instagram || ''}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-low border-none rounded-none pl-12 pr-5 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-mono opacity-60 px-1">Twitter (X)</label>
              <div className="relative flex items-center">
                <MessageCircle className="absolute left-5 w-4 h-4 text-on-surface-variant opacity-40"  strokeWidth={1.5}/>
                <input 
                  type="url" 
                  name="twitter"
                  value={config.twitter || ''}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-low border-none rounded-none pl-12 pr-5 py-2 font-sans font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div 
          className="flex items-center justify-end gap-3 pt-4"
          variants={fadeInUp}
        >
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-3 px-10 py-3 bg-primary text-white rounded-none font-bold shadow-[2px_2px_0px_rgba(15,23,42,0.1)] shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-none animate-spin" />
            ) : (
              <Save className="w-5 h-5"  strokeWidth={1.5}/>
            )}
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
};
