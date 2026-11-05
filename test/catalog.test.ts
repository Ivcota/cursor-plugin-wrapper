import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPlan, repoRelativeSkillPath } from "../src/catalog.js";
import type { MarketplaceRef } from "../src/types.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures");

const ivcotaRef: MarketplaceRef = {
  ownerRepo: "Ivcota/skills",
  ref: "main",
  manifestPath: ".claude-plugin/marketplace.json",
};

describe("repoRelativeSkillPath", () => {
  it("joins plugin source with skill paths", () => {
    expect(repoRelativeSkillPath("./plugins/rpi", "./skills/rpi")).toBe("./plugins/rpi/skills/rpi");
    expect(repoRelativeSkillPath("./", "./skills/engineering/tdd")).toBe("./skills/engineering/tdd");
  });
});

describe("buildPlan", () => {
  it("expands write-communicate from marketplace skills[]", async () => {
    const text = await readFile(join(root, "ivcota-write-communicate.json"), "utf8");
    const plan = await buildPlan("write-communicate", ivcotaRef, "project", text, {
      fetchText: async () => {
        throw new Error("should not fetch");
      },
      readLocal: async () => "",
    });
    expect(plan.packages).toEqual([
      "Ivcota/skills/write-communicate/learn-my-voice",
      "Ivcota/skills/write-communicate/style-profile",
      "Ivcota/skills/write-communicate/style-to-skill",
      "Ivcota/skills/write-communicate/humanizer",
    ]);
  });

  it("falls back to plugin.json when marketplace row has no skills[]", async () => {
    const manifestPath = join(root, "mattpocock/.claude-plugin/marketplace.json");
    const text = await readFile(manifestPath, "utf8");
    const ref: MarketplaceRef = {
      ownerRepo: "mattpocock/skills",
      ref: "main",
      manifestPath: ".claude-plugin/marketplace.json",
    };
    const plan = await buildPlan("mattpocock-skills", ref, "project", text, {
      fetchText: async () => {
        throw new Error("should not fetch");
      },
      readLocal: async (p) => readFile(p, "utf8"),
      manifestLocalPath: manifestPath,
    });
    expect(plan.packages).toEqual([
      "mattpocock/skills/skills/engineering/tdd",
      "mattpocock/skills/skills/engineering/code-review",
    ]);
  });

  it("discovers skills under plugin.json directory declaration (humanlayer layout)", async () => {
    const marketplaceText = JSON.stringify({
      plugins: [{ name: "rpi", source: "./plugins/rpi" }],
    });
    const ref: MarketplaceRef = {
      ownerRepo: "humanlayer/skills",
      ref: "main",
      manifestPath: ".claude-plugin/marketplace.json",
    };
    const plan = await buildPlan("rpi", ref, "project", marketplaceText, {
      fetchText: async (url) => {
        if (url.includes("plugin.json")) {
          return JSON.stringify({ name: "rpi", skills: "./skills/" });
        }
        if (url.includes("/contents/plugins/rpi/skills")) {
          return JSON.stringify([{ name: "rpi", type: "dir" }]);
        }
        throw new Error(`unexpected fetch: ${url}`);
      },
      readLocal: async () => "",
    });
    expect(plan.packages).toEqual(["humanlayer/skills/plugins/rpi/skills/rpi"]);
  });
});
