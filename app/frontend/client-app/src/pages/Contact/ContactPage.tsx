import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  MapPin,
  Clock,
  Loader2,
  Sparkles,
  Send,
  ChevronRight
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
    toast.success('Message envoyé. Nous vous répondrons rapidement.');
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
    <div className="page-shell min-h-[85vh] bg-background">
      <div className="max-w-6xl mx-auto px-client-margin page-section">
        
        {/* Editorial Header */}
        <header className="mb-12 md:mb-20 space-y-6">
            <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-accent" />
                <span className="text-[10px] font-bold text-accent tracking-[0.25em] uppercase">Contact</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-on-background tracking-tight m-0 uppercase font-heading">Écrivez-nous.</h1>
            <p className="max-w-xl text-on-surface-muted text-base md:text-lg font-semibold leading-relaxed">Une question, une réservation de groupe ou un retour sur votre visite ? Notre équipe est à votre entière disposition.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Coordinates & Identity */}
            <aside className="lg:col-span-4 space-y-8">
                <section className="bg-surface border border-outline rounded-2xl p-6 md:p-8 space-y-8 shadow-premium">
                    <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase block">Coordonnées</span>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 group cursor-default">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline flex items-center justify-center text-accent shrink-0 transition-all duration-500 group-hover:bg-primary group-hover:text-white shadow-premium">
                                <MapPin className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.2em]">Localisation</p>
                                <p className="text-base font-semibold text-on-background leading-relaxed uppercase tracking-tight">123 Boulevard Gastronomique,<br/>Casablanca, Maroc</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4 group cursor-default">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline flex items-center justify-center text-accent shrink-0 transition-all duration-500 group-hover:bg-primary group-hover:text-white shadow-premium">
                                <Phone className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.2em]">Assistance</p>
                                <p className="text-base font-bold font-mono text-accent leading-relaxed tabular-nums">+212 5 22 00 00 00</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#1E1111] text-white rounded-2xl p-6 md:p-8 space-y-8 shadow-premium-lg relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[50px] -mr-24 -mt-24 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <span className="text-[9px] font-bold tracking-[0.25em] text-amber-400 uppercase block">Disponibilité</span>
                        <h3 className="text-xl font-bold tracking-tight text-white m-0 uppercase font-heading">Nos Horaires.</h3>
                    </div>

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                            <Clock className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 w-full">
                            <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">Lun — Ven</span>
                                <span className="text-xs font-bold font-mono text-amber-400">12:00 — 23:30</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">Sam — Dim</span>
                                <span className="text-xs font-bold font-mono text-amber-400">11:00 — 00:30</span>
                            </div>
                        </div>
                    </div>
                </section>
            </aside>

            {/* Contact form */}
            <main className="lg:col-span-8">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="bg-surface border border-outline rounded-2xl p-6 md:p-10 lg:p-12 relative overflow-hidden shadow-premium"
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high text-accent border border-outline">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Réponse sous 24 h</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-on-background leading-none m-0 uppercase font-heading">Votre message</h2>
                        </div>

                        <form onSubmit={handleSubmit} noValidate className="space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label htmlFor="contact-name-input" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-2 block">Nom</label>
                                    <input 
                                        id="contact-name-input" type="text" name="name" value={formData.name} onChange={handleChange} required
                                        aria-label="Nom"
                                        aria-invalid={Boolean(errors.name)}
                                        aria-describedby={errors.name ? 'contact-name-error' : undefined}
                                        className="field-control"
                                        placeholder="Votre nom"
                                    />
                                    {errors.name && <p id="contact-name-error" role="alert" className="form-error mt-1">{errors.name}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <label htmlFor="contact-email-input" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-2 block">Email</label>
                                    <input 
                                        id="contact-email-input" type="email" name="email" value={formData.email} onChange={handleChange} required
                                        aria-label="Email"
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={errors.email ? 'contact-email-error' : undefined}
                                        className="field-control"
                                        placeholder="votre@email.com"
                                    />
                                    {errors.email && <p id="contact-email-error" role="alert" className="form-error mt-1">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label htmlFor="contact-subject-select" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-2 block">Sujet</label>
                                <div className="relative">
                                    <select 
                                        id="contact-subject-select" name="subject" value={formData.subject} onChange={handleChange} required
                                        aria-label="Sujet"
                                        aria-invalid={Boolean(errors.subject)}
                                        aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                                        className="field-control appearance-none cursor-pointer pr-10"
                                    >
                                        <option value="">Choisir un sujet</option>
                                        <option value="reservation">Réservation</option>
                                        <option value="evenement">Événement</option>
                                        <option value="partenariat">Partenariat</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-on-surface-subtle">
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                                {errors.subject && <p id="contact-subject-error" role="alert" className="form-error mt-1">{errors.subject}</p>}
                            </div>

                            <div className="space-y-2.5">
                                <label htmlFor="contact-message-input" className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.3em] ml-2 block">Message</label>
                                <textarea 
                                    id="contact-message-input" name="message" value={formData.message} onChange={handleChange} required rows={4}
                                    aria-label="Message"
                                    aria-invalid={Boolean(errors.message)}
                                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                                    className="field-control min-h-36 p-4 md:p-6 resize-none font-body text-base"
                                    placeholder="Votre message..."
                                />
                                {errors.message && <p id="contact-message-error" role="alert" className="form-error mt-1">{errors.message}</p>}
                            </div>

                            <button 
                                type="submit" disabled={isSubmitting}
                                data-testid="contact-submit"
                                className="btn-primary w-full min-h-14 gap-4"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : <><span>Envoyer le message</span><Send className="w-4 h-4 text-on-primary/60" /></>}
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
