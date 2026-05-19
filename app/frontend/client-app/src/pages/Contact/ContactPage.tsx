import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Share2,
  Globe,
  MessageCircle,
  Loader2,
  Sparkles,
  ArrowRight
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Message transmis avec succès. Notre équipe vous répondra sous peu.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex-1 bg-[#fff8f5] selection:bg-[#8d4e1c]/10 selection:text-[#8d4e1c]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-8 md:py-12">
        
        {/* Editorial Header */}
        <header className="mb-12 space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="w-10 h-[2px] bg-[#8d4e1c]" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Liaison Directe</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif italic text-[#301400] leading-none tracking-tighter">
                Nous Contacter.
            </h1>
            <p className="max-w-xl text-[#53443a] text-lg font-medium leading-relaxed opacity-70 italic font-serif mx-auto md:mx-0">
                Une question, une demande particulière ou un retour d'expérience ? Notre conciergerie digitale est à votre entière disposition.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
            
            {/* Contact Information */}
            <aside className="lg:col-span-5 space-y-10">
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Coordonnées</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] shrink-0 border border-[#ffe3d2] group-hover:bg-[#301400] group-hover:text-white transition-all duration-500">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[#301400] mb-0.5">Localisation</p>
                                    <p className="text-[#53443a] opacity-60 leading-tight font-serif italic text-base">123 Boulevard Gastronomique,<br/>Casablanca, Maroc</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] shrink-0 border border-[#ffe3d2] group-hover:bg-[#301400] group-hover:text-white transition-all duration-500">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[#301400] mb-0.5">Assistance</p>
                                    <p className="text-[#53443a] opacity-60 leading-tight font-serif italic text-base">+212 5 22 00 00 00</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] shrink-0 border border-[#ffe3d2] group-hover:bg-[#301400] group-hover:text-white transition-all duration-500">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[#301400] mb-0.5">Email Privé</p>
                                    <p className="text-[#53443a] opacity-60 leading-tight font-serif italic text-base">liaison@tastify.ma</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Disponibilité</h3>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] shrink-0 border border-[#ffe3d2]">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 w-full">
                                <div className="flex justify-between items-end border-b border-[#ffe3d2] pb-1.5">
                                    <span className="text-xs font-bold text-[#301400]">Lundi — Vendredi</span>
                                    <span className="text-[10px] font-medium text-[#53443a]">12:00 — 23:30</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-[#ffe3d2] pb-1.5">
                                    <span className="text-xs font-bold text-[#301400]">Samedi — Dimanche</span>
                                    <span className="text-[10px] font-medium text-[#53443a]">11:00 — 00:30</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <section className="space-y-6">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Réseaux</h3>
                    <div className="flex gap-3">
                        {[Share2, Globe, MessageCircle].map((Icon, i) => (
                            <button key={i} className="w-12 h-12 rounded-xl border border-[#d8c2b6] flex items-center justify-center text-[#301400] hover:bg-[#301400] hover:text-white transition-all duration-500 hover:-translate-y-1.5">
                                <Icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </section>
            </aside>

            {/* Contact Form */}
            <main className="lg:col-span-7">
                <div className="bg-white border border-[#d8c2b6] rounded-[2rem] p-6 md:p-10 shadow-[0_30px_80px_rgba(48,20,0,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#8d4e1c]/5 blur-[80px] -mr-40 -mt-40" />
                    
                    <div className="relative z-10 space-y-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#fff1ea] text-[#8d4e1c] text-[9px] font-black uppercase tracking-widest mb-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Protocole de Communication</span>
                            </div>
                            <h2 className="text-3xl font-serif italic text-[#301400] leading-none">Formulaire de Liaison.</h2>
                            <p className="text-base text-[#53443a] font-medium opacity-60 italic font-serif">Veuillez renseigner les champs ci-dessous avec précision.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.3em] ml-1 opacity-40">Nom Complet</label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all placeholder:text-[#301400]/20"
                                        placeholder="Jean Dupont"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.3em] ml-1 opacity-40">Email de Contact</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all placeholder:text-[#301400]/20"
                                        placeholder="jean@exemple.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.3em] ml-1 opacity-40">Objet de la Demande</label>
                                <select 
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all appearance-none"
                                >
                                    <option value="">Sélectionnez un motif...</option>
                                    <option value="reservation">Demande de Réservation Spéciale</option>
                                    <option value="evenement">Organisation d'Évènement</option>
                                    <option value="partenariat">Proposition de Partenariat</option>
                                    <option value="autre">Autre Demande</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.4em] ml-1 opacity-40">Message</label>
                                <textarea 
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full p-5 bg-[#fff1ea] border border-[#ffe3d2] rounded-2xl focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all resize-none font-semibold text-[#301400] text-sm placeholder:text-[#301400]/20"
                                    placeholder="Détaillez votre demande ici..."
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-[#301400] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-xl shadow-black/20 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <span>Transmettre la Liaison</span>
                                        <ArrowRight className="w-6 h-6 text-[#8d4e1c]" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
      </div>
    </div>
  );
};
