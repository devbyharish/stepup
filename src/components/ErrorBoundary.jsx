// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
          <pre className="mt-2 text-sm text-red-500">{String(this.state.error)}</pre>
          <p className="mt-3 text-sm text-slate-500">
            Try refreshing the page or checking the console for details.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
