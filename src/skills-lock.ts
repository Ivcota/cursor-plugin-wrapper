import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Scope } from "./types.js";

/** Project installs (npx skills add without -g). */
export const PROJECT_SKILLS_LOCK_FILE = "skills-lock.json";

/** Global installs (npx skills add -g); matches vercel-labs/skills CLI. */
const GLOBAL_SKILL_LOCK_FILE = ".skill-lock.json";

type SkillsLockFile = {
  skills?: Record<string, unknown>;
};

/** @deprecated use PROJECT_SKILLS_LOCK_FILE */
export const SKILLS_LOCK_FILE = PROJECT_SKILLS_LOCK_FILE;

export function skillInstallNameFromPackage(pkg: string): string {
  const tail = pkg.split("/").pop();
  if (!tail) {
    throw new Error(`invalid skill package: ${pkg}`);
  }
  return tail;
}

export function getSkillsLockPath(cwd: string, scope: Scope): string {
  if (scope === "project") {
    return join(cwd, PROJECT_SKILLS_LOCK_FILE);
  }
  const xdgStateHome = process.env.XDG_STATE_HOME;
  if (xdgStateHome) {
    return join(xdgStateHome, "skills", GLOBAL_SKILL_LOCK_FILE);
  }
  return join(homedir(), ".agents", GLOBAL_SKILL_LOCK_FILE);
}

export async function readInstalledSkillKeys(cwd: string, scope: Scope = "project"): Promise<Set<string>> {
  const lockPath = getSkillsLockPath(cwd, scope);
  try {
    const text = await readFile(lockPath, "utf8");
    const parsed = JSON.parse(text) as SkillsLockFile;
    return new Set(Object.keys(parsed.skills ?? {}));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return new Set();
    }
    throw e;
  }
}

export function skillKeysAdded(before: Set<string>, after: Set<string>): string[] {
  return [...after].filter((k) => !before.has(k));
}

/** skills CLI remove expects lockfile ids; older ledgers stored full add packages. */
export function skillRemoveArg(storedKey: string): string {
  if (!storedKey.includes("/")) {
    return storedKey;
  }
  const tail = storedKey.split("/").pop();
  if (!tail) {
    throw new Error(`invalid stored skill key: ${storedKey}`);
  }
  return tail;
}
