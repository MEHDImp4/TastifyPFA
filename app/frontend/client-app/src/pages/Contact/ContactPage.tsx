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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Manifest Transmitted. Our concierge will reach out.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex-1 bg-background font-body selection:bg-primary/20 min-h-[85vh] overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-client-margin py-12 md:py-24">
        
        {/* Editorial Header */}
        <header className="mb-20 space-y-6">
            <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-primary" />
                <span className="editorial-kicker">Direct Liaison</span>
            </div>
            <h1 className="font-serif text-4xl md:text-7xl font-black text-on-surface uppercase italic tracking-tighter leading-none m-0">Contact Registry.</h1>
            <p className="max-w-xl text-on-surface-variant text-lg md:text-xl italic opacity-60 uppercase tracking-tight leading-relaxed">A specialized request or a fragment of feedback? Our digital concierge is at your absolute disposal.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            
            {/* Coordinates & Identity */}
            <aside className="lg:col-span-4 space-y-16">
                <section className="space-y-10">
                    <span className="editorial-kicker opacity-40">Coordinates</span>
                    <div className="space-y-8">
                        <div className="flex items-start gap-8 group cursor-default">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary shrink-0 transition-all duration-700 group-hover:bg-on-surface group-hover:text-background shadow-inner">
                                <MapPin className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-sans text-[10px] font-black text-on-surface uppercase tracking-[0.2em] opacity-40">Location</p>
                                <p className="font-serif text-xl md:text-2xl italic text-on-surface leading-tight uppercase tracking-tight">123 Gastronomic Blvd,<br/>Casablanca, Morocco</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-8 group cursor-default">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary shrink-0 transition-all duration-700 group-hover:bg-on-surface group-hover:text-background shadow-inner">
                                <Phone className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-sans text-[10px] font-black text-on-surface uppercase tracking-[0.2em] opacity-40">Assistance</p>
                                <p className="font-serif text-xl md:text-2xl italic text-on-surface leading-tight tabular-nums">+212 5 22 00 00 00</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-10">
                    <span className="editorial-kicker opacity-40">Temporal Window</span>
                    <div className="flex items-start gap-8">
                        <div className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <Clock className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 w-full">
                            <div className="flex justify-between items-end border-b border-outline-variant/10 pb-3">
                                <span className="font-sans text-xs font-black text-on-surface uppercase tracking-widest">Mon — Fri</span>
                                <span className="font-sans text-[10px] font-medium text-on-surface-variant opacity-60">12:00 — 23:30</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-outline-variant/10 pb-3">
                                <span className="font-sans text-xs font-black text-on-surface uppercase tracking-widest">Sat — Sun</span>
                                <span className="font-sans text-[10px] font-medium text-on-surface-variant opacity-60">11:00 — 00:30</span>
                            </div>
                        </div>
                    </div>
                </section>
            </aside>

            {/* Liaison Manifest Form */}
            <main className="lg:col-span-8">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="bg-surface-container border border-outline-variant rounded-[3rem] p-10 md:p-20 relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-highest text-primary border border-primary/20">
                                <Sparkles className="w-4 h-4" />
                                <span className="font-sans text-[9px] font-black tracking-[0.3em] uppercase">Protocol Active</span>
                            </div>
                            <h2 className="font-serif text-3xl md:text-5xl font-black text-on-surface italic leading-none m-0">The Manifest.</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2 opacity-40">Identity</label>
                                    <input 
                                        type="text" name="name" value={formData.name} onChange={handleChange} required
                                        className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/20"
                                        placeholder="NOM_COMPLET"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2 opacity-40">Coordinate</label>
                                    <input 
                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                        className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/20"
                                        placeholder="EMAIL@DOMAIN.COM"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2 opacity-40">Subject</label>
                                <select 
                                    name="subject" value={formData.subject} onChange={handleChange} required
                                    className="w-full h-16 bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">SELECT PARAMETER...</option>
                                    <option value="reservation">PRIVATE BOOKING</option>
                                    <option value="evenement">EVENT ARCHITECTURE</option>
                                    <option value="partenariat">PARTNERSHIP</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2 opacity-40">Message</label>
                                <textarea 
                                    name="message" value={formData.message} onChange={handleChange} required rows={4}
                                    className="w-full p-8 bg-surface-container-lowest border border-outline-variant rounded-[2rem] focus:border-primary outline-none transition-all resize-none font-body text-lg italic text-on-surface uppercase placeholder:text-on-surface-variant/20"
                                    placeholder="DETAIL THE NUANCES..."
                                />
                            </div>

                            <button 
                                type="submit" disabled={isSubmitting}
                                className="w-full py-6 bg-primary text-on-primary rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-6"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Transmit Liaison</span><Send className="w-5 h-5 text-on-primary/60" /></>}
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


