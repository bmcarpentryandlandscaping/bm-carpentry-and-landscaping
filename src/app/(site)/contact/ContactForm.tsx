"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { HoverFillButton } from "@/components/HoverFillButton";
import { brand } from "@/lib/brand";
import type { EnquiryResponse } from "@/app/api/enquiry/route";

/**
 * The enquiry form. Client-side only because it needs the pending/sent state —
 * the markup, classes and `--i` stagger indices are carried over verbatim from
 * the server-rendered version it replaces.
 *
 * Submits with a plain `fetch` to /api/enquiry rather than a Server Action: a
 * `next-action` POST against this prerendered route 500s in production before
 * any of our code runs. See the route handler's own note.
 *
 * Validation is Zod inside that route, not here. The endpoint is public, so the
 * server has to check regardless; doing it there only means one set of rules to
 * keep in step instead of two.
 */

const PROJECT_TYPES = ["Landscape", "Carpentry", "Pool", "Stonework"];

export function ContactForm() {
  const [state, setState] = useState<EnquiryResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setState(null);

    // FormData -> plain object, so the endpoint takes JSON and the browser sends
    // a simple same-origin POST with nothing multipart to parse.
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as EnquiryResponse;
      if (data.ok) setSent(true);
      else setState(data);
    } catch {
      // Offline, DNS, a dropped connection — the send never reached us.
      setState({
        ok: false,
        message: `Sorry — that didn't go through. Please email ${brand.email} or call us directly.`,
      });
    } finally {
      setPending(false);
    }
  }

  if (sent) {
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
      onSubmit={onSubmit}
      noValidate
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
        error={state?.fieldErrors?.["first-name"]}
      />
      <Field
        id="last-name"
        label="Last Name"
        autoComplete="family-name"
        index={1}
        error={state?.fieldErrors?.["last-name"]}
      />
      <Field
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        index={2}
        error={state?.fieldErrors?.email}
      />
      <Field
        id="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        index={3}
        error={state?.fieldErrors?.phone}
      />

      <SelectField
        id="project-type"
        label="Project type"
        options={PROJECT_TYPES}
        index={4}
      />

      <Field
        id="address"
        label="Address"
        autoComplete="street-address"
        index={5}
        span
        error={state?.fieldErrors?.address}
      />
      <Field
        id="heard"
        label="How did you hear about us?"
        index={6}
        span
        error={state?.fieldErrors?.heard}
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

        {state && !state.ok && state.message && (
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

/* ── Select, built to the form's own styling ──────────────────── */
/**
 * A native <select> was here. Its closed state could be styled, but the open
 * list is drawn by the operating system and cannot be — so on a phone it
 * dropped a grey system menu into the middle of an editorial form.
 *
 * This renders the list itself: same underline, same eyebrow label, same
 * chevron, with the site's easing on open. A hidden input carries the value so
 * the surrounding FormData read is unchanged.
 *
 * Keyboard and screen-reader behaviour follows the combobox pattern — focus
 * stays on the trigger and `aria-activedescendant` points at the highlighted
 * option, which is what lets Up/Down move through the list without the focus
 * ring jumping around.
 */
function SelectField({
  id,
  label,
  options,
  index = 0,
  placeholder = "Select an option",
}: {
  id: string;
  label: string;
  options: string[];
  index?: number;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // pointerdown, not click: closing on click would fire after the option's own
    // handler and fight it.
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // A dropdown pinned under a field has to close when the page moves, or it
    // detaches and floats over unrelated content.
    const onScroll = () => setOpen(false);

    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  const choose = (option: string) => {
    setValue(option);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(Math.max(0, options.indexOf(value)));
          return;
        }
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((i) => (i + step + options.length) % options.length);
        return;
      }
      case "Home":
        if (open) { e.preventDefault(); setActive(0); }
        return;
      case "End":
        if (open) { e.preventDefault(); setActive(options.length - 1); }
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(options[active] ?? "");
        else { setOpen(true); setActive(Math.max(0, options.indexOf(value))); }
        return;
      case "Escape":
        if (open) { e.preventDefault(); setOpen(false); }
        return;
      case "Tab":
        // Let focus leave, but never leave the panel hanging open behind it.
        setOpen(false);
        return;
    }
  };

  return (
    <div className="select-field sm:col-span-2" style={{ ["--i" as string]: index }} ref={rootRef}>
      <label id={`${id}-label`} htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </label>

      <div className="field-line relative mt-3">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={open ? `${id}-option-${active}` : undefined}
          onClick={() => {
            setOpen((o) => !o);
            setActive(Math.max(0, options.indexOf(value)));
          }}
          onKeyDown={onKeyDown}
          className={`w-full border-b border-border bg-transparent pb-2 pr-7 text-left text-base tracking-[-0.005em] outline-none md:text-[0.95rem] ${
            value ? "" : "text-muted-foreground"
          }`}
        >
          {value || placeholder}
        </button>

        <svg
          aria-hidden
          viewBox="0 0 12 8"
          data-open={open}
          className="select-chevron h-2 w-3 text-muted-foreground"
        >
          <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>

      <div
        id={`${id}-listbox`}
        role="listbox"
        aria-labelledby={`${id}-label`}
        data-open={open}
        className="select-panel"
      >
        {options.map((option, i) => (
          <button
            key={option}
            id={`${id}-option-${i}`}
            type="button"
            role="option"
            aria-selected={value === option}
            data-active={i === active}
            data-selected={value === option}
            tabIndex={-1}
            onPointerEnter={() => setActive(i)}
            onClick={() => choose(option)}
            className="select-option"
          >
            {option}
          </button>
        ))}
      </div>

      {/* What the form actually submits. */}
      <input type="hidden" name={id} value={value} />
    </div>
  );
}
