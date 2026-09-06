"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginRate, loginRateClear } from "@/lib/ratelimit";

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) return { error: "Enter your email and password." };

  const h = await headers();
  // cf-connecting-ip FIRST and always: Cloudflare sets it itself and overwrites any
  // client-supplied value, so it cannot be spoofed. x-forwarded-for IS client-settable
  // and is only reached off-Worker (local dev), where throttling is not a control anyway.
  // Never reverse this order — it would make the throttle bypassable with one header.
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rate = await loginRate(ip);
  if (!rate.allowed) {
    const mins = Math.ceil(rate.retryAfterMs / 60000);
    return { error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // One message for a wrong password and for an unknown address — a different
  // message for each tells an attacker which addresses exist.
  if (error) return { error: "That email and password did not match." };

  await loginRateClear(ip);
  // Only ever redirect to a path under /admin. A prefix test alone admits
  // "/admin/../../evil" (browser-normalised before the request is even sent)
  // and same-origin lookalikes like "/adminfoo" — so anchor to a real path
  // boundary and reject ".." and CR/LF (header injection) outright.
  const safeNext =
    /^\/admin(?:[/?#]|$)/.test(next) && !/[\r\n]/.test(next) && !next.includes("..")
      ? next
      : "/admin";
  redirect(safeNext);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
