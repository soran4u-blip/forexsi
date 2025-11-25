import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React Component Tree:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
          <div className="bg-slate-800 border border-red-500/50 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="bg-red-500/10 p-6 border-b border-red-500/20 flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Application Crash Detected</h1>
                <p className="text-red-400 text-sm">Please provide the error details below to support.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Error Message</label>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 font-mono text-sm text-red-300 break-words">
                  {this.state.error?.toString()}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Stack Trace</label>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 font-mono text-xs text-slate-400 overflow-auto max-h-64 whitespace-pre">
                  {this.state.errorInfo?.componentStack || this.state.error?.stack}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
                >
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}