import { ChefHat } from 'lucide-react';
import logo from '@shared/assets/logo.svg';
import { useAuthStore } from '@shared/auth/useAuthStore';

export const KdsPage = () => {
  const { user } = useAuthStore();

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="w-full max-w-[440px] animate-enter">
        <div className="bg-surface rounded-3xl border border-white/5 p-10 shadow-2xl text-center">
          <div className="w-60 h-60 bg-orange/10 rounded-2xl flex items-center justify-center mb-8 border border-orange/20 mx-auto relative">
            <div className="absolute inset-0 bg-orange/10 blur-xl rounded-full" />
            <img src={logo} alt="Tastify" className="w-48 relative z-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange/10 border border-orange/20 text-[11px] font-bold text-orange uppercase tracking-[0.15em] mb-6">
            <ChefHat size={14} />
            {user?.role}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Cuisine (KDS)</h1>
          <p className="text-foreground-muted">Chef <span className="text-orange font-semibold">{user?.username}</span> en poste</p>
        </div>
      </div>
    </section>
  );
};
