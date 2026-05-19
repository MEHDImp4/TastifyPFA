import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Utensils, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Star,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import type { Plat } from '../../api/menu';
import { Skeleton } from '../../components/ui/Skeleton';

export const PortalHomePage = () => {
  const [topDishes, setTopDishes] = useState<Plat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopDishes = async () => {
      try {
        const res = await menuApi.getTopRecommendations();
        setTopDishes(res.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch top dishes', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopDishes();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#8d4e1c]/10 selection:text-[#8d4e1c]">
      
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-serif italic leading-[1.1] tracking-tight text-left">
              Une expérience marocaine raffinée, réservée en quelques secondes.
            </h1>
            <p className="text-xl text-[#787774] leading-relaxed max-w-lg">
              Découvrez nos plats signatures, réservez votre table instantanément, et profitez d’un parcours fluide jusqu’au paiement.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <Link 
                to="/reservations" 
                className="w-full sm:w-auto px-10 py-5 bg-[#111111] text-white rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#333333] transition-all active:scale-95 shadow-xl shadow-black/10"
              >
                Réserver une table <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/menu" 
                className="w-full sm:w-auto px-10 py-5 bg-white border border-[#EAEAEA] text-[#111111] rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#F7F6F3] transition-all active:scale-95"
              >
                Explorer le Menu
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] md:aspect-square rounded-[2rem] overflow-hidden border-8 border-[#F7F6F3] shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=1200" 
                alt="Ambience Tastify" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-2xl border border-[#EAEAEA] hidden md:block max-w-[200px]">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Confirmé</span>
                </div>
                <p className="text-xs font-bold leading-tight">Table pour 2 personnes ce soir à 20h30.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-[#F7F6F3] py-8 border-y border-[#EAEAEA]">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex justify-between items-center gap-12 min-w-max md:min-w-0 md:justify-around">
            {[
              "Cuisine marocaine raffinée",
              "Réservation instantanée",
              "Menu interactif",
              "Paiement sans attente"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-[#787774]">
                <CheckCircle2 className="w-4 h-4 text-[#8d4e1c]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Pourquoi Tastify</span>
            <h2 className="text-4xl md:text-6xl font-serif italic tracking-tight text-center">Une sérénité totale.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { 
              title: "Réservez sans appel ni attente", 
              desc: "Oubliez les attentes téléphoniques. Votre table est sécurisée en 3 clics, avec confirmation immédiate.",
              icon: <Calendar className="w-6 h-6" />
            },
            { 
              title: "Découvrez le menu avant d'arriver", 
              desc: "Explorez notre carte interactive haute définition. Choisissez vos envies et préparez votre dégustation.",
              icon: <Utensils className="w-6 h-6" />
            },
            { 
              title: "Payez sans interrompre la soirée", 
              desc: "Évitez le geste de l'addition. Réglez directement depuis votre mobile quand vous êtes prêt à partir.",
              icon: <Clock className="w-6 h-6" />
            }
          ].map((benefit, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="p-10 bg-white border border-[#EAEAEA] rounded-[2rem] space-y-6 transition-all hover:shadow-xl hover:shadow-black/[0.02]"
            >
              <div className="w-14 h-14 bg-[#F7F6F3] rounded-2xl flex items-center justify-center text-[#8d4e1c]">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold leading-tight">{benefit.title}</h3>
              <p className="text-[#787774] text-sm leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Menu Preview Section */}
      <section className="py-32 bg-[#F7F6F3] border-y border-[#EAEAEA] px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="space-y-4 text-center md:text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">La Sélection</span>
                <h2 className="text-4xl md:text-6xl font-serif italic tracking-tight">Nos signatures marocaines</h2>
            </div>
            <Link 
                to="/menu" 
                className="text-xs font-black uppercase tracking-widest border-b-2 border-[#111111] pb-2 hover:text-[#8d4e1c] hover:border-[#8d4e1c] transition-all"
            >
                Voir le menu complet
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
                [1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-[2rem] overflow-hidden border border-[#EAEAEA] h-[400px]">
                        <Skeleton className="w-full h-64" />
                        <div className="p-8 space-y-4">
                            <Skeleton className="w-3/4 h-6" />
                            <Skeleton className="w-full h-4" />
                        </div>
                    </div>
                ))
            ) : topDishes.length > 0 ? (
                topDishes.map((dish, i) => (
                    <motion.div 
                        key={dish.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -8 }}
                        className="bg-white rounded-[2rem] overflow-hidden border border-[#EAEAEA] group shadow-sm transition-all hover:shadow-2xl"
                    >
                        <div className="h-64 overflow-hidden relative bg-gray-100">
                            {dish.image ? (
                                <img src={dish.image} alt={dish.nom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#EAEAEA]">
                                    <Utensils className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg">
                                <span className="text-[10px] font-black">{dish.prix} MAD</span>
                            </div>
                        </div>
                        <div className="p-8 space-y-3">
                            <h4 className="text-xl font-bold">{dish.nom}</h4>
                            <p className="text-[#787774] text-xs leading-relaxed line-clamp-2">{dish.description}</p>
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="col-span-full text-center py-12">
                    <p className="text-[#787774] font-serif italic">Découvrez notre menu complet pour voir nos créations.</p>
                </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-24 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Le Protocole</span>
            <h2 className="text-4xl md:text-6xl font-serif italic tracking-tight">Comment ça marche ?</h2>
        </div>

        <div className="space-y-12">
            {[
                { step: "01", title: "Choisissez votre créneau", desc: "Sélectionnez la date et l'heure idéale pour votre visite en quelques secondes." },
                { step: "02", title: "Explorez le menu", desc: "Parcourez notre carte et pré-visualisez vos plats préférés avant d'arriver." },
                { step: "03", title: "Profitez, puis payez simplement", desc: "Vivez l'instant présent. Réglez votre note d'un geste via l'application." }
            ].map((item, i) => (
                <div key={i} className="flex gap-8 items-start group">
                    <span className="text-4xl md:text-6xl font-serif italic text-[#EAEAEA] group-hover:text-[#8d4e1c] transition-colors">{item.step}</span>
                    <div className="pt-2 md:pt-4 border-l border-[#EAEAEA] pl-8 space-y-2 text-left">
                        <h4 className="text-xl font-bold">{item.title}</h4>
                        <p className="text-[#787774] text-sm max-w-md">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-20 text-center">
            <Link 
                to="/reservations" 
                className="inline-flex items-center gap-3 px-12 py-5 bg-[#111111] text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#333333] transition-all active:scale-95 shadow-xl shadow-black/10"
            >
                Réserver maintenant <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-6 text-center lg:text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Avis Clients</span>
                <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight leading-tight">Ils ont vécu l'expérience Tastify.</h2>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { name: "Sarah B.", text: "Le parcours est d'une fluidité incroyable. J'ai pu réserver ma table et payer sans jamais sortir mon portefeuille.", rating: 5 },
                    { name: "Karim L.", text: "La qualité du menu interactif m'a permis de choisir mes plats à l'avance. Une expérience haut de gamme.", rating: 5 }
                ].map((testimonial, i) => (
                    <div key={i} className="p-10 bg-[#F7F6F3] rounded-[2rem] border border-[#EAEAEA] space-y-6 relative overflow-hidden text-left">
                        <div className="flex gap-1">
                            {[...Array(testimonial.rating)].map((_, j) => <Star key={j} className="w-3 h-3 fill-[#8d4e1c] text-[#8d4e1c]" />)}
                        </div>
                        <p className="text-lg font-serif italic leading-relaxed text-[#111111]">"{testimonial.text}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EAEAEA] flex items-center justify-center text-[10px] font-black">{testimonial.name[0]}</div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{testimonial.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-[#111111] rounded-[3rem] p-12 md:p-24 text-center space-y-12 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-6">
                <h2 className="text-4xl md:text-6xl font-serif italic text-white tracking-tight leading-tight">
                    Prêt à réserver votre table ?
                </h2>
                <p className="text-[#787774] text-lg max-w-xl mx-auto">
                    Choisissez votre créneau, découvrez le menu, et profitez d’une expérience fluide dès votre arrivée.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                    <Link 
                        to="/reservations" 
                        className="w-full sm:w-auto px-10 py-5 bg-[#8d4e1c] text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#a65d24] transition-all active:scale-95"
                    >
                        Réserver une table
                    </Link>
                    <Link 
                        to="/menu" 
                        className="w-full sm:w-auto px-10 py-5 bg-transparent border border-white/20 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95"
                    >
                        Explorer le Menu
                    </Link>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8d4e1c]/10 blur-[120px] rounded-full pointer-events-none" />
        </div>
      </section>

      {/* Upgraded Footer */}
      <footer className="pt-24 pb-12 px-6 border-t border-[#EAEAEA]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 text-left">
          <div className="space-y-8">
            <Link to="/" className="text-2xl font-black tracking-tighter">TASTIFY</Link>
            <p className="text-sm text-[#787774] leading-relaxed max-w-xs">
                Une hospitalité marocaine d'exception mariée à une orchestration numérique discrète.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]">Navigation</h4>
            <ul className="space-y-4">
                <li><Link to="/menu" className="text-sm text-[#787774] hover:text-[#111111] transition-colors">Le Menu</Link></li>
                <li><Link to="/reservations" className="text-sm text-[#787774] hover:text-[#111111] transition-colors">Réservations</Link></li>
                <li><Link to="/login" className="text-sm text-[#787774] hover:text-[#111111] transition-colors">Connexion Client</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]">Horaires</h4>
            <ul className="space-y-4 text-sm text-[#787774]">
                <li className="flex justify-between"><span>Lun - Ven</span> <span>12:00 - 23:00</span></li>
                <li className="flex justify-between"><span>Sam - Dim</span> <span>11:30 - 00:00</span></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]">Contact</h4>
            <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-[#787774]"><MapPin className="w-4 h-4" /> 123 Avenue Hassan II, Casablanca</li>
                <li className="flex items-center gap-3 text-sm text-[#787774]"><Phone className="w-4 h-4" /> +212 5 22 00 00 00</li>
                <li className="flex items-center gap-3 text-sm text-[#787774]"><Mail className="w-4 h-4" /> contact@tastify.com</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-12 border-t border-[#EAEAEA] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#787774]">© 2026 TASTIFY — TOUS DROITS RÉSERVÉS.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#787774]">
            <a href="#" className="hover:text-[#111111] transition-colors">Mentions Légales</a>
            <a href="#" className="hover:text-[#111111] transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
