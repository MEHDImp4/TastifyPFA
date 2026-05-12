import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, ChefHat, Sparkles } from 'lucide-react';
import { menuApi } from '../../api/menu';
import type { Plat } from '../../api/menu';

export const PortalHomePage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Plat[]>([]);

  useEffect(() => {
    menuApi.getTopRecommendations()
      .then(res => setRecommendations(res.data))
      .catch(err => console.error(err));
  }, []);

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

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="flex items-center gap-2 text-teal font-bold uppercase tracking-widest text-xs mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Suggéré pour vous</span>
                </div>
                <h2 className="text-4xl font-bold text-dark tracking-tight">Recommandations</h2>
              </div>
              <Link to="/menu" className="text-dark font-bold border-b-2 border-teal pb-1 hover:text-teal transition-colors inline-flex items-center gap-2">
                Voir toute la carte <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.map(plat => (
                <Link to={`/menu?plat=${plat.id}`} key={plat.id} className="group bg-gray-50 rounded-[2rem] p-4 border border-gray-100 transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:border-teal/30">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative bg-white">
                    {plat.image ? (
                      <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 font-bold text-3xl uppercase">
                        {plat.nom.charAt(0)}
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl font-bold text-sm text-dark shadow-sm">
                      {plat.prix} DH
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-dark mb-2 group-hover:text-teal transition-colors line-clamp-1">{plat.nom}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal" /> {plat.temps_preparation} min</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
