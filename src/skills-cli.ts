import { spawn } from "node:child_process";
import type { Scope, SkillsPort } from "./types.js";

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += c.toString();
    });
    child.stderr.on("data", (c) => {
      stderr += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export function createSkillsPort(cwd: string): SkillsPort {
  return {
    async add(pkg: string, scope: Scope): Promise<string> {
      const args = ["--yes", "skills", "add", pkg, "-y", "-a", "cursor"];
      if (scope === "global") {
        args.push("-g");
      }
      const result = await run("npx", args, cwd);
      if (result.code !== 0) {
        throw new Error(`skills add failed for ${pkg}: ${result.stderr || result.stdout}`);
      }
      return pkg;
    },
    async remove(key: string, scope: Scope): Promise<void> {
      const args = ["--yes", "skills", "remove", key, "-y", "-a", "cursor"];
      if (scope === "global") {
        args.push("-g");
      }
      const result = await run("npx", args, cwd);
      if (result.code !== 0) {
        throw new Error(`skills remove failed for ${key}: ${result.stderr || result.stdout}`);
      }
    },
  };
}
