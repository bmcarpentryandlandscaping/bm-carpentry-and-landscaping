"use client";

import { Button } from "@/components/ui/button";

type Props = {
  dirty: boolean;
  valid: boolean;
  saving: boolean;
  onDiscard: () => void;
};

/**
 * The bench edge: a sticky footer that always says where the form stands.
 *
 * Save is disabled until the form is BOTH dirty and valid — so the client
 * cannot save a form they have not changed, and cannot save one the action
 * would reject anyway. The status line is the only place that explains why a
 * disabled Save is disabled, so it has to name the actual reason.
 */
export function SaveBar({ dirty, valid, saving, onDiscard }: Props) {
  const status = saving
    ? "Saving…"
    : !dirty
      ? "Everything here is saved"
      : valid
        ? "You have changes to save"
        : "Fix the fields marked in red first";

  return (
    <div className="admin-bench">
      <p className="admin-pip flex-1" data-live={dirty && valid && !saving}>
        {status}
      </p>
      <Button type="button" variant="ghost" onClick={onDiscard} disabled={!dirty || saving}>
        Discard
      </Button>
      <Button type="submit" disabled={!dirty || !valid || saving}>
        Save
      </Button>
    </div>
  );
}
