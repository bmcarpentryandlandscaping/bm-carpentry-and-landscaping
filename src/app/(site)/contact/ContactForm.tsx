"use client";

import { useActionState } from "react";
import { HoverFillButton } from "@/components/HoverFillButton";
import { brand } from "@/lib/brand";
import {
  INITIAL_ENQUIRY_STATE,
  sendEnquiry,
  type EnquiryState,
} from "./_actions/enquiry";

/**
 * The enquiry form. Client-side only because it needs the pending/sent state —
 * the markup, classes and `--i` stagger indices are carried over verbatim from
 * the server-rendered version it replaces.
 *
 * Validation is Zod inside the action, not here. A server action is a public
 * endpoint, so the server has to check regardless; doing it there only means one
 * set of rules to keep in step instead of two.
 */

const PROJECT_TYPES = ["Landscape", "Carpentry", "Pool", "Stonework"];

export function ContactForm() {
  const [state, formAction, pending] = useActionState<EnquiryState, FormData>(
    sendEnquiry,
    INITIAL_ENQUIRY_STATE,
  );

  if (state.status === "sent") {
    return (
      <div className="flex min-h-[18rem] flex-col justify-center gap-4">
        <p className="font-display text-[1.8rem] leading-tight tracking-[-0.02em] md:text-[2.4rem]">
          Thanks — that&rsquo;s with us.
        </p>
        <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
          We read every enquiry and usually come back within a business day. If
          it&rsquo;s urgent, call {brand.phones[0]?.name} on{" "}
          <a href={brand.phones[0]?.href} className="arrow-link">
            {brand.phones[0]?.number}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="contact-stagger grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2"
    >
      {/* Honeypot: off-screen rather than hidden, since some bots skip
          display:none. Not a label a person can reach — tabIndex -1. */}
      <div aria-hidden className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <Field
        id="first-name"
        label="First Name"
        autoComplete="given-name"
        index={0}
        error={state.fieldErrors?.["first-name"]}
      />
      <Field
        id="last-name"
        label="Last Name"
        autoComplete="family-name"
        index={1}
        error={state.fieldErrors?.["last-name"]}
      />
      <Field
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        index={2}
        error={state.fieldErrors?.email}
      />
      <Field
        id="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        index={3}
        error={state.fieldErrors?.phone}
      />

      <SelectField
        id="project-type"
        label="Select an option"
        options={PROJECT_TYPES}
        index={4}
      />

      <Field
        id="address"
        label="Address"
        autoComplete="street-address"
        index={5}
        span
        error={state.fieldErrors?.address}
      />
      <Field
        id="heard"
        label="How did you hear about us?"
        index={6}
        span
        error={state.fieldErrors?.heard}
      />

      <div className="field-line relative sm:col-span-2" style={{ ["--i" as string]: 7 }}>
        <label htmlFor="message" className="eyebrow text-muted-foreground">
          Want to tell us more about the project?
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="peer mt-3 w-full resize-none border-b border-border bg-transparent pb-2 text-base leading-[1.5] tracking-[-0.005em] outline-none md:text-[0.95rem]"
        />
      </div>

      <div className="pt-2 sm:col-span-2" style={{ ["--i" as string]: 8 }}>
        <HoverFillButton
          type="submit"
          disabled={pending}
          className="rounded-full border border-foreground px-8 py-3.5 text-[0.78rem] uppercase tracking-[0.06em] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send Enquiry"} <span aria-hidden>→</span>
        </HoverFillButton>

        {state.status === "error" && state.message && (
          /* aria-live so a screen reader hears the failure; without it the only
             signal is a visual change well below the button that was pressed. */
          <p role="status" aria-live="polite" className="mt-4 text-sm text-destructive">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

/* ── Underlined floating-label field ──────────────────────────── */
function Field({
  id,
  label,
  type = "text",
  autoComplete,
  index = 0,
  span = false,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  index?: number;
  span?: boolean;
  error?: string;
}) {
  return (
    <div
      className={`field-line relative ${span ? "sm:col-span-2" : ""}`}
      style={{ ["--i" as string]: index }}
    >
      <label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`peer mt-3 w-full border-b bg-transparent pb-2 text-base tracking-[-0.005em] outline-none md:text-[0.95rem] ${
          error ? "border-destructive" : "border-border"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Underlined select with custom chevron ─────────────────────── */
function SelectField({
  id,
  label,
  options,
  index = 0,
}: {
  id: string;
  label: string;
  options: string[];
  index?: number;
}) {
  return (
    <div className="field-line relative sm:col-span-2" style={{ ["--i" as string]: index }}>
      <label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </label>
      <div className="relative mt-3">
        <select
          id={id}
          name={id}
          defaultValue=""
          className="peer w-full appearance-none border-b border-border bg-transparent pb-2 pr-7 text-base tracking-[-0.005em] outline-none md:text-[0.95rem]"
        >
          <option value="" disabled>
            Select an option
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 8"
          className="pointer-events-none absolute right-0 top-1/2 h-2 w-3 -translate-y-1/2 text-muted-foreground"
        >
          <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    </div>
  );
}
