import React, { useEffect, useState } from 'react'
import { Plat, fetchPlats } from '../../api/menu'
import RecommendationList from '../../components/menu/RecommendationList'

export const MenuPage: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([])
  const [selectedPlatId, setSelectedPlatId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchPlats()
      .then((data) => {
        setPlats(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch plats', err)
        setLoading(false)
      })
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredPlats = plats.filter((plat) => {
    if (!normalizedQuery) {
      return true
    }

    return [plat.nom, plat.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  })

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Chargement du menu...</div>
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="grid gap-6 rounded-[28px] border border-white/10 bg-surface p-8 md:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Acces libre</p>
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Notre menu</h1>
          <p className="max-w-2xl text-base leading-7 text-foreground-muted">
            Parcourez les plats et lancez une recherche sans compte. Les modules comme la reservation et la fidelite restent accessibles apres connexion.
          </p>
        </div>
        <label className="flex flex-col gap-3 rounded-[24px] border border-white/8 bg-background/70 p-5 text-sm font-medium text-foreground-muted">
          Recherche publique
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Chercher un plat ou une description"
            className="min-h-11 rounded-lg border border-white/10 bg-surface-elevated px-4 py-3 text-white outline-none"
          />
          <span className="text-xs uppercase tracking-[0.16em] text-foreground-muted/80">
            {filteredPlats.length} resultat{filteredPlats.length > 1 ? 's' : ''}
          </span>
        </label>
      </section>

      {selectedPlatId && (
        <div className="rounded-[24px] border border-teal/15 bg-surface p-6">
          <button
            onClick={() => setSelectedPlatId(null)}
            className="mb-4 text-sm font-medium text-teal hover:underline"
          >
            Retour au menu complet
          </button>
          <RecommendationList platId={selectedPlatId} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlats.map((plat) => (
          <div
            key={plat.id}
            className={`cursor-pointer rounded-[24px] border p-5 ${selectedPlatId === plat.id ? 'border-teal bg-surface-elevated' : 'border-white/10 bg-surface'} active:scale-[0.97]`}
            onClick={() => setSelectedPlatId(plat.id)}
            style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
          >
            <div className="mb-1 text-lg font-semibold text-white">{plat.nom}</div>
            <div className="min-h-[3rem] text-sm text-foreground-muted">{plat.description}</div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-bold text-teal">{plat.prix} MAD</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-foreground-muted">
                Reco
              </span>
            </div>
          </div>
        ))}
      </div>
      {filteredPlats.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-surface p-6 text-sm text-foreground-muted">
          Aucun plat ne correspond a votre recherche.
        </div>
      ) : null}
    </div>
  )
}
