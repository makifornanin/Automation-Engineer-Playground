"use server";

import { hasHandsOnAccess } from "@/lib/course/progress-writes";
import { getCourseProgress } from "@/lib/course/progress-store";
import { getSession } from "@/lib/session/get-session";
import { getLabWebhookUrl } from "@/lib/testing/webhook-store";
import {
  buildCanonicalContext,
  buildLessonContext,
  buildProgressContext,
  recentTurns,
} from "./context";
import { callKazGateway, webhookPathForGateway } from "./gateway";
import { nextHelpLevel } from "./help-ladder";
import { decideInspection, isBareStuck } from "./intent";
import { detectLanguage, languageInstruction } from "./language";
import { KAZ_PERSONA, KAZ_RULES, helpLevelInstruction } from "./persona";
import { allowKazMessage } from "./kaz-throttle";
import { appendTurn, readMessages, readThread } from "./thread-store";
import {
  buildKazError,
  MAX_QUESTION_LENGTH,
  THREAD_CONTEXT_TURNS,
  type HelpLevel,
  type KazAskState,
} from "./types";

/**
 * The only way a browser reaches Kaz.
 *
 * The client names a lab, a chunk and a question. It names nothing else — no
 * user id, no workflow id, no help level, no context — because everything else
 * is a decision AEP has to make itself:
 *
 * - who is asking comes from the session;
 * - whether they may ask at all comes from the same lock the lesson uses;
 * - which workflow may be inspected comes from that learner's own saved
 *   webhook row, under their own RLS;
 * - how much of the canonical answer may reach the model comes from the help
 *   ladder, not from the question.
 *
 * A replayed action id with extra fields therefore buys nothing: the extra
 * fields are not read.
 */

const LAB_SLUG_PATTERN = /^[0-9]{2}-[a-z0-9-]+$/;
const CHUNK_ID_PATTERN = /^[a-z0-9-]+$/;

export async function askKaz(
  _prevState: KazAskState,
  formData: FormData,
): Promise<KazAskState> {
  const labSlug = formData.get("labSlug");
  const chunkId = formData.get("chunkId");
  const rawMessage = formData.get("message");

  if (typeof labSlug !== "string" || typeof chunkId !== "string" || typeof rawMessage !== "string") {
    return buildKazError("unknown_lab");
  }
  if (!LAB_SLUG_PATTERN.test(labSlug) || !CHUNK_ID_PATTERN.test(chunkId)) {
    return buildKazError("unknown_lab");
  }

  const question = rawMessage.trim();
  if (question.length === 0) return buildKazError("empty");
  if (question.length > MAX_QUESTION_LENGTH) return buildKazError("too_long");

  const session = await getSession();
  if (session.status !== "authenticated") return buildKazError("not_signed_in");

  // Kaz belongs to the lesson, so she is behind the lesson's own lock.
  if (!(await hasHandsOnAccess(labSlug))) return buildKazError("locked");

  if (!allowKazMessage(session.user.id, Date.now())) return buildKazError("throttled");

  const progress = await getCourseProgress();
  const earned = Boolean(progress.labs[labSlug]?.evidence?.[chunkId]);

  const lesson = buildLessonContext(labSlug, chunkId, earned);
  if (!lesson) return buildKazError("unknown_lab");

  const thread = await readThread(labSlug);
  // A level earned on one step does not carry to the next one.
  const base: HelpLevel = thread.helpChunkId === chunkId ? thread.helpLevel : 1;
  const helpLevel = nextHelpLevel(base, question);

  const webhookPath = webhookPathForGateway(await getLabWebhookUrl(labSlug));
  const inspect = isBareStuck(question)
    ? { workflow: false, execution: false }
    : decideInspection(question, webhookPath !== null);

  const result = await callKazGateway({
    persona: KAZ_PERSONA,
    rules: KAZ_RULES,
    // The ladder's instruction, plus which language this message is in: the
    // thread's history pulls the model harder than a persona line can.
    levelInstruction: [
      helpLevelInstruction(helpLevel, lesson.chunkKind),
      languageInstruction(detectLanguage(question)),
    ].join("\n\n"),
    helpLevel,
    question,
    history: recentTurns(await readMessages(labSlug), THREAD_CONTEXT_TURNS).map((message) => ({
      role: message.role,
      content: message.content,
    })),
    lesson,
    progress: buildProgressContext(progress, labSlug, chunkId),
    canonical: buildCanonicalContext(labSlug, lesson.chunkKind, helpLevel),
    inspect: { ...inspect, webhookPath: inspect.workflow || inspect.execution ? webhookPath : null },
  });

  if (!result.ok) return buildKazError(result.code);

  const turn = await appendTurn(labSlug, chunkId, helpLevel, question, result.answer);
  return {
    status: "answered",
    question: turn.question,
    answer: turn.answer,
    helpLevel,
    looked: result.looked,
  };
}
