import { spawn } from "node:child_process";
import {
  readInstalledSkillKeys,
  skillInstallNameFromPackage,
  skillKeysAdded,
  skillRemoveArg,
} from "./skills-lock.js";
import type { Scope, SkillsPort } from "./types.js";

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c: Buffer) => {
      stdout += c.toString();
    });
    child.stderr.on("data", (c: Buffer) => {
      stderr += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code: number | null) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export function createSkillsPort(cwd: string): SkillsPort {
  return {
    async add(pkg: string, scope: Scope): Promise<string> {
      const before = await readInstalledSkillKeys(cwd, scope);
      const args = ["--yes", "skills", "add", pkg, "-y", "-a", "cursor"];
      if (scope === "global") {
        args.push("-g");
      }
      const result = await run("npx", args, cwd);
      if (result.code !== 0) {
        throw new Error(`skills add failed for ${pkg}: ${result.stderr || result.stdout}`);
      }
      const after = await readInstalledSkillKeys(cwd, scope);
      const added = skillKeysAdded(before, after);
      if (added.length === 1) {
        return added[0]!;
      }
      if (added.length === 0) {
        const expected = skillInstallNameFromPackage(pkg);
        if (after.has(expected)) {
          return expected;
        }
      }
      throw new Error(
        `expected 1 new skills-lock entry after add ${pkg}, got ${added.length}: ${added.join(", ") || "(none)"}`,
      );
    },
    async remove(key: string, scope: Scope): Promise<void> {
      const removeId = skillRemoveArg(key);
      const args = ["--yes", "skills", "remove", removeId, "-y", "-a", "cursor"];
      if (scope === "global") {
        args.push("-g");
      }
      const result = await run("npx", args, cwd);
      if (result.code !== 0) {
        throw new Error(`skills remove failed for ${removeId}: ${result.stderr || result.stdout}`);
      }
    },
  };
}
