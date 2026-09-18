import { describe, expect, it } from "vitest";
import { detectLanguage, languageInstruction } from "./language";

describe("detectLanguage", () => {
  it.each([
    "di ko gets bakit ayaw gumana 😭",
    "ang bobo ko dito hahaha, give up na ako",
    "bakit hindi lumalabas yung data?",
    "pakita mo yung sagot",
    "tignan mo nga yung workflow ko",
  ])("reads %j as Taglish", (message) => {
    expect(detectLanguage(message)).toBe("taglish");
  });

  it.each([
    "Why did my test fail?",
    "What is the difference between offset pagination and cursor pagination?",
    "okay it passed!! finally",
    "can you check my workflow please",
    "what does the IF node do here",
  ])("reads %j as English", (message) => {
    expect(detectLanguage(message)).toBe("english");
  });

  /*
   * The trap this exists for: an English question in a thread that has been
   * Taglish. The decision is per message, so history cannot drag it over.
   */
  it("does not tip over on English words that look Filipino", () => {
    expect(detectLanguage("I set the page size to 7")).toBe("english");
    expect(detectLanguage("na is not a word I used")).toBe("english");
  });
});

describe("languageInstruction", () => {
  it("tells Kaz to answer in English even after Taglish turns", () => {
    expect(languageInstruction("english")).toMatch(/answer in English/i);
    expect(languageInstruction("english")).toMatch(/even if earlier turns in this thread were Taglish/i);
  });

  it("tells Kaz to keep technical terms in English when answering Taglish", () => {
    expect(languageInstruction("taglish")).toMatch(/natural Taglish/i);
    expect(languageInstruction("taglish")).toMatch(/technical terms in English/i);
  });
});
