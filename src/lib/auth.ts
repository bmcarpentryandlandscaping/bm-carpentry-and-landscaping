import { createClient } from "@/lib/supabase/server";

/**
 * THE authorisation boundary. Middleware only redirects; a server action is a
 * public HTTP endpoint and can be called without ever passing through it, so
 * every action must start here.
 *
 * Uses getUser(), not getSession(): getSession() reads the cookie without
 * verifying it against the auth server, so it can be forged.
 */
export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("UNAUTHORISED");
  return { supabase, user };
}
