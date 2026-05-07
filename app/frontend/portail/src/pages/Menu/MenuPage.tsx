import React, { useEffect, useState } from 'react';
import { Plat, fetchPlats } from '../../api/menu';
import RecommendationList from '../../components/menu/RecommendationList';

export const MenuPage: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [selectedPlatId, setSelectedPlatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlats()
      .then((data) => {
        setPlats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch plats", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Chargement du menu...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Notre Menu</h1>
      
      {selectedPlatId && (
        <div className="mb-12 bg-teal-50/50 p-6 rounded-xl border border-teal-100">
          <button 
            onClick={() => setSelectedPlatId(null)}
            className="text-sm text-teal font-medium mb-4 hover:underline"
          >
            ← Retour au menu complet
          </button>
          <RecommendationList platId={selectedPlatId} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plats.map((plat) => (
          <div 
            key={plat.id} 
            className={`border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${selectedPlatId === plat.id ? 'ring-2 ring-teal border-transparent shadow-md' : 'border-gray-200 bg-white'}`}
            onClick={() => setSelectedPlatId(plat.id)}
          >
            <div className="font-semibold text-lg text-gray-900 mb-1">{plat.nom}</div>
            <div className="text-gray-500 text-sm mb-3 line-clamp-3 min-h-[3rem]">{plat.description}</div>
            <div className="font-bold text-teal">{plat.prix} €</div>
          </div>
        ))}
      </div>
    </div>
  );
};
