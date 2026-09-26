import { Component, ReactNode } from 'react';

interface State {
  error: Error | null;
}

// Last line of defence: a rendering bug shows a way out instead of a blank page.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled UI error:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <p className="text-sm uppercase tracking-[0.3em] text-muted mb-3">Something broke</p>
        <h1 className="text-4xl text-foreground mb-4">The projector jammed.</h1>
        <p className="text-muted max-w-md mb-8">An unexpected error occurred. Reloading usually fixes it.</p>
        <button
          onClick={() => window.location.assign('/home')}
          className="px-6 py-3 rounded-full bg-primary text-background font-semibold hover:bg-primary-hover transition-colors"
        >
          Reload MovieMuse
        </button>
      </div>
    );
  }
}
