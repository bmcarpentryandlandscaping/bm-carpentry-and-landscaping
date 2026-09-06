"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type LoginState } from "../_actions/auth";

function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="w-full max-w-sm">
      <h1 className="admin-title">Sign in</h1>
      <p className="admin-lede mt-3">Change the photos and words on your site.</p>
      <div className="admin-rule mt-6 mb-8" />

      <input type="hidden" name="next" value={params.get("next") ?? "/admin"} />

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            Email
          </Label>
          <Input id="email" name="email" type="email" autoComplete="username" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-muted-foreground">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-7 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      {/* There is no self-service reset by design — one account, no recovery
          email flow to attack. Say who to ask instead of leaving a dead end. */}
      <p className="mt-6 text-sm text-muted-foreground">
        Forgotten your password? Ask your developer to set a new one.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
