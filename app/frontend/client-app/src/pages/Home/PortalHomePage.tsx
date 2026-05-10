import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, ChefHat } from 'lucide-react';

export const PortalHomePage: React.FC = () => {
  return (
    <div className="w-full">
      {/* Hero Section - Asymmetric layout */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(42,157,143,0.05),_transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 text-teal text-sm font-semibold mb-6">
              <Star className="w-4 h-4 fill-current" />
              <span>L'expérience Tastify</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-sans tracking-tighter leading-[1.1] mb-6 text-[#18181B]">
              La tradition, <br/>
              <span className="text-dark">servie avec</span> <br/>
              <span className="text-orange">précision.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Découvrez une fusion parfaite entre la richesse de la gastronomie marocaine et une expérience de service moderne et sans friction.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                to="/reservations"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-teal text-white rounded-xl font-medium transition-transform duration-200 hover:brightness-110 active:scale-[0.98] shadow-sm shadow-teal/20"
              >
                Réserver une table
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-dark border border-gray-200 rounded-xl font-medium transition-colors hover:bg-gray-50 active:scale-[0.98]"
              >
                Voir le menu
              </Link>
            </div>
          </div>
          
          <div className="relative z-10 hidden md:block">
            <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
              <img 
                src="https://picsum.photos/seed/tastify/800/1000" 
                alt="Plat traditionnel" 
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 text-white">
                <p className="font-bold text-xl mb-2">Signature du Chef</p>
                <p className="text-white/80 text-sm">Tajine aux pruneaux et amandes grillées</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Values Section */}
      <section className="py-24 bg-[#f9fafb]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange/10 text-orange flex items-center justify-center">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-dark">Cuisine Authentique</h3>
              <p className="text-gray-500 leading-relaxed">
                Des recettes transmises de génération en génération, préparées avec des ingrédients frais du marché local.
              </p>
            </div>

            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-dark">Service Fluide</h3>
              <p className="text-gray-500 leading-relaxed">
                Grâce à notre système KDS en cuisine, vos plats arrivent chauds et au moment parfait.
              </p>
            </div>

            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber/10 text-amber flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-dark">Expérience Premium</h3>
              <p className="text-gray-500 leading-relaxed">
                De la réservation en ligne au paiement par QR code à table, tout est pensé pour votre confort.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
