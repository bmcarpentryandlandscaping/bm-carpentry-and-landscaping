import { NextResponse, type NextRequest } from "next/server";
import { brand } from "@/lib/brand";
import { renderEnquiryEmail } from "@/lib/enquiry-email";
import { enquiryRate } from "@/lib/ratelimit";
import { Enquiry } from "@/lib/schemas";

/**
 * Contact-form enquiries — a plain POST endpoint, deliberately NOT a Server
 * Action.
 *
 * The first version was an action, and it returned 500 on every submission in
 * production. `/contact` is prerendered (`x-nextjs-cache: HIT`,
 * `x-nextjs-prerender: 1` came back on the POST itself), and resolving a
 * `next-action` id against a cached prerender of that route failed before any of
 * our code ran — which is why an empty form and a filled one failed the same
 * way. A route handler has no action id to resolve and no cache entry to collide
 * with: it is an ordinary POST the Worker always executes.
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

/** This route sends mail; it must never be answered from a cache. */
export const dynamic = "force-dynamic";

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

/** The JSON the form reads back. Mirrors what the old action returned. */
export type EnquiryResponse = {
  ok: boolean;
  /** Form-level message. Shown as-is, so it must stay free of internal detail. */
  message?: string;
  /** Keyed by the form control's `name`, so the field can render its own error. */
  fieldErrors?: Record<string, string>;
};

/** Posted JSON keys -> schema keys. The markup's ids are kebab-case. */
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

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, message: FAILURE_NOTE }, 400);
  }

  // Honeypot. A field hidden from people but not from the bots that fill in
  // every input they find. Answer exactly as a success would look: telling a
  // bot which signal caught it is how it learns to avoid the signal.
  if (String(body.company ?? "").trim() !== "") {
    return json({ ok: true }, 200);
  }

  const parsed = Enquiry.safeParse(
    Object.fromEntries(
      Object.entries(FIELDS).map(([schemaKey, control]) => [
        schemaKey,
        String(body[control] ?? ""),
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
    return json(
      { ok: false, message: "Please check the highlighted fields.", fieldErrors },
      400,
    );
  }

  const enquiry = parsed.data;

  // Per-IP throttle over the KV namespace. Fails open: a cache outage must not
  // stop a real customer getting in touch.
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rate = await enquiryRate(ip);
  if (!rate.allowed) {
    return json(
      {
        ok: false,
        message: `You've sent a few already — please give it a little while, or call us on ${brand.phones[0]?.number}.`,
      },
      429,
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[enquiry] RESEND_API_KEY is not set — enquiry not sent");
    return json({ ok: false, message: FAILURE_NOTE }, 500);
  }

  // Both parts are sent: the HTML template, and the plain-text fallback for
  // clients with HTML off. Escaping of the visitor's input happens in there.
  const { subject, text, html } = renderEnquiryEmail(enquiry);

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
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      // Log the provider's reason for us; show the visitor the fallback only.
      console.error(`[enquiry] Resend responded ${res.status}: ${await res.text()}`);
      return json({ ok: false, message: FAILURE_NOTE }, 502);
    }
  } catch (err) {
    console.error("[enquiry] send failed:", err);
    return json({ ok: false, message: FAILURE_NOTE }, 502);
  }

  return json({ ok: true }, 200);
}

function json(payload: EnquiryResponse, status: number) {
  return NextResponse.json(payload, { status });
}
