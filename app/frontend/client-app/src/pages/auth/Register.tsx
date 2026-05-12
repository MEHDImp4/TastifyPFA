import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, UserPlus, Mail, Lock, ShieldCheck, Sparkles, ChevronLeft } from 'lucide-react';

import logoPublic from '../../assets/logo-public.svg';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.post('/users/register/', { username, email, password, role: 'CLIENT' });
      const loginRes = await api.post('/users/login/', { username, password });
      const { access, role, username: resUsername } = loginRes.data;
      setAuth(access, role, resUsername);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l’inscription. Le pseudo ou l’email est peut-être déjà utilisé.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row-reverse min-h-[calc(100dvh-6rem)] animate-in fade-in duration-1000 bg-background">
      {/* Visual Identity Section - Desktop Only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-on-surface p-20 items-end">
        <div className="absolute inset-0 z-0">
            <img 
                src="https://picsum.photos/seed/tastify_register/1200/1600" 
                className="w-full h-full object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-2000" 
                alt="Atmosphere" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface via-on-surface/20 to-transparent" />
        </div>
        
        <div className="relative z-10 space-y-8 max-w-xl text-right ml-auto">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] border border-primary/20 backdrop-blur-md">
                <span>The Culinary Network</span>
                <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-7xl font-display-accent italic text-white leading-none tracking-tighter">
                Create your <br/>
                <span className="text-primary opacity-80">Profile.</span>
            </h2>
            <p className="text-xl text-white/50 leading-relaxed font-sans font-medium">
                Join our exclusive dining community and unlock AI-powered culinary insights tailored to your unique palette.
            </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative overflow-hidden">
        {/* Mobile Logo & Return */}
        <div className="absolute top-10 left-10 lg:left-auto lg:right-20 right-10 flex items-center justify-between lg:flex-row-reverse z-20 w-full lg:w-auto px-10 md:px-0">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>
            <img src={logoPublic} alt="Tastify" className="h-8 w-auto lg:hidden" />
        </div>

        <div className="w-full max-w-md space-y-12 relative z-10">
            <div className="text-center lg:text-left space-y-4">
                <div className="hidden lg:flex items-center justify-center lg:justify-start gap-4 mb-8">
                    <img src={logoPublic} alt="Tastify" className="h-10 w-auto" />
                </div>
                <h1 className="text-5xl font-display-accent italic text-on-surface leading-none tracking-tight">New Beginnings.</h1>
                <p className="text-on-surface-variant font-medium opacity-60">Initialize your architectural member record.</p>
            </div>

            {error && (
                <div className="p-5 rounded-2xl bg-error-container/20 border border-error/20 text-error text-sm text-center font-bold animate-in shake duration-500">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                    <div className="flex flex-col gap-2.5 group">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 ml-1 transition-opacity group-focus-within:opacity-100">Identity Tag</label>
                        <div className="relative">
                            <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-20 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-14 pr-6 py-4.5 bg-surface-container-low border border-surface-container-high rounded-2xl text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all"
                                placeholder="Username"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 group">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 ml-1 transition-opacity group-focus-within:opacity-100">Communication Link</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-20 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-14 pr-6 py-4.5 bg-surface-container-low border border-surface-container-high rounded-2xl text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all"
                                placeholder="Email address"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 group">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 ml-1 transition-opacity group-focus-within:opacity-100">Pass-phrase</label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-20 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-14 pr-6 py-4.5 bg-surface-container-low border border-surface-container-high rounded-2xl text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full group relative flex items-center justify-center gap-4 py-5 mt-4 bg-primary text-white rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30 active:scale-95 disabled:opacity-50 overflow-hidden shadow-xl shadow-primary/10"
                >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                    <>
                        <span className="relative z-10">Initialize Account</span>
                        <ArrowRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-1" />
                    </>
                    )}
                </button>
            </form>
            
            <div className="pt-10 border-t border-surface-container-high text-center">
                <p className="text-sm font-medium text-on-surface-variant">
                    Already part of the network?{' '}
                    <Link to="/login" className="font-black uppercase text-xs tracking-widest text-primary hover:underline ml-2">
                        Sign In
                    </Link>
                </p>
            </div>

            <div className="flex items-center justify-center gap-3 opacity-30">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">End-to-End Cryptographic Security Active</span>
            </div>
        </div>
      </div>
    </div>
  );
};
