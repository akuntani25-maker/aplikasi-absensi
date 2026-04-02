import { Redirect } from "expo-router";

/**
 * Root index — redirects to the auth flow on first load.
 * Auth state logic (checking stored token) lives in the auth store;
 * the redirect target can be changed once auth is wired up.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
