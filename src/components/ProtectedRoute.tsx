import { useAuth } from "@clerk/react";
import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null; // brief auth load; swap for a spinner if desired
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  return <Outlet />;
}
