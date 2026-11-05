import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { run } from "../src/run.js";
import { LEDGER_REL } from "../src/ledger.js";

describe("deck add / rm", () => {
  it("installs skills and updates ledger in a temp project", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "deck-test-"));
    const installed = new Set<string>();

    try {
      const manifest = join(process.cwd(), "test/fixtures/ivcota-write-communicate.json");
      const addResult = await run(
        ["add", "write-communicate", "--manifest", manifest, "--from", "Ivcota/skills@main"],
        {
          cwd,
          skills: {
            async add(pkg) {
              const name = pkg.split("/").pop()!;
              installed.add(name);
              const dir = join(cwd, ".agents/skills", name);
              await import("node:fs/promises").then((fs) => fs.mkdir(dir, { recursive: true }));
              return name;
            },
            async remove(key) {
              installed.delete(key);
              const dir = join(cwd, ".agents/skills", key);
              await rm(dir, { recursive: true, force: true });
            },
          },
        },
      );
      expect(addResult.code).toBe(0);
      expect(installed.size).toBe(4);

      const ledgerPath = join(cwd, LEDGER_REL);
      const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
      expect(ledger.bundles["write-communicate"].status).toBe("complete");

      await expect(stat(join(cwd, ".agents/skills", "humanizer"))).resolves.toBeDefined();

      expect(ledger.bundles["write-communicate"].skillKeys).toEqual(
        expect.arrayContaining(["learn-my-voice", "humanizer"]),
      );

      const rmResult = await run(["rm", "write-communicate"], {
        cwd,
        skills: {
          async add(pkg) {
            return pkg.split("/").pop()!;
          },
          async remove(key) {
            installed.delete(key);
            await rm(join(cwd, ".agents/skills", key), { recursive: true, force: true });
          },
        },
      });
      expect(rmResult.code).toBe(0);
      expect(installed.size).toBe(0);
      const ledgerAfter = JSON.parse(await readFile(ledgerPath, "utf8"));
      expect(ledgerAfter.bundles["write-communicate"]).toBeUndefined();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
