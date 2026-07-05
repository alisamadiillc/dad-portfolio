import { SignIn, useAuth } from "@clerk/react";
import { Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null; // brief auth load; swap for a spinner if desired

  if (!isSignedIn) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <SignIn
          forceRedirectUrl="/admin"
          appearance={{ elements: { footerAction: { display: "none" } } }}
        />
      </div>
    );
  }

  return <Outlet />;
}
