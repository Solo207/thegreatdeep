import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function New() {
  const { data } = authClient.useSession();
  const navigate = useNavigate();

  return (
    <div>
      <h1>Hi {data?.user.name}</h1>
      <button
        onClick={() =>
          authClient.signOut({
            fetchOptions: { onSuccess: () => navigate("/login") },
          })
        }
      >
        Sign out
      </button>
    </div>
  );
}