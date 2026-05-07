import React, { useEffect, useState } from 'react';
import { Plat, fetchRecommendations } from '../../api/menu';

interface RecommendationListProps {
  platId: number;
}

const RecommendationList: React.FC<RecommendationListProps> = ({ platId }) => {
  const [recommendations, setRecommendations] = useState<Plat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    fetchRecommendations(platId)
      .then((data) => {
        if (isMounted) {
          setRecommendations(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [platId]);

  if (loading) {
    return (
      <div data-testid="loading-recommendations" className="animate-pulse space-y-4 py-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
        <div className="flex space-x-4">
          <div className="h-24 w-24 bg-gray-200 rounded"></div>
          <div className="h-24 w-24 bg-gray-200 rounded"></div>
          <div className="h-24 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Recommandé pour vous</h3>
      <div className="flex overflow-x-auto space-x-4 pb-4">
        {recommendations.map((plat) => (
          <div key={plat.id} className="min-w-[200px] flex-shrink-0 bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            <div className="font-medium text-gray-900 truncate">{plat.nom}</div>
            <div className="text-sm text-gray-500 mt-1 line-clamp-2">{plat.description}</div>
            <div className="mt-3 font-semibold text-primary">{plat.prix} €</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationList;
