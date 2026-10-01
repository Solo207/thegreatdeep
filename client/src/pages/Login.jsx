import { authClient } from "../lib/auth-client";

export default function Login() {
  return (
    <button
      onClick={() =>
        authClient.signIn.social({ provider: "google", callbackURL: "/new" })
      }
    >
      Continue with Google
    </button>
  );
}