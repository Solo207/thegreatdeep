import { Component } from "react";

// If one message fails to draw, show a small note instead of blanking the whole page.
export default class MessageBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("A message failed to render:", error);
  }

  render() {
    if (this.state.failed) {
      return <p className="px-1 text-sm text-zinc-500">This message couldn't be displayed.</p>;
    }
    return this.props.children;
  }
}