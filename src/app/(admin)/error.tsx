"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Next redacts Server Component error messages to an opaque digest in
// production, so branching on error.message (e.g. "UNAUTHORISED") never
// matches where it matters — state the likely cause plainly instead.
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto mt-24 max-w-md space-y-4 text-center">
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        Your session may have expired, or something failed unexpectedly.
      </p>
      <div className="flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/admin/login">Sign in again</Link>
        </Button>
      </div>
    </div>
  );
}
