import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLoginRate, LIMIT, WINDOW_MS } from "../src/lib/ratelimit.ts";

const fakeStore = () => {
  const map = new Map<string, string>();
  return {
    map,
    get: async (k: string) => map.get(k) ?? null,
    put: async (k: string, v: string) => void map.set(k, v),
    delete: async (k: string) => void map.delete(k),
  };
};

test("allows the first attempt", async () => {
  const s = fakeStore();
  assert.equal((await checkLoginRate(s, "1.1.1.1", 0)).allowed, true);
});

test("blocks once the limit is reached inside the window", async () => {
  const s = fakeStore();
  for (let i = 0; i < LIMIT; i++) await checkLoginRate(s, "1.1.1.1", i);
  const r = await checkLoginRate(s, "1.1.1.1", LIMIT);
  assert.equal(r.allowed, false);
  assert.ok(r.retryAfterMs > 0);
});

test("the window rolls — attempts older than WINDOW_MS do not count", async () => {
  const s = fakeStore();
  for (let i = 0; i < LIMIT; i++) await checkLoginRate(s, "1.1.1.1", i);
  assert.equal((await checkLoginRate(s, "1.1.1.1", WINDOW_MS + 1)).allowed, true);
});

test("counts each IP separately", async () => {
  const s = fakeStore();
  for (let i = 0; i < LIMIT; i++) await checkLoginRate(s, "1.1.1.1", i);
  assert.equal((await checkLoginRate(s, "2.2.2.2", LIMIT)).allowed, true);
});

test("a successful login clears the counter", async () => {
  const s = fakeStore();
  const { clearLoginRate } = await import("../src/lib/ratelimit.ts");
  for (let i = 0; i < LIMIT; i++) await checkLoginRate(s, "1.1.1.1", i);
  await clearLoginRate(s, "1.1.1.1");
  assert.equal((await checkLoginRate(s, "1.1.1.1", LIMIT)).allowed, true);
});

test("a malformed stored value (wrong shape) resets to a fresh window instead of failing open", async () => {
  const s = fakeStore();
  s.map.set("login:1.1.1.1", '{"a":1}');
  assert.equal((await checkLoginRate(s, "1.1.1.1", 0)).allowed, true);
  // The throttle must still bite for this IP — a malformed read must not have
  // silently disabled it for the rest of the TTL.
  for (let i = 1; i < LIMIT; i++) await checkLoginRate(s, "1.1.1.1", i);
  const r = await checkLoginRate(s, "1.1.1.1", LIMIT);
  assert.equal(r.allowed, false);
});

test("non-number entries in a stored array are dropped rather than poisoning the arithmetic", async () => {
  const s = fakeStore();
  s.map.set("login:1.1.1.1", '[1, "x", null, 2]');
  const r = await checkLoginRate(s, "1.1.1.1", 3);
  assert.equal(r.allowed, true);
});

test("fails OPEN when the store throws — a KV outage must not lock the client out", async () => {
  const broken = {
    get: async () => {
      throw new Error("KV down");
    },
    put: async () => {
      throw new Error("KV down");
    },
    delete: async () => {},
  };
  assert.equal((await checkLoginRate(broken, "1.1.1.1", 0)).allowed, true);
});
