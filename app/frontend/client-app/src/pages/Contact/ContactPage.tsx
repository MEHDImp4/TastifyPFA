import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  MapPin,
  Clock,
  Loader2,
  Sparkles,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

export const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Indiquez votre nom.';
    if (!formData.email.trim()) {
      nextErrors.email = 'Indiquez votre email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Utilisez une adresse email valide.';
    }
    if (!formData.subject) nextErrors.subject = 'Choisissez un sujet.';
    if (!formData.message.trim()) nextErrors.message = 'Ajoutez votre message.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Manifeste Transmis. Notre concierge vous contactera.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[e.target.name];
      return next;
    });
  };

  return (
    <div className="page-shell min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-client-margin page-section">
        
        {/* Editorial Header */}
        <header className="mb-12 md:mb-20 space-y-6">
            <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-primary" />
                <span className="editorial-kicker">Liaison Directe</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-on-surface uppercase tracking-tight leading-none m-0">Registre de Contact.</h1>
            <p className="max-w-xl text-on-surface-variant text-lg md:text-xl opacity-80 leading-relaxed">Une demande spéciale ou un retour ? Notre concierge digital est à votre entière disposition.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
            
            {/* Coordinates & Identity */}
            <aside className="lg:col-span-4 space-y-16">
                <section className="space-y-10">
                    <span className="editorial-kicker text-on-surface-subtle">Coordonnées</span>
                    <div className="space-y-8">
                        <div className="flex items-start gap-8 group cursor-default">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary shrink-0 transition-all duration-700 group-hover:bg-on-surface group-hover:text-background shadow-inner">
                                <MapPin className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.2em]">Localisation</p>
                                <p className=" text-xl md:text-2xl  text-on-surface leading-tight uppercase tracking-tight">123 Boulevard Gastronomique,<br/>Casablanca, Maroc</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-8 group cursor-default">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary shrink-0 transition-all duration-700 group-hover:bg-on-surface group-hover:text-background shadow-inner">
                                <Phone className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.2em]">Assistance</p>
                                <p className=" text-xl md:text-2xl  text-on-surface leading-tight tabular-nums">+212 5 22 00 00 00</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-10">
                    <span className="editorial-kicker text-on-surface-subtle">Fenêtre Temporelle</span>
                    <div className="flex items-start gap-8">
                        <div className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <Clock className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 w-full">
                            <div className="flex justify-between items-end border-b border-outline-variant/10 pb-3">
                                <span className="font-sans text-xs font-black text-on-surface uppercase tracking-widest">Lun — Ven</span>
                                <span className="font-sans text-[10px] font-medium text-on-surface-variant">12:00 — 23:30</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-outline-variant/10 pb-3">
                                <span className="font-sans text-xs font-black text-on-surface uppercase tracking-widest">Sam — Dim</span>
                                <span className="font-sans text-[10px] font-medium text-on-surface-variant">11:00 — 00:30</span>
                            </div>
                        </div>
                    </div>
                </section>
            </aside>

            {/* Liaison Manifest Form */}
            <main className="lg:col-span-8">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="bg-surface-container border border-outline-variant rounded-lg p-6 md:p-12 relative overflow-hidden shadow-xl"
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-highest text-primary border border-primary/20">
                                <Sparkles className="w-4 h-4" />
                                <span className="font-sans text-[9px] font-black tracking-[0.3em] uppercase">Protocole Actif</span>
                            </div>
                            <h2 className=" text-3xl md:text-5xl font-black text-on-surface  leading-none m-0">Le Manifeste.</h2>
                        </div>

                        <form onSubmit={handleSubmit} noValidate className="space-y-8 md:space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label htmlFor="contact-name-input" className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.3em] ml-2">Identité</label>
                                    <input 
                                        id="contact-name-input" type="text" name="name" value={formData.name} onChange={handleChange} required
                                        aria-label="Identité"
                                        aria-invalid={Boolean(errors.name)}
                                        aria-describedby={errors.name ? 'contact-name-error' : undefined}
                                        className="field-control min-h-16 rounded-2xl px-6 uppercase"
                                        placeholder="Votre nom"
                                    />
                                    {errors.name && <p id="contact-name-error" role="alert" className="form-error">{errors.name}</p>}
                                </div>
                                <div className="space-y-3">
                                    <label htmlFor="contact-email-input" className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.3em] ml-2">Coordonnée</label>
                                    <input 
                                        id="contact-email-input" type="email" name="email" value={formData.email} onChange={handleChange} required
                                        aria-label="Coordonnée"
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={errors.email ? 'contact-email-error' : undefined}
                                        className="field-control min-h-16 rounded-2xl px-6"
                                        placeholder="votre@email.com"
                                    />
                                    {errors.email && <p id="contact-email-error" role="alert" className="form-error">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label htmlFor="contact-subject-select" className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.3em] ml-2">Sujet</label>
                                <select 
                                    id="contact-subject-select" name="subject" value={formData.subject} onChange={handleChange} required
                                    aria-label="Sujet"
                                    aria-invalid={Boolean(errors.subject)}
                                    aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                                    className="field-control min-h-16 rounded-2xl px-6 appearance-none cursor-pointer"
                                >
                                    <option value="">SÉLECTIONNER UN PARAMÈTRE...</option>
                                    <option value="reservation">RÉSERVATION PRIVÉE</option>
                                    <option value="evenement">ARCHITECTURE D'ÉVÉNEMENT</option>
                                    <option value="partenariat">PARTENARIAT</option>
                                </select>
                                {errors.subject && <p id="contact-subject-error" role="alert" className="form-error">{errors.subject}</p>}
                            </div>

                            <div className="space-y-3">
                                <label htmlFor="contact-message-input" className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.3em] ml-2">Message</label>
                                <textarea 
                                    id="contact-message-input" name="message" value={formData.message} onChange={handleChange} required rows={4}
                                    aria-label="Message"
                                    aria-invalid={Boolean(errors.message)}
                                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                                    className="field-control min-h-36 rounded-[2rem] p-6 md:p-8 resize-none font-body text-base md:text-lg uppercase"
                                    placeholder="Votre message..."
                                />
                                {errors.message && <p id="contact-message-error" role="alert" className="form-error">{errors.message}</p>}
                            </div>

                            <button 
                                type="submit" disabled={isSubmitting}
                                data-testid="contact-submit"
                                className="btn-primary w-full min-h-14 gap-4"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Envoyer le message</span><Send className="w-5 h-5 text-on-primary/60" /></>}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
      </div>
    </div>
  );
};


