import React from 'react';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Back-office render crash', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
          <div className="w-full max-w-2xl rounded-3xl border border-error/20 bg-surface p-8 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-error/80">
              Incident Frontend
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              Le back-office a rencontré une erreur de rendu.
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              L&apos;écran a été protégé pour éviter le blocage silencieux. Recharge la page ou reconnecte-toi.
            </p>

            {isDev && (
              <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/5 bg-black/20 p-4 text-xs text-error">
                {this.state.error.stack ?? this.state.error.message}
              </pre>
            )}

            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 rounded-2xl bg-error px-5 py-3 text-sm font-bold text-white transition hover:bg-error/90"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
