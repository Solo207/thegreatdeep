import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function PublicOnlyRoute() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return null;
  return session ? <Navigate to="/new" replace /> : <Outlet />;
}