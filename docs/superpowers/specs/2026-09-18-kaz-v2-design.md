# Kaz V2 — Design

Date: 2026-09-18
Baseline: `v1.1.0`
Implementation plan: `docs/superpowers/plans/2026-09-18-kaz-v2.md`

Kaz V2 turns Kaz from a page that explains what she cannot do into an
automation companion a learner can actually talk to, inside the lesson.

---

## 1. What Kaz is

A technically excellent friend who happens to be very good at automation
engineering. She teaches, explains, debugs, jokes, and celebrates. She is not
a mentor persona, a help desk, or a motivational feed.

She stays a teacher: she does not hand over a lab's answer on the first ask.

**Amendment to `docs/AEP-KAZ-DESIGN.md`:** §13 prefers a Supabase vector
knowledge base. V2 uses deterministic retrieval from the repository instead —
the corpus is ten labs plus a Capstone, indexed by lab and chunk, and the
learner's current position already tells us which slice is relevant. Embeddings
would add infrastructure to answer a question the route already answers. §12's
hybrid "the site decides when, the model decides how" is unchanged and is
exactly what the help ladder below encodes.

## 2. One intelligence path

```
browser (Kaz panel)
  -> askKaz Server Action            AEP server: identity, context, policy
    -> Kaz Gateway workflow (n8n)    auth, n8n reads, sanitize, prompt
      -> Gemini                      wording
    <- structured response
```

No Gemini call from the browser. No second model path inside AEP. n8n is the
orchestration layer; Gemini is the brain; AEP owns identity and policy.

The browser sends: the lab slug, the chunk id, the message, and (optionally)
which of *its own* labs to inspect. It never sends a user id, a role, a
workflow id, a prompt, or any context it could forge.

## 3. Trust boundaries

| Decision | Made by | Why |
|---|---|---|
| Who the learner is | AEP server (`getSession`) | The browser cannot be trusted with identity |
| Which lab/chunk is open | AEP server, validated against lesson content | An unknown slug must not reach the model |
| Whether a workflow may be inspected | AEP server (learner's own saved webhook row, RLS) + Gateway (host match) | Ownership must be proven, never asserted |
| Which canonical material is in context | AEP server, by help level | The ladder is architecture, not a prompt request |
| Wording, tone, explanation | Gemini | The part a model is actually good at |

The Gateway is privileged, so the browser must never reach it: it is called
only by the AEP server, authenticated with a shared secret carried as an n8n
**Header Auth credential** on the webhook node — so the workflow export
contains a credential reference, never a secret.

## 4. Workflow association

Association evidence that already exists: `aep_web_lab_webhooks` holds the
learner's saved Production webhook URL per lab, readable only by that learner
under RLS. That row is the proof of ownership.

```
learner's saved URL for this lab  (their row, RLS)
  -> path + host                  (server)
  -> host must equal the Gateway's own n8n host
  -> workflow whose webhook node has that path   (Gateway, n8n API)
```

- The browser never supplies a workflow id, so an arbitrary id cannot be
  requested. "Manual switching" means picking **another of the learner's own
  labs**; the server resolves that lab to that learner's own saved URL.
- A learner whose n8n is someone else's host, or who has saved nothing, gets
  an honest "I can't inspect that workflow yet" and still gets lesson and test
  help.
- Labs 01, 02, 05 and 06 have no webhook at all, by design; there is nothing to
  associate and Kaz says so.

This is deliberately narrow. It cannot name another learner's workflow because
it can only start from a row the learner owns.

## 5. Read-only, and how that is enforced

Three layers:

1. The n8n API key is scoped to `workflow:read`, `workflow:list`,
   `execution:read`, `execution:list`. A write is refused by n8n itself (403,
   verified).
2. The Gateway contains no node that mutates anything.
3. AEP's Kaz code writes only Kaz-owned conversation rows.

## 6. Help ladder

| Level | Kaz gives | Canonical material in model context |
|---|---|---|
| 1 Nudge | Where to look | none |
| 2 Hint | The likely node, field or concept | none |
| 3 Explain | The likely failure, using the learner's own evidence | structure only (node names, types, order) |
| 4 Show me | The exact fix | the relevant canonical node configuration |

The level lives on the thread and is decided by the server: it rises when the
learner asks again while still stuck, jumps to 4 on an explicit request
("just show me", "exact fix", "sagot na"), and resets when the lab's evidence
advances. Because the canonical material is withheld from the model below
level 4, the ladder holds even if the model is asked nicely to ignore it.

## 7. Conversation model

One thread per learner per lab; the Capstone is `11-capstone`. Returning to a
lab restores that lab's thread. No cross-lab history, no personal-profile
memory. Kaz reads normal AEP progress because that is product state.

```sql
aep_web_kaz_threads (user_id, lab_slug, help_level, created_at, updated_at)
  primary key (user_id, lab_slug)
aep_web_kaz_messages (id, user_id, lab_slug, role, content, metadata, created_at)
```

Messages carry `user_id` and `lab_slug` directly rather than a thread id, so
every policy is the same one-line `user_id = auth.uid()` check the other four
tables use, with no join to authorise. RLS on and forced, grants limited to
select/insert (plus update on the thread for the help level), owner-scoped
policies, **no admin policy** — Vision §8, and these are private conversations.

Only the last few turns are sent to the model; context is bounded, not
unlimited history.

## 8. What reaches the model

Assembled per request, smallest useful slice:

- Kaz's personality and hard teaching rules
- current lab, chunk title, help level
- the learner's question and the last turns of this thread
- progress and evidence for this lab (what they have proved)
- the current chunk's lesson content, plus the lab's outline
- canonical summary, gated by help level (§6)
- sanitized workflow summary, only when the question needs it
- sanitized latest execution, only when the question needs it

Whether to inspect at all is decided by cheap server-side heuristics: a concept
question ("what does idempotency mean?") fetches nothing; "why did my test
fail?" fetches the latest execution; "check my workflow" fetches both.

## 9. Sanitization

Before anything leaves for Gemini, the Gateway strips:

- every `credentials` object on every node
- any parameter whose name looks like a secret (key, token, secret, password,
  authorization, cookie, apikey)
- header-auth values, environment expressions, and `$env` references
- full webhook URLs (host and path are enough to reason about; the URL itself
  is a capability)

Execution data is truncated: the failed node and a bounded slice of its input
and output, not the whole run. Tests cover each rule.

## 10. UI

A floating orb button, bottom-right above the dock, opening a right-hand panel
(a full-height sheet on mobile). The lesson stays visible on desktop. The panel
shows a small context label — "Lab 04 · Debug It" — the thread, an input, and
an honest line about what Kaz can see.

The standalone `/kaz` page and its dock item are removed; `/kaz` redirects into
the journey. Home's contextual Kaz note stays.

**Proactive:** after repeated failed tests in the same chunk the orb pulses
once with "Want another set of eyes on that?". The learner decides. No
auto-open, no background model calls.

**Streaming:** not in V2. The Gateway answers once through a webhook response;
true token streaming would mean a second transport and a much more fragile
Gateway for a cosmetic gain. The panel shows a typing state instead.

## 11. Failure UX

| Failure | What Kaz says |
|---|---|
| Gateway unreachable | "Kaz can't reach the workshop right now." |
| Gemini error | "I hit a model error. Try that again." |
| Workflow not inspectable | "I can help with the lesson and your test result, but I can't inspect that workflow right now." |

Kaz never invents a node, an execution or a test result.

## 12. Cost and abuse control

Per-learner minimum interval between messages, a per-minute cap, a maximum
message length, and hard caps on retrieved context size. In-memory, matching
the existing Send Test throttle. No billing, no analytics tables.
