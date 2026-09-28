"use server";

import { headers } from "next/headers";
import { brand } from "@/lib/brand";
import { enquiryRate } from "@/lib/ratelimit";
import { Enquiry } from "@/lib/schemas";

/**
 * Sends a contact-form enquiry to the inbox in `brand.email`.
 *
 * Delivery is Resend's REST API over plain `fetch` rather than their SDK — the
 * same choice `content.ts` makes for PostgREST. One HTTPS call needs no client
 * library, and a Worker bundle is better off without one.
 *
 * There is deliberately no database write: an enquiry that fails to send is
 * reported to the sender on the spot (see FAILURE_NOTE) so they can fall back to
 * the phone numbers and mailto: link sitting directly beside the form, rather
 * than being told it worked while it sits unread in a table nobody opens.
 */

/** Resend's send endpoint. */
const RESEND_URL = "https://api.resend.com/emails";

/**
 * The envelope sender — a label on mail this site generates, not a mailbox.
 *
 * It is deliberately NOT `brand.email`: that address is where enquiries land
 * (a Google Workspace inbox, per the domain's MX), and nothing here ever sends
 * *from* it or touches it. Every message replies to the customer anyway, via
 * `reply_to` below.
 *
 * It must sit on a domain verified for sending in Resend, because a From we
 * have not proven we own is what gets a message spam-filtered or rejected. No
 * mailbox needs to exist behind it.
 */
const FROM = process.env.ENQUIRY_FROM ?? `BM Website <website@bmcl.au>`;

/** What the visitor sees when we could not hand the message to Resend. */
const FAILURE_NOTE =
  `Sorry — we couldn't send that. Please email ${brand.email} ` +
  `or call us directly and we'll pick it up straight away.`;

export type EnquiryState = {
  status: "idle" | "sent" | "error";
  /** Form-level message. Shown as-is, so it must stay free of internal detail. */
  message?: string;
  /** Keyed by the form control's `name`, so the field can render its own error. */
  fieldErrors?: Record<string, string>;
};

export const INITIAL_ENQUIRY_STATE: EnquiryState = { status: "idle" };

/** FormData control names -> schema keys. The markup's ids are kebab-case. */
const FIELDS = {
  firstName: "first-name",
  lastName: "last-name",
  email: "email",
  phone: "phone",
  projectType: "project-type",
  address: "address",
  heard: "heard",
  message: "message",
} as const;

export async function sendEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  // Honeypot. A field hidden from people but not from the bots that fill in
  // every input they find. Answer exactly as a success would look: telling a
  // bot which signal caught it is how it learns to avoid the signal.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "sent" };
  }

  const parsed = Enquiry.safeParse(
    Object.fromEntries(
      Object.entries(FIELDS).map(([schemaKey, control]) => [
        schemaKey,
        String(formData.get(control) ?? ""),
      ]),
    ),
  );

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const schemaKey = String(issue.path[0] ?? "") as keyof typeof FIELDS;
      const control: string | undefined = FIELDS[schemaKey];
      // First issue per field wins — a field shows one message, not a stack.
      if (control && !fieldErrors[control]) fieldErrors[control] = issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const enquiry = parsed.data;

  // Per-IP throttle over the KV namespace. Fails open: a cache outage must not
  // stop a real customer getting in touch.
  const head = await headers();
  const ip =
    head.get("cf-connecting-ip") ??
    head.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rate = await enquiryRate(ip);
  if (!rate.allowed) {
    return {
      status: "error",
      message: `You've sent a few already — please give it a little while, or call us on ${brand.phones[0]?.number}.`,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[enquiry] RESEND_API_KEY is not set — enquiry not sent");
    return { status: "error", message: FAILURE_NOTE };
  }

  const name = [enquiry.firstName, enquiry.lastName].filter(Boolean).join(" ");

  // Plain text only, no HTML body. Every value here is attacker-controlled, and
  // text has no markup to escape into — there is no injection to get wrong.
  const lines = [
    `Name:     ${name}`,
    `Email:    ${enquiry.email}`,
    enquiry.phone && `Phone:    ${enquiry.phone}`,
    enquiry.projectType && `Project:  ${enquiry.projectType}`,
    enquiry.address && `Address:  ${enquiry.address}`,
    enquiry.heard && `Heard by: ${enquiry.heard}`,
    "",
    enquiry.message || "(no message)",
    "",
    "— Sent from the bmcl.au contact form",
  ].filter(Boolean);

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [brand.email],
        // Hitting Reply in the inbox answers the customer, not our own sender.
        reply_to: enquiry.email,
        subject: `New enquiry — ${name}${enquiry.projectType ? ` · ${enquiry.projectType}` : ""}`,
        text: lines.join("\n"),
      }),
    });

    if (!res.ok) {
      // Log the provider's reason for us; show the visitor the fallback only.
      console.error(`[enquiry] Resend responded ${res.status}: ${await res.text()}`);
      return { status: "error", message: FAILURE_NOTE };
    }
  } catch (err) {
    console.error("[enquiry] send failed:", err);
    return { status: "error", message: FAILURE_NOTE };
  }

  return { status: "sent" };
}
