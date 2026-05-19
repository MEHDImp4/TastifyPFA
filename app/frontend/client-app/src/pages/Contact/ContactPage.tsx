import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Globe,
  Share2,
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
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-10 md:py-16">
        
        {/* Compact Editorial Header */}
        <header className="mb-12 space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
                <span className="w-8 h-[1.5px] bg-[#8d4e1c]" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8d4e1c]">Liaison Directe</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic text-[#301400] leading-[0.9] tracking-tighter">
                Nous Contacter.
            </h1>
            <p className="max-w-xl text-[#53443a] text-lg font-medium leading-snug opacity-70 italic font-serif mx-auto md:mx-0">
                Notre conciergerie digitale est à votre entière disposition.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
            
            {/* Contact Information - Denser */}
            <aside className="lg:col-span-4 space-y-10">
                <div className="space-y-10">
                    <section className="space-y-5">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8d4e1c]">Coordonnées</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-5 group">
                                <div className="w-10 h-10 rounded-xl bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] shrink-0 border border-[#ffe3d2] group-hover:bg-[#301400] group-hover:text-white transition-all duration-300">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[#301400] mb-0.5">Localisation</p>
                                    <p className="text-[#53443a] opacity-60 leading-tight font-serif italic text-base">Casablanca, Maroc</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-5 group">
                                <div className="w-10 h-10 rounded-xl bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] shrink-0 border border-[#ffe3d2] group-hover:bg-[#301400] group-hover:text-white transition-all duration-300">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[#301400] mb-0.5">Assistance</p>
                                    <p className="text-[#53443a] opacity-60 leading-tight font-serif italic text-base">+212 5 22 00 00 00</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-5 group">
                                <div className="w-10 h-10 rounded-xl bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] shrink-0 border border-[#ffe3d2] group-hover:bg-[#301400] group-hover:text-white transition-all duration-300">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[#301400] mb-0.5">Email Privé</p>
                                    <p className="text-[#53443a] opacity-60 leading-tight font-serif italic text-base">liaison@tastify.ma</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-5">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8d4e1c]">Disponibilité</h3>
                        <div className="flex items-start gap-5">
                            <div className="w-10 h-10 rounded-xl bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] shrink-0 border border-[#ffe3d2]">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="grid grid-cols-1 gap-3 w-full">
                                <div className="flex justify-between items-end border-b border-[#ffe3d2] pb-1.5">
                                    <span className="text-xs font-bold text-[#301400]">Lun — Ven</span>
                                    <span className="text-[10px] font-medium text-[#53443a]">12:00 — 23:30</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-[#ffe3d2] pb-1.5">
                                    <span className="text-xs font-bold text-[#301400]">Sam — Dim</span>
                                    <span className="text-[10px] font-medium text-[#53443a]">11:00 — 00:30</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <section className="space-y-5">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8d4e1c]">Réseaux</h3>
                    <div className="flex gap-3">
                        {[Globe, Share2, MessageCircle].map((Icon, i) => (
                            <button key={i} className="w-11 h-11 rounded-xl border border-[#d8c2b6] flex items-center justify-center text-[#301400] hover:bg-[#301400] hover:text-white transition-all duration-300">
                                <Icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </section>
            </aside>

            {/* Contact Form - Fitted */}
            <main className="lg:col-span-8">
                <div className="bg-white border border-[#d8c2b6] rounded-[2rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(48,20,0,0.04)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#8d4e1c]/5 blur-[80px] -mr-32 -mt-32" />
                    
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#fff1ea] text-[#8d4e1c] text-[9px] font-black uppercase tracking-widest mb-2">
                                <Sparkles className="w-3 h-3" />
                                <span>Protocole</span>
                            </div>
                            <h2 className="text-4xl font-serif italic text-[#301400] leading-none">Formulaire de Liaison.</h2>
                            <p className="text-[#53443a] text-sm font-medium opacity-60">Précisez votre demande avec soin.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.2em] ml-1 opacity-40">Nom</label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all"
                                        placeholder="Nom"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.2em] ml-1 opacity-40">Email</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all"
                                        placeholder="Email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.2em] ml-1 opacity-40">Objet</label>
                                <select 
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all appearance-none"
                                >
                                    <option value="">Motif...</option>
                                    <option value="reservation">Réservation Spéciale</option>
                                    <option value="evenement">Évènement</option>
                                    <option value="partenariat">Partenariat</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.2em] ml-1 opacity-40">Message</label>
                                <textarea 
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full p-5 bg-[#fff1ea] border border-[#ffe3d2] rounded-2xl focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all resize-none font-semibold text-[#301400] text-sm"
                                    placeholder="Détaillez votre demande..."
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-[#301400] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all hover:bg-[#4b2709] active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <span>Transmettre</span>
                                        <ArrowRight className="w-5 h-5 text-[#8d4e1c]" />
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
