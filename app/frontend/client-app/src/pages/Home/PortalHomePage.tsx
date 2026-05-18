import { motion, useScroll, useTransform } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ChevronRight, ArrowRight, Clock, Star, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

// Variants for orchestrating the bento grid reveal
const bentoContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const bentoItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 80,
      damping: 20,
    },
  },
};

export const PortalHomePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDF8F4] text-[#1C140E] overflow-x-hidden font-['Bodoni_Moda']">
      
      {/* --- HERO SECTION: BENTO-COMMAND --- */}
      <motion.section 
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative pt-24 pb-12 px-6 md:px-12 max-w-[1440px] mx-auto min-h-screen flex flex-col justify-center"
      >
        <motion.div 
          variants={bentoContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[minmax(200px,auto)]"
        >
          {/* Main Headline Block */}
          <motion.div 
            variants={bentoItemVariants}
            className="md:col-span-8 flex flex-col justify-end p-8 md:p-12 bg-[#F5E6D8] rounded-[3rem] border border-[#1C140E]/5 relative overflow-hidden"
          >
            <div className="relative z-10">
              <span className="font-['Bricolage_Grotesque'] font-black uppercase tracking-[0.3em] text-[10px] text-[#D1854E] mb-6 block">
                Expérience Gastronomique
              </span>
              <h1 className="font-['Libre_Caslon_Text'] text-5xl md:text-8xl leading-[0.9] tracking-tighter mb-8">
                L'Art de <span className="italic">Recevoir</span> 
                <span className="inline-block w-16 h-16 md:w-24 md:h-24 mx-4 rounded-full overflow-hidden align-middle border-4 border-[#FDF8F4] shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=400" 
                    alt="Punctuation" 
                    className="w-full h-full object-cover"
                  />
                </span>
                avec Distinction.
              </h1>
              <p className="max-w-md text-lg text-[#1C140E]/70 font-medium leading-relaxed">
                Tastify redéfinit l'excellence culinaire marocaine à travers une interface pensée pour les sens et orchestrée pour la précision.
              </p>
            </div>
            {/* Tactical background detail */}
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <div className="w-64 h-64 border-2 border-[#D1854E] rounded-full" />
            </div>
          </motion.div>

          {/* Tactical Status Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="md:col-span-4 bg-[#1C140E] text-[#FDF8F4] p-8 rounded-[3rem] flex flex-col justify-between group cursor-pointer overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div className="w-12 h-12 bg-[#D1854E] rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-bold">12:30</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#D1854E] font-black">Prochain Service</span>
                </div>
              </div>
              <h3 className="font-['Libre_Caslon_Text'] text-3xl mb-4">Prêt pour le Déjeuner</h3>
              <p className="text-sm text-[#FDF8F4]/60">9 tables disponibles pour le service de midi. Réservez votre expérience.</p>
            </div>
            <Link 
              to="/reservations" 
              className="relative z-10 flex items-center gap-2 font-['Bricolage_Grotesque'] font-bold text-sm text-[#D1854E] group-hover:gap-4 transition-all duration-300"
            >
              RÉSERVER MAINTENANT <ArrowRight className="w-4 h-4" />
            </Link>
            {/* Animated Glow */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#D1854E]/20 blur-[80px] rounded-full transition-transform group-hover:scale-150 duration-700" />
          </motion.div>

          {/* Cinematic Image Block */}
          <motion.div 
            variants={bentoItemVariants}
            className="md:col-span-4 rounded-[3rem] overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-[#1C140E]/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1585937421612-70a0f2455f75?auto=format&fit=crop&q=80&w=800" 
              alt="Plat Gastronomique" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute bottom-8 left-8 z-20">
                <span className="bg-[#D1854E] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Signature</span>
            </div>
          </motion.div>

          {/* Experience Specs Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="md:col-span-5 bg-white p-10 rounded-[3rem] border border-[#1C140E]/5 flex flex-col justify-center"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="text-4xl font-black text-[#D1854E]">4.9</div>
                <div>
                  <div className="flex gap-1 text-[#EAB308]">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <span className="text-xs font-bold text-[#1C140E]/40 uppercase tracking-widest">Avis Clients</span>
                </div>
              </div>
              <div className="h-[1px] bg-[#1C140E]/5 w-full" />
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <span className="block text-2xl font-black italic">850+</span>
                  <span className="text-[10px] font-bold text-[#1C140E]/40 uppercase">Réservations</span>
                </div>
                <div>
                  <span className="block text-2xl font-black italic">12</span>
                  <span className="text-[10px] font-bold text-[#1C140E]/40 uppercase">Chefs Étoilés</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location / Action Block */}
          <motion.div 
            variants={bentoItemVariants}
            className="md:col-span-3 bg-[#F5E6D8] p-8 rounded-[3rem] border border-[#1C140E]/5 flex flex-col items-center justify-center text-center group cursor-pointer"
          >
            <MapPin className="w-10 h-10 text-[#D1854E] mb-6 transition-transform group-hover:-translate-y-2 duration-300" />
            <h4 className="font-['Libre_Caslon_Text'] text-xl mb-2">Marrakech, Medina</h4>
            <p className="text-xs text-[#1C140E]/50 font-medium">L'élégance au cœur du patrimoine.</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* --- THE RITUAL: HORIZONTAL SCROLL TRACK --- */}
      <section className="py-24 bg-[#1C140E] text-[#FDF8F4]">
        <div className="px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <span className="font-['Bricolage_Grotesque'] font-black uppercase tracking-[0.3em] text-[10px] text-[#D1854E] mb-6 block">Le Protocole</span>
              <h2 className="font-['Libre_Caslon_Text'] text-4xl md:text-7xl leading-[0.9]">
                Le <span className="italic">Rituel</span> Tastify.
              </h2>
            </div>
            <p className="max-w-xs text-sm text-[#FDF8F4]/50 leading-relaxed pb-2">
              Une symphonie digitale en trois actes, conçue pour magnifier chaque instant de votre visite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                step: "01", 
                title: "L'Anticipation", 
                desc: "Réservez votre table en quelques clics via notre interface immersive.",
                icon: <Users className="w-6 h-6" />
              },
              { 
                step: "02", 
                title: "La Découverte", 
                desc: "Explorez notre carte interactive, orchestrée par une IA sensorielle.",
                icon: <ChevronRight className="w-6 h-6" />
              },
              { 
                step: "03", 
                title: "L'Apothéose", 
                desc: "Réglez votre note sans interruption grâce à notre tunnel de paiement invisible.",
                icon: <Star className="w-6 h-6" />
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative p-10 bg-white/5 rounded-[2.5rem] border border-white/10 group hover:bg-white/10 transition-colors"
              >
                <span className="text-5xl font-black text-[#D1854E]/20 absolute top-8 right-10 group-hover:text-[#D1854E]/40 transition-colors">
                  {item.step}
                </span>
                <div className="w-12 h-12 rounded-full border border-[#D1854E]/30 flex items-center justify-center text-[#D1854E] mb-12">
                  {item.icon}
                </div>
                <h3 className="font-['Libre_Caslon_Text'] text-3xl mb-6">{item.title}</h3>
                <p className="text-[#FDF8F4]/60 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MENU PREVIEW: ELEGANT CARDS --- */}
      <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">
        <div className="text-center mb-24">
          <span className="font-['Bricolage_Grotesque'] font-black uppercase tracking-[0.3em] text-[10px] text-[#D1854E] mb-6 block">Sélection Exclusive</span>
          <h2 className="font-['Libre_Caslon_Text'] text-4xl md:text-6xl mb-8">La Carte des Sens</h2>
          <Link 
            to="/menu" 
            className="inline-flex items-center gap-2 font-['Bricolage_Grotesque'] font-bold text-sm border-b-2 border-[#1C140E] pb-1 hover:border-[#D1854E] transition-colors"
          >
            VOIR TOUT LE MENU <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Tajine Royal", price: "280 MAD", tag: "Populaire", img: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=400" },
            { name: "Couscous d'Or", price: "320 MAD", tag: "Signature", img: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=401" },
            { name: "Pastilla Mer", price: "350 MAD", tag: "Chef's", img: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=402" },
            { name: "Thé Cérémonial", price: "45 MAD", tag: "Rituel", img: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=403" }
          ].map((item, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[2rem] overflow-hidden border border-[#1C140E]/5 group cursor-pointer"
            >
              <div className="h-64 overflow-hidden relative">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-6 left-6">
                  <span className="bg-[#D1854E] text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                    {item.tag}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h4 className="font-['Libre_Caslon_Text'] text-xl mb-2">{item.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-[#1C140E]/40 text-sm font-bold">{item.price}</span>
                  <div className="w-8 h-8 rounded-full border border-[#1C140E]/10 flex items-center justify-center transition-colors group-hover:bg-[#1C140E] group-hover:text-white">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <footer className="py-24 px-6 md:px-12 bg-[#F5E6D8] border-t border-[#1C140E]/5 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-['Libre_Caslon_Text'] text-4xl md:text-6xl mb-12">Prêt pour une expérience hors du temps ?</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link 
              to="/reservations" 
              className="w-full md:w-auto px-12 py-6 bg-[#1C140E] text-[#FDF8F4] rounded-full font-['Bricolage_Grotesque'] font-black text-sm uppercase tracking-widest hover:bg-[#D1854E] transition-all duration-300"
            >
              Réserver ma Table
            </Link>
            <Link 
              to="/menu" 
              className="w-full md:w-auto px-12 py-6 border-2 border-[#1C140E] text-[#1C140E] rounded-full font-['Bricolage_Grotesque'] font-black text-sm uppercase tracking-widest hover:bg-[#1C140E] hover:text-white transition-all duration-300"
            >
              Explorer le Menu
            </Link>
          </div>
          <p className="mt-16 text-[10px] font-bold text-[#1C140E]/30 uppercase tracking-[0.4em]">
            © 2026 TASTIFY PFA • L'ART DE RECEVOIR
          </p>
        </div>
      </footer>
    </div>
  );
};
