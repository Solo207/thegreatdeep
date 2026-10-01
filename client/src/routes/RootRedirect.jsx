import { Navigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function RootRedirect() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return null;
  return <Navigate to={session ? "/new" : "/login"} replace />;
}