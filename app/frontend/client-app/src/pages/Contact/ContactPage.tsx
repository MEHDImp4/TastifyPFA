import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  ArrowRight,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Message transmitted successfully. Our concierge will respond shortly.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex-1 bg-background selection:bg-primary/10 selection:text-primary min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 py-16 lg:py-32">
        
        {/* Editorial Header */}
        <header className="mb-20 space-y-6">
            <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-primary" />
                <span className="editorial-kicker">Direct Liaison</span>
            </div>
            <h1 className="text-display-lg text-4xl md:text-7xl lg:text-8xl text-on-surface leading-none">
                Contact <br /><span className="italic font-light opacity-60">Registry.</span>
            </h1>
            <p className="max-w-xl text-on-surface-variant text-xl font-body leading-relaxed italic opacity-80">
                A question, a specialized request, or a fragment of feedback? Our digital concierge is at your absolute disposal.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            
            {/* Contact Information & Coordinates */}
            <aside className="lg:col-span-4 space-y-16">
                <section className="space-y-10">
                    <span className="editorial-kicker opacity-40">Coordinates</span>
                    <div className="space-y-8">
                        <div className="flex items-start gap-8 group cursor-default">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shrink-0 border border-on-surface/5 group-hover:bg-on-surface group-hover:text-background transition-all duration-700 shadow-inner">
                                <MapPin className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] opacity-40">Location</p>
                                <p className="text-2xl font-serif italic text-on-surface leading-tight">123 Gastronomic Blvd, <br/>Casablanca, Morocco</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-8 group cursor-default">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shrink-0 border border-on-surface/5 group-hover:bg-on-surface group-hover:text-background transition-all duration-700 shadow-inner">
                                <Phone className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] opacity-40">Assistance</p>
                                <p className="text-2xl font-serif italic text-on-surface leading-tight">+212 5 22 00 00 00</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-8 group cursor-default">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shrink-0 border border-on-surface/5 group-hover:bg-on-surface group-hover:text-background transition-all duration-700 shadow-inner">
                                <Mail className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] opacity-40">Private Email</p>
                                <p className="text-2xl font-serif italic text-on-surface leading-tight">liaison@tastify.ma</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-10">
                    <span className="editorial-kicker opacity-40">Temporal Window</span>
                    <div className="flex items-start gap-8">
                        <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shrink-0 border border-on-surface/5 shadow-inner">
                            <Clock className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 w-full">
                            <div className="flex justify-between items-end border-b border-on-surface/5 pb-3">
                                <span className="text-sm font-black text-on-surface tracking-tight">Mon — Fri</span>
                                <span className="text-[11px] font-medium text-on-surface-variant opacity-60">12:00 — 23:30</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-on-surface/5 pb-3">
                                <span className="text-sm font-black text-on-surface tracking-tight">Sat — Sun</span>
                                <span className="text-[11px] font-medium text-on-surface-variant opacity-60">11:00 — 00:30</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <span className="editorial-kicker opacity-40">Identity Links</span>
                    <div className="flex gap-4">
                        {[Share2, Globe, MessageCircle].map((Icon, i) => (
                            <button key={i} className="w-12 h-12 rounded-2xl border border-on-surface/10 flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-700 hover:-translate-y-1 cinematic-shadow">
                                <Icon className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                        ))}
                    </div>
                </section>
            </aside>

            {/* Contact Liaison Form */}
            <main className="lg:col-span-8">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="editorial-card p-10 lg:p-20 relative overflow-hidden cinematic-shadow"
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] -mr-48 -mt-48" />
                    
                    <div className="relative z-10 space-y-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container text-primary border border-primary/10">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-ui-label-bold text-[9px] tracking-[0.3em]">Communication Protocol Active</span>
                            </div>
                            <h2 className="text-display-lg text-4xl lg:text-6xl text-on-surface leading-none italic">Liaison Manifest.</h2>
                            <p className="text-lg text-on-surface-variant font-body opacity-60 italic max-w-lg">Please populate the registry parameters with absolute precision.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="editorial-kicker text-[8px] opacity-40 ml-2">Full Identity</label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-8 py-5 bg-surface-container border border-on-surface/5 rounded-2xl text-on-surface font-black text-sm focus:bg-background focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all cinematic-shadow placeholder:text-on-surface-variant/20 uppercase"
                                        placeholder="JOHN DOE"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="editorial-kicker text-[8px] opacity-40 ml-2">Digital Coordinate</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-8 py-5 bg-surface-container border border-on-surface/5 rounded-2xl text-on-surface font-black text-sm focus:bg-background focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all cinematic-shadow placeholder:text-on-surface-variant/20 uppercase"
                                        placeholder="JOHN@EXAMPLE.COM"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="editorial-kicker text-[8px] opacity-40 ml-2">Subject of Inquiry</label>
                                <div className="relative group">
                                    <select 
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-8 py-5 bg-surface-container border border-on-surface/5 rounded-2xl text-on-surface font-black text-sm focus:bg-background focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all appearance-none cursor-pointer cinematic-shadow"
                                    >
                                        <option value="">SELECT PARAMETER...</option>
                                        <option value="reservation">SPECIAL RESERVATION REQUEST</option>
                                        <option value="evenement">EVENT ARCHITECTURE</option>
                                        <option value="partenariat">PARTNERSHIP PROTOCOL</option>
                                        <option value="autre">OTHER LIAISON</option>
                                    </select>
                                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:rotate-90 transition-transform" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="editorial-kicker text-[8px] opacity-40 ml-2">The Manifestation</label>
                                <textarea 
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full p-8 bg-surface-container border border-on-surface/5 rounded-[2rem] focus:bg-background focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all resize-none font-body text-on-surface text-lg italic cinematic-shadow placeholder:text-on-surface-variant/20"
                                    placeholder="DETAIL THE NUANCES OF YOUR INQUIRY..."
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-6 bg-on-surface text-background text-[12px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-6 transition-all hover:bg-primary cinematic-shadow active:scale-95 disabled:opacity-50 rounded-2xl"
                            >
                                {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" strokeWidth={2.5} /> : (
                                    <>
                                        <span>Transmit Liaison</span>
                                        <ArrowRight className="w-6 h-6 text-primary" strokeWidth={2.5} />
                                    </>
                                )}
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

