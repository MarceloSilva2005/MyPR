import { describe, expect, it } from "vitest";

import { findViolations, parseExtraTerms } from "./hygiene.ts";

// Built from fragments so this file does not trip the check it tests.
const signature = ["gener", "ated by"].join("");
const trailer = ["Co-Auth", "ored-by: someone"].join("");
const smiley = String.fromCodePoint(0x1f600);

describe("findViolations", () => {
  it("accepts plain technical text", () => {
    expect(findViolations("feat(auth): implement email verification")).toEqual([]);
  });

  it("reports pictographs with the line number", () => {
    expect(findViolations(`ok\nsave ${smiley}`)).toEqual([
      { line: 2, rule: "emoji or pictograph" },
    ]);
  });

  it("flags automatic signatures", () => {
    expect(findViolations(`${signature} a tool`)).toEqual([
      { line: 1, rule: "automatic signature" },
    ]);
  });

  it("flags co-author trailers only in commit messages", () => {
    expect(findViolations(trailer)).toEqual([]);
    expect(findViolations(trailer, { commitMessage: true })).toEqual([
      { line: 1, rule: "co-author trailer" },
    ]);
  });

  it("ignores comment lines in commit messages", () => {
    expect(findViolations(`# ${smiley}`, { commitMessage: true })).toEqual([]);
  });

  it("applies extra terms case-insensitively and escapes them", () => {
    expect(findViolations("uses Forbidden.Tool here", { extraTerms: ["forbidden.tool"] })).toEqual([
      { line: 1, rule: "prohibited term" },
    ]);
    expect(findViolations("forbiddenXtool", { extraTerms: ["forbidden.tool"] })).toEqual([]);
  });
});

describe("parseExtraTerms", () => {
  it("merges comma and newline separated sources and drops blanks", () => {
    expect(parseExtraTerms("a, b", undefined, "c\n\nd ")).toEqual(["a", "b", "c", "d"]);
  });
});
