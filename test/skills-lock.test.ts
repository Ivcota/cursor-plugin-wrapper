import { describe, expect, it } from "vitest";
import {
  getSkillsLockPath,
  skillInstallNameFromPackage,
  skillKeysAdded,
  skillRemoveArg,
} from "../src/skills-lock.js";

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

  it("resolves global lock path under ~/.agents", () => {
    const path = getSkillsLockPath("/tmp/project", "global");
    expect(path.endsWith(".agents/.skill-lock.json")).toBe(true);
  });

  it("derives install name from package path", () => {
    expect(skillInstallNameFromPackage("mattpocock/skills/skills/engineering/ask-matt")).toBe("ask-matt");
  });
});
