import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const SKILLS_LOCK_FILE = "skills-lock.json";

type SkillsLockFile = {
  skills?: Record<string, unknown>;
};

export async function readInstalledSkillKeys(cwd: string): Promise<Set<string>> {
  try {
    const text = await readFile(join(cwd, SKILLS_LOCK_FILE), "utf8");
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
