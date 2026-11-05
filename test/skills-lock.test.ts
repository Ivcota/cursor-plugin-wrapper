import { describe, expect, it } from "vitest";
import { skillKeysAdded, skillRemoveArg } from "../src/skills-lock.js";

describe("skills-lock helpers", () => {
  it("diffs new lockfile keys", () => {
    const before = new Set(["a"]);
    const after = new Set(["a", "humanizer"]);
    expect(skillKeysAdded(before, after)).toEqual(["humanizer"]);
  });

  it("maps legacy package paths to remove ids", () => {
    expect(skillRemoveArg("humanizer")).toBe("humanizer");
    expect(skillRemoveArg("Ivcota/skills/write-communicate/humanizer")).toBe("humanizer");
  });
});
