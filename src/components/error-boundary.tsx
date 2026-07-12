import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render-time errors (e.g. Convex "Unauthorized" when the Clerk JWT
 * is missing/invalid) so the admin shows a readable message instead of a
 * white page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin error boundary:", error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const unauthorized = error.message.includes("Unauthorized");
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">
          {unauthorized ? "Not authorized" : "Something went wrong"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {unauthorized
            ? "Your session isn't authorized to load admin data. Make sure you're signed in with an admin account (and that the Clerk ↔ Convex JWT template is configured), then try again."
            : error.message}
        </p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }
}
