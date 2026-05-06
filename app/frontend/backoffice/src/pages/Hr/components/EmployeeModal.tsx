import React, { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, DollarSign, Calendar, CreditCard, Phone, Mail, Shield } from 'lucide-react';
import { Employe, EmployeFormData } from '../types';
import { Select } from '../../../components/ui/Select';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmployeFormData) => Promise<void>;
  initialData?: Employe | null;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<EmployeFormData>({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'SERVEUR',
    poste: '',
    salaire: '',
    date_embauche: new Date().toISOString().split('T')[0],
    telephone: '',
    adresse: '',
    cin: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.user_details.first_name,
        last_name: initialData.user_details.last_name,
        email: initialData.user_details.email,
        role: initialData.user_details.role,
        poste: initialData.poste,
        salaire: initialData.salaire,
        date_embauche: initialData.date_embauche,
        telephone: initialData.telephone,
        adresse: initialData.adresse,
        cin: initialData.cin,
      });
    } else {
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        role: 'SERVEUR',
        poste: '',
        salaire: '',
        date_embauche: new Date().toISOString().split('T')[0],
        telephone: '',
        adresse: '',
        cin: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save employee', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-surface/80 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal/10 border border-teal/20">
              <User className="text-teal" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{initialData ? 'Modifier Employé' : 'Nouvel Employé'}</h2>
              <p className="text-xs text-foreground-muted">Configurez le profil et les accès.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-foreground-muted hover:bg-white/5 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Identity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal/80">
              <User size={10} />
              <span>Identité & Accès</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Prénom</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Nom</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
                  placeholder="Nom de famille"
                />
              </div>
              {!initialData && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Nom d'utilisateur</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
                      placeholder="Identifiant de connexion"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Mot de passe</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
                    placeholder="exemple@tastify.ma"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Rôle Système</label>
                <Select
                  value={formData.role || ''}
                  onChange={(val) => setFormData({ ...formData, role: val })}
                  options={[
                    { value: 'SERVEUR', label: 'Serveur' },
                    { value: 'CUISINIER', label: 'Cuisinier' },
                    { value: 'GERANT', label: 'Gérant' },
                  ]}
                  icon={<Shield size={14} />}
                />
              </div>
            </div>
          </div>

          {/* Professional Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal/80">
              <Briefcase size={10} />
              <span>Contrat & Poste</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Intitulé du Poste</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input
                    type="text"
                    required
                    value={formData.poste}
                    onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
                    placeholder="Ex: Responsable de Salle"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Salaire (MAD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input
                    type="number"
                    required
                    value={formData.salaire}
                    onChange={(e) => setFormData({ ...formData, salaire: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Date d'embauche</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input
                    type="date"
                    required
                    value={formData.date_embauche}
                    onChange={(e) => setFormData({ ...formData, date_embauche: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-white/5 pl-11 pr-4 py-3 text-sm text-white outline-none transition-all focus:border-teal/50 focus:bg-white/10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">CIN</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input
                    type="text"
                    required
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
                    placeholder="Ex: AA123456"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
                    placeholder="06..."
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted ml-1">Adresse</label>
                <textarea
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none resize-none"
                  placeholder="Adresse complète"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-white/5 text-sm font-bold text-foreground-muted hover:bg-white/5 hover:text-white transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-teal px-8 py-3 rounded-xl text-sm font-black text-surface hover:bg-teal-light transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-teal/20"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface/30 border-t-surface" />
              ) : (
                <>
                  <Save size={16} />
                  {initialData ? 'Enregistrer' : 'Créer le profil'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
