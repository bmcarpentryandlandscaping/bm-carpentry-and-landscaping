import { test } from "node:test";
import assert from "node:assert/strict";
import { renderEnquiryEmail, esc } from "../src/lib/enquiry-email.ts";
import type { Enquiry } from "../src/lib/schemas.ts";

const base: Enquiry = {
  firstName: "Sam",
  lastName: "Rivers",
  email: "sam@example.com",
  phone: "+61 400 000 000",
  projectType: "Carpentry",
  address: "12 Mosman Rd",
  heard: "Instagram",
  message: "After a quote for a hardwood deck.",
};

const at = new Date("2026-03-02T04:30:00Z");

test("the subject names the sender and the project type", () => {
  assert.equal(renderEnquiryEmail(base, at).subject, "New enquiry — Sam Rivers · Carpentry");
});

test("both parts carry every field the visitor filled in", () => {
  const { text, html } = renderEnquiryEmail(base, at);
  for (const value of [base.email, base.phone, base.projectType, base.address, base.heard]) {
    assert.ok(text.includes(value), `text is missing ${value}`);
    assert.ok(html.includes(value), `html is missing ${value}`);
  }
  assert.ok(text.includes(base.message));
  assert.ok(html.includes(base.message));
});

test("empty optional fields are dropped, not rendered blank", () => {
  const sparse: Enquiry = { ...base, phone: "", projectType: "", address: "", heard: "" };
  const { subject, text, html } = renderEnquiryEmail(sparse, at);

  assert.equal(subject, "New enquiry — Sam Rivers");
  assert.ok(!text.includes("Phone:"));
  assert.ok(!html.includes("Heard about us"));
});

test("a missing message says so rather than leaving a void", () => {
  const { text, html } = renderEnquiryEmail({ ...base, message: "" }, at);
  assert.ok(text.includes("(no message)"));
  assert.ok(html.includes("No message left."));
});

/**
 * The reason the plain-text version existed in the first place. Anyone can post
 * to the endpoint, so the template must not let typed input become markup in
 * an inbox we open ourselves.
 */
test("markup typed into the form is escaped, never rendered", () => {
  const nasty: Enquiry = {
    ...base,
    firstName: "<script>alert(1)</script>",
    message: `Deck & patio "quote" <img src=x onerror=alert(1)>`,
  };
  const { html } = renderEnquiryEmail(nasty, at);

  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Deck &amp; patio"));
});

test("esc covers both quote styles, so attributes cannot be broken out of", () => {
  assert.equal(esc(`" onmouseover='x'`), "&quot; onmouseover=&#39;x&#39;");
});

test("a quote in the name cannot escape the mailto attribute", () => {
  const { html } = renderEnquiryEmail({ ...base, email: 'a"@example.com' }, at);
  assert.ok(!html.includes('href="mailto:a"@example.com"'));
  assert.ok(html.includes("a&quot;@example.com"));
});
