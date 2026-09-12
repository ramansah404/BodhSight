import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-surface border border-rose-500/20 rounded-3xl shadow-sm text-center">
          <AlertTriangle className="text-rose-500 mb-4" size={32} />
          <h2 className="text-lg font-bold text-primary mb-2">Something went wrong</h2>
          <p className="text-secondary text-sm mb-4">
            {this.state.error?.message || "An unexpected error occurred in this component."}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
