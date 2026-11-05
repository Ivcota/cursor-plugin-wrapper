import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPlan } from "../src/catalog.js";
import type { MarketplaceRef } from "../src/types.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures");

const ivcotaRef: MarketplaceRef = {
  ownerRepo: "Ivcota/skills",
  ref: "main",
  manifestPath: ".claude-plugin/marketplace.json",
};

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
});
