/**
 * Which language Kaz should answer this message in.
 *
 * The persona already tells her to match the learner's latest message, and
 * live testing showed that is not enough: after a few Taglish turns she kept
 * answering in Taglish even when the next question was plain English, because
 * the thread history pulls harder than an instruction. So the server decides,
 * per message, and says so in the prompt.
 *
 * Deliberately crude. It is choosing between "answer in English" and "answer
 * in natural Taglish", and the cost of a wrong call is a reply in the other
 * language, not a broken feature.
 */

export type KazLanguage = "english" | "taglish";

/**
 * Filipino function words — the small connective words that appear in even the
 * most English-heavy Taglish. Content words are deliberately absent: a learner
 * writing "my webhook" should not be tipped over by a word that happens to
 * exist in both languages.
 */
const FILIPINO_MARKERS = [
  "ako", "ako'y", "ang", "ano", "anong", "ayaw", "ba", "bakit", "dito", "gets",
  "hindi", "iyon", "kasi", "ko", "kung", "lang", "mo", "na", "naman", "nang",
  "ng", "nga", "pala", "pa", "po", "sana", "sya", "siya", "talaga", "tapos",
  "wala", "yun", "yung", "yan", "ito", "meron", "paano", "saan", "sobra",
  "nakuha", "gumana", "gumagana", "tignan", "tingnan", "pakita", "sagot",
];

/**
 * Two markers, or one unambiguous one. A single "na" or "pa" can appear inside
 * an English sentence by accident; "bakit" or "hindi" cannot.
 */
const STRONG_MARKERS = new Set([
  "ayaw", "bakit", "hindi", "kasi", "naman", "yung", "yun", "sana", "talaga",
  "gumana", "gumagana", "paano", "meron", "sagot", "pakita", "tignan", "tingnan",
]);

export function detectLanguage(message: string): KazLanguage {
  const words = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  let hits = 0;
  for (const word of words) {
    if (!FILIPINO_MARKERS.includes(word)) continue;
    if (STRONG_MARKERS.has(word)) return "taglish";
    hits += 1;
    if (hits >= 2) return "taglish";
  }
  return "english";
}

export function languageInstruction(language: KazLanguage): string {
  return language === "taglish"
    ? "Language: this message is Taglish, so answer in natural Taglish and keep the technical terms in English."
    : "Language: this message is in English, so answer in English — even if earlier turns in this thread were Taglish.";
}
