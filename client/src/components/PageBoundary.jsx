import { Component } from "react";

// If a page crashes, this shows what happened instead of a white screen.
// The sidebar stays usable, and Try again re-runs the page.
export default class PageBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("This page crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60dvh] flex-1 flex-col items-center justify-center gap-4 px-4 text-center text-zinc-100">
        <p className="text-zinc-300">Something went wrong on this page.</p>
        <pre className="max-w-full overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-left text-xs text-red-300">
          {String(this.state.error?.message ?? this.state.error)}
        </pre>
        <div className="flex gap-2">
          <button
            onClick={() => this.setState({ error: null })}
            className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:bg-zinc-800"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:bg-zinc-800"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}