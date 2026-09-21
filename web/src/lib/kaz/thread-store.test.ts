import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const session = vi.hoisted(() => vi.fn());
const client = vi.hoisted(() => vi.fn());
vi.mock("@/lib/session/get-session", () => ({ getSession: session }));
vi.mock("@/lib/supabase/server-client", () => ({ createSupabaseServerClient: client }));
import { appendTurn, readMessages } from "./thread-store";

type Row = { id: string; role: string; content: string; created_at: string };
let rows: Row[];
let inserted: Record<string, unknown>[];
let upsertError: object | null;
let insertError: object | null;
const from = vi.fn();
beforeEach(() => {
  rows = []; inserted = []; upsertError = null; insertError = null;
  session.mockResolvedValue({ status: "authenticated", user: { id: "learner-1" } });
  client.mockResolvedValue({ from });
  from.mockReset().mockImplementation(() => {
    const orders: { key: keyof Row; ascending: boolean }[] = [];
    const query = {
      select: vi.fn(() => inserted.length ? Promise.resolve({ data: inserted.map((row, i) => ({ ...row, id: String(i) })), error: insertError }) : query),
      eq: vi.fn(() => query),
      order: vi.fn((key: keyof Row, options: { ascending: boolean }) => { orders.push({ key, ...options }); return query; }),
      limit: vi.fn(async (size: number) => ({ data: [...rows].sort((a, b) => {
        for (const order of orders) {
          const comparison = a[order.key].localeCompare(b[order.key]);
          if (comparison) return order.ascending ? comparison : -comparison;
        }
        return 0;
      }).slice(0, size), error: null })),
      upsert: vi.fn(async () => ({ error: upsertError })),
      insert: vi.fn((values: Record<string, unknown>[]) => { inserted = values; return query; }),
    };
    return query;
  });
});

describe("Kaz thread persistence", () => {
  it("returns the newest fifty messages in chronological order", async () => {
    rows = Array.from({ length: 60 }, (_, i) => ({ id: String(i), role: i % 2 ? "kaz" : "learner", content: String(i), created_at: new Date(i * 1000).toISOString() }));
    const history = await readMessages("03-apis-webhooks");
    expect(history.map(row => row.content)).toEqual(rows.slice(10).map(row => row.content));
  });
  it("orders legacy equal-timestamp questions before answers consistently", async () => {
    rows = [{ id: "a", role: "kaz", content: "answer", created_at: "2026-01-01" }, { id: "z", role: "learner", content: "question", created_at: "2026-01-01" }];
    expect((await readMessages("03-apis-webhooks")).map(row => row.role)).toEqual(["learner", "kaz"]);
  });
  it("writes distinct chronological timestamps for a turn", async () => {
    await appendTurn("03-apis-webhooks", "debug-it", 1, "question", "answer");
    expect(typeof inserted[0].created_at).toBe("string");
    expect(Date.parse(String(inserted[1].created_at))).toBeGreaterThan(Date.parse(String(inserted[0].created_at)));
  });
  it.each(["upsert", "insert", "session"])("retains the answer with an unsaved flag when %s fails", async failure => {
    if (failure === "upsert") upsertError = { message: "offline" };
    if (failure === "insert") insertError = { message: "offline" };
    if (failure === "session") session.mockResolvedValue({ status: "anonymous" });
    const turn = await appendTurn("03-apis-webhooks", "debug-it", 1, "question", "answer");
    expect(turn).toMatchObject({ saved: false, answer: { content: "answer" } });
    if (failure === "upsert") expect(inserted).toHaveLength(0);
  });
  it("marks a persisted pair as saved", async () => {
    expect(await appendTurn("03-apis-webhooks", "debug-it", 1, "question", "answer")).toMatchObject({ saved: true });
  });
  it("does not read messages without a learner session", async () => {
    session.mockResolvedValue({ status: "anonymous" });
    expect(await readMessages("03-apis-webhooks")).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });
});
