import { brand } from "./brand.ts";
import type { Enquiry } from "./schemas.ts";

/**
 * Renders the enquiry notification sent to `brand.email`.
 *
 * Pure — no network, no env, no Next imports — so the whole template is
 * unit-testable and the route handler stays about delivery.
 *
 * ## Why it looks like 2005 in here
 *
 * Email clients are not browsers. Gmail strips `<style>` blocks in some
 * contexts, Outlook renders through Word's engine, and neither flexbox nor grid
 * can be relied on. So: nested tables, inline styles, no external CSS, no web
 * fonts, and hex colours — `oklch()`, which the site's palette is authored in,
 * renders as nothing at all in most clients. The hex values below are converted
 * from those same tokens, not eyeballed, so the email stays in step with the
 * site's palette.
 *
 * ## Escaping
 *
 * Every value here is typed by a stranger into a public form. The plain-text
 * body this replaced had nothing to escape into; HTML does. `esc()` is applied
 * to every interpolation without exception — including inside `href`s, where an
 * unescaped quote would break out of the attribute.
 */

/** Converted from the `oklch()` tokens in globals.css. */
const C = {
  paper: "#f8f6f4", // --background
  ink: "#201c1b", // --foreground
  muted: "#edebe8", // --muted
  mutedInk: "#5f5651", // --muted-foreground
  rule: "#cac3bc", // --border
  accent: "#c27d3b", // --accent
  onDark: "#f3f1ef", // --surface-deep-foreground
} as const;

/** No web fonts in email — this is the closest neutral grotesque stack. */
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type RenderedEmail = { subject: string; text: string; html: string };

export function renderEnquiryEmail(
  enquiry: Enquiry,
  receivedAt: Date = new Date(),
): RenderedEmail {
  const name = [enquiry.firstName, enquiry.lastName].filter(Boolean).join(" ");
  const when = formatSydney(receivedAt);

  const subject = `New enquiry — ${name}${enquiry.projectType ? ` · ${enquiry.projectType}` : ""}`;

  /* ── Plain-text part ────────────────────────────────────────────
     Not a leftover: it is the fallback for clients with HTML disabled, and it
     is what keeps the message out of spam filters that distrust HTML-only mail. */
  const text = [
    `New enquiry — ${name}`,
    when ? `Received ${when}` : null,
    "",
    `Name:     ${name}`,
    `Email:    ${enquiry.email}`,
    enquiry.phone && `Phone:    ${enquiry.phone}`,
    enquiry.projectType && `Project:  ${enquiry.projectType}`,
    enquiry.address && `Address:  ${enquiry.address}`,
    enquiry.heard && `Heard by: ${enquiry.heard}`,
    "",
    enquiry.message || "(no message)",
    "",
    `Reply straight to this email to answer ${enquiry.firstName}.`,
    "— Sent from the bmcl.au contact form",
  ]
    .filter(Boolean)
    .join("\n");

  const rows = [
    detailRow("Phone", enquiry.phone, `tel:${telHref(enquiry.phone)}`),
    detailRow("Project type", enquiry.projectType),
    detailRow("Address", enquiry.address),
    detailRow("Heard about us", enquiry.heard),
  ]
    .filter(Boolean)
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Without these, clients with a dark theme invert the palette and the
     wordmark disappears into its own background. -->
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.muted};font-family:${FONT};">
<!-- Preheader: the grey line of text the inbox shows beside the subject. Hidden
     in the message body itself, hence the zero-size span. -->
<span style="display:none;font-size:1px;color:${C.muted};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
${esc(name)}${enquiry.projectType ? ` · ${esc(enquiry.projectType)}` : ""} — ${esc(enquiry.email)}
</span>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.muted};padding:24px 12px;">
<tr><td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${C.paper};border-radius:14px;overflow:hidden;">

  <tr>
    <td style="background:${C.ink};padding:26px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:${FONT};font-size:19px;font-weight:600;letter-spacing:-0.02em;color:${C.onDark};">
            BM<span style="color:${C.accent};">.</span>
          </td>
          <td align="right" style="font-family:${FONT};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.rule};">
            New enquiry
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 8px 32px;">
      <p style="margin:0 0 6px 0;font-family:${FONT};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.mutedInk};">
        From
      </p>
      <p style="margin:0;font-family:${FONT};font-size:26px;line-height:1.2;letter-spacing:-0.02em;color:${C.ink};">
        ${esc(name)}
      </p>
      <p style="margin:8px 0 0 0;font-family:${FONT};font-size:15px;line-height:1.5;">
        <a href="mailto:${esc(enquiry.email)}" style="color:${C.accent};text-decoration:none;">${esc(enquiry.email)}</a>
      </p>
    </td>
  </tr>

  ${
    rows
      ? `<tr>
    <td style="padding:22px 32px 0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
    </td>
  </tr>`
      : ""
  }

  <tr>
    <td style="padding:22px 32px 0 32px;">
      <p style="margin:0 0 8px 0;font-family:${FONT};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.mutedInk};">
        Message
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.muted};border-left:3px solid ${C.accent};border-radius:0 8px 8px 0;">
        <tr>
          <td style="padding:16px 18px;font-family:${FONT};font-size:15px;line-height:1.65;color:${C.ink};white-space:pre-wrap;">
${enquiry.message ? esc(enquiry.message) : `<span style="color:${C.mutedInk};">No message left.</span>`}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:26px 32px 32px 32px;">
      <!-- Reply-To is the sender, so the normal Reply button works too. This is
           just the obvious thing to press on a phone. -->
      <a href="mailto:${esc(enquiry.email)}?subject=${encodeURIComponent(`Re: ${subject}`)}"
         style="display:inline-block;background:${C.ink};color:${C.onDark};font-family:${FONT};font-size:13px;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;padding:13px 26px;border-radius:999px;">
        Reply to ${esc(enquiry.firstName)}
      </a>
    </td>
  </tr>

  <tr>
    <td style="padding:18px 32px;border-top:1px solid ${C.rule};">
      <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.mutedInk};">
        Sent from the contact form on ${esc(brand.fullName)}&rsquo;s website${when ? ` · ${esc(when)}` : ""}
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}

/** One label/value line in the details block; omitted entirely when empty. */
function detailRow(label: string, value: string, href?: string): string {
  if (!value) return "";
  const shown = href
    ? `<a href="${esc(href)}" style="color:${C.ink};text-decoration:none;border-bottom:1px solid ${C.rule};">${esc(value)}</a>`
    : esc(value);

  return `<tr>
    <td width="40%" style="padding:9px 0;border-bottom:1px solid ${C.rule};font-family:${FONT};font-size:13px;color:${C.mutedInk};vertical-align:top;">
      ${esc(label)}
    </td>
    <td style="padding:9px 0;border-bottom:1px solid ${C.rule};font-family:${FONT};font-size:15px;color:${C.ink};vertical-align:top;">
      ${shown}
    </td>
  </tr>`;
}

/**
 * HTML-escapes a value for either text content or a quoted attribute.
 *
 * Both quote styles are escaped, not just double: an attribute written with
 * single quotes elsewhere in this file would otherwise be escapable.
 */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips a phone number down to what `tel:` accepts, keeping a leading +. */
function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? `+${digits.slice(1).replace(/\+/g, "")}` : digits;
}

/**
 * The client reads this in Sydney, so the timestamp is in Sydney time.
 *
 * Falls back to an empty string rather than throwing: a missing line in the
 * footer is a far better outcome than an enquiry that never sends because a
 * runtime shipped without timezone data.
 */
function formatSydney(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "";
  }
}
