import { Link } from 'react-router-dom'

interface NoticeAction {
  label: string
  to: string
}

interface ProtectedFeatureNoticeProps {
  eyebrow: string
  title: string
  description: string
  primaryAction: NoticeAction
  secondaryAction?: NoticeAction
}

export const ProtectedFeatureNotice = ({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
}: ProtectedFeatureNoticeProps) => (
  <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl items-center px-6 py-12">
    <div className="grid w-full gap-6 rounded-[28px] border border-white/10 bg-surface p-8 md:grid-cols-[1.2fr_0.8fr] md:p-10">
      <div className="space-y-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber">{eyebrow}</p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-white md:text-5xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-foreground-muted">
          {description}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to={primaryAction.to}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white active:scale-[0.97]"
            style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
          >
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              to={secondaryAction.to}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-foreground-muted active:scale-[0.97]"
              style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 rounded-[24px] border border-white/8 bg-background/70 p-5">
        <div className="rounded-2xl border border-white/8 bg-surface-elevated p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Acces libre</p>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            Consultation du menu, recherche des plats et navigation generale du portail.
          </p>
        </div>
        <div className="rounded-2xl border border-amber/20 bg-amber/8 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber">Compte requis</p>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            Reservation, suivi personnel, fidelite, coupons et toutes les donnees attachees au client.
          </p>
        </div>
      </div>
    </div>
  </section>
)
