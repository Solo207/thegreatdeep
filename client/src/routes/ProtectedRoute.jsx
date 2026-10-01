import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return null;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}