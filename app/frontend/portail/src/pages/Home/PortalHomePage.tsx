import { Link } from 'react-router-dom'
import { useAuthStore } from '@shared/auth/useAuthStore'

const featureCards = [
  {
    title: 'Menu public',
    description: 'Consultez les plats, parcourez les categories et utilisez la recherche sans creer de compte.',
    badge: 'Public',
    accent: 'text-teal',
    border: 'border-teal/20',
    background: 'bg-teal/8',
    to: '/menu',
    cta: 'Voir le menu',
  },
  {
    title: 'Reservations',
    description: "Le module est visible depuis le portail, mais la creation et la gestion d'une reservation demandent un compte client.",
    badge: 'Compte requis',
    accent: 'text-amber',
    border: 'border-amber/20',
    background: 'bg-amber/8',
    to: '/reservations',
    cta: 'Voir les conditions',
  },
  {
    title: 'Programme de fidelite',
    description: 'Points, coupons et avantages restent lies au profil client connecte.',
    badge: 'Compte requis',
    accent: 'text-amber',
    border: 'border-amber/20',
    background: 'bg-amber/8',
    to: '/fidelite',
    cta: 'Comprendre l acces',
  },
]

export const PortalHomePage = () => {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:py-16">
      <div className="grid gap-8 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(38,70,83,0.98),rgba(26,50,59,0.96))] p-8 md:grid-cols-[1.15fr_0.85fr] md:p-10">
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal">Portail public-first</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
            Le menu reste ouvert. Les actions personnelles demandent un compte client.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-foreground-muted">
            C&apos;est le comportement que le portail expose maintenant: navigation publique pour decouvrir le restaurant, puis authentification uniquement quand une action touche une reservation ou la fidelite.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/menu"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white active:scale-[0.97]"
              style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
            >
              Explorer le menu
            </Link>
            <Link
              to={isAuthenticated ? '/reservations/new' : '/login'}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-foreground-muted active:scale-[0.97]"
              style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
            >
              {isAuthenticated ? 'Continuer ma reservation' : 'Connexion client'}
            </Link>
          </div>
        </div>
        <div className="grid gap-4 rounded-[24px] border border-white/8 bg-background/70 p-5">
          <div className="rounded-2xl border border-white/8 bg-surface-elevated p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground-muted">Session</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {isAuthenticated ? user?.username ?? 'Client connecte' : 'Visiteur anonyme'}
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              {isAuthenticated
                ? 'Votre compte peut acceder aux actions client protegees.'
                : 'Vous pouvez naviguer sans compte tant que vous restez sur les contenus publics.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-surface-elevated p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground-muted">Portee</p>
            <p className="mt-3 text-sm leading-6 text-foreground-muted">
              Recherche menu, navigation et consultation sont publiques. Reservation, fidelite et historique personnel restent connectes au compte client.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {featureCards.map((card) => (
          <article
            key={card.title}
            className={`rounded-[24px] border ${card.border} ${card.background} p-6`}
          >
            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${card.accent}`}>{card.badge}</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white">{card.title}</h2>
            <p className="mt-3 min-h-24 text-sm leading-6 text-foreground-muted">{card.description}</p>
            <Link
              to={card.to}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white active:scale-[0.97]"
              style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
            >
              {card.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
