import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        if (this.state.error?.message.startsWith('{')) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = parsed.error;
          }
        } else {
          errorMessage = this.state.error?.message || errorMessage;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }

      return (
        <div className="min-h-screen bg-wine-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-glass border border-glass-border p-8 rounded-3xl max-w-md w-full">
            <h2 className="text-2xl font-serif font-semibold text-gold-500 mb-4">Something went wrong</h2>
            <p className="text-ivory mb-6">{errorMessage}</p>
            <button
              className="bg-gold-500 text-wine-900 px-6 py-3 rounded-full font-medium"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
