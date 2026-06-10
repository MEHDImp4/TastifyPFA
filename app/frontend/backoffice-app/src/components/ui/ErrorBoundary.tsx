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
        <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center font-body">
          <div className="w-16 h-16 rounded-lg bg-error/5 border border-error/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-error" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-on-background uppercase tracking-widest mb-2">Erreur Critique</h1>
          <p className="text-xs text-on-surface-variant mb-8 max-w-sm font-bold uppercase tracking-widest">
            Actualisez la page. Si le problème persiste, contactez le support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary h-12 px-8 gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
