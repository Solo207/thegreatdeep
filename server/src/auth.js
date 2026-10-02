import { betterAuth } from "better-auth";
import { pool } from "./db.js";

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL].filter(Boolean),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // sessions last 7 days
    updateAge: 60 * 60 * 24,     // extend once a day while the user is active
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // prompt: "select_account", // uncomment to always show the account picker
    },
    // later: github: { ... }
  },
});