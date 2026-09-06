/** What every server action in this admin returns. */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };
