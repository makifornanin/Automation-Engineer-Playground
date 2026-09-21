import "server-only";

import { getSession } from "@/lib/session/get-session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { HelpLevel, KazMessage, KazRole } from "./types";

/**
 * One Kaz thread per learner per lab, read and written only through the
 * learner's own session under RLS (`database/aep_web_kaz_schema.sql`).
 *
 * There is no admin path and no service-role client here on purpose: these are
 * private conversations, and the only code that can read them is code running
 * as the learner who wrote them.
 *
 * `server-only`, so no client bundle can pull the store in behind a Server
 * Action's back.
 */

const THREADS_TABLE = "aep_web_kaz_threads";
const MESSAGES_TABLE = "aep_web_kaz_messages";

/** How many messages a panel loads. Older turns stay in the table, unread. */
export const THREAD_PAGE_SIZE = 50;

export interface KazThread {
  helpLevel: HelpLevel;
  /** The chunk the level was earned on; a different chunk starts again at 1. */
  helpChunkId: string | null;
}

async function authorised() {
  const session = await getSession();
  if (session.status !== "authenticated") return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  return { supabase, userId: session.user.id };
}

function toHelpLevel(value: unknown): HelpLevel {
  const level = Number(value);
  return level === 2 || level === 3 || level === 4 ? level : 1;
}

/** The thread's help state, or a fresh nudge-level thread when there is none. */
export async function readThread(labSlug: string): Promise<KazThread> {
  const fresh: KazThread = { helpLevel: 1, helpChunkId: null };
  try {
    const client = await authorised();
    if (!client) return fresh;
    const { data, error } = await client.supabase
      .from(THREADS_TABLE)
      .select("help_level, help_chunk_id")
      .eq("lab_slug", labSlug)
      .maybeSingle();
    if (error || !data) return fresh;
    const row = data as { help_level: unknown; help_chunk_id: unknown };
    return {
      helpLevel: toHelpLevel(row.help_level),
      helpChunkId: typeof row.help_chunk_id === "string" ? row.help_chunk_id : null,
    };
  } catch {
    return fresh;
  }
}

/** This lab's conversation, oldest first. Empty when there is nothing yet. */
export async function readMessages(labSlug: string): Promise<readonly KazMessage[]> {
  try {
    const client = await authorised();
    if (!client) return [];
    const { data, error } = await client.supabase
      .from(MESSAGES_TABLE)
      .select("id, role, content, created_at")
      .eq("lab_slug", labSlug)
      .order("created_at", { ascending: false })
      // Legacy pairs share a database timestamp. Reverse kaz/learner here so
      // reversing the page below restores question before answer, with stable ids.
      .order("role", { ascending: true })
      .order("id", { ascending: false })
      .limit(THREAD_PAGE_SIZE);
    if (error || !data) return [];
    return [...(data as { id: string; role: string; content: string; created_at: string }[])].reverse().map(
      (row) => ({
        id: row.id,
        role: row.role === "kaz" ? "kaz" : "learner",
        content: row.content,
        createdAt: row.created_at,
      }),
    );
  } catch {
    return [];
  }
}

export interface AppendedTurn {
  saved: boolean;
  question: KazMessage;
  answer: KazMessage;
}

/**
 * Appends the learner's question and Kaz's answer, in that order.
 *
 * Returns local ids when the store is unavailable: a learner who cannot save a
 * conversation should still be able to have one. The panel says so.
 */
export async function appendTurn(
  labSlug: string,
  chunkId: string,
  level: HelpLevel,
  question: string,
  answer: string,
): Promise<AppendedTurn> {
  const timestamp = Date.now();
  const now = new Date(timestamp).toISOString();
  const answeredAt = new Date(timestamp + 1).toISOString();
  const local = (role: KazRole, content: string): KazMessage => ({
    id: "local-" + role + "-" + now + "-" + Math.random().toString(36).slice(2, 8),
    role,
    content,
    createdAt: role === "learner" ? now : answeredAt,
  });
  const fallback: AppendedTurn = { saved: false, question: local("learner", question), answer: local("kaz", answer) };

  try {
    const client = await authorised();
    if (!client) return fallback;

    // The thread row must exist before its messages: the messages' foreign key
    // points at it, and it is what carries the help level.
    const { error: threadError } = await client.supabase.from(THREADS_TABLE).upsert(
      { user_id: client.userId, lab_slug: labSlug, help_level: level, help_chunk_id: chunkId },
      { onConflict: "user_id,lab_slug" },
    );
    if (threadError) return fallback;

    const { data, error } = await client.supabase
      .from(MESSAGES_TABLE)
      .insert([
        { user_id: client.userId, lab_slug: labSlug, role: "learner", content: question, created_at: now },
        { user_id: client.userId, lab_slug: labSlug, role: "kaz", content: answer, created_at: answeredAt },
      ])
      .select("id, role, content, created_at");

    if (error || !data || data.length < 2) return fallback;
    const rows = data as { id: string; role: string; content: string; created_at: string }[];
    const mapped = rows.map((row) => ({
      id: row.id,
      role: row.role === "kaz" ? ("kaz" as const) : ("learner" as const),
      content: row.content,
      createdAt: row.created_at,
    }));
    const savedQuestion = mapped.find((message) => message.role === "learner");
    const savedAnswer = mapped.find((message) => message.role === "kaz");
    if (!savedQuestion || !savedAnswer) return fallback;
    return { saved: true, question: savedQuestion, answer: savedAnswer };
  } catch {
    return fallback;
  }
}
