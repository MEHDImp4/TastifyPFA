import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center font-body">
          <div className="w-16 h-16 rounded-full bg-error/5 border border-error/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-error" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-on-background mb-2">Une erreur est survenue</h1>
          <p className="text-sm text-on-surface-variant mb-8 max-w-sm">
            Veuillez actualiser la page. Si le problème persiste, contactez notre équipe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-8 h-12 gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Actualiser la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
