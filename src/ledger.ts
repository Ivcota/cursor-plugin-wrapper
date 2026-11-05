import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BundleInstallRecord, InstalledBundlesFile } from "./types.js";

export const LEDGER_REL = ".ivcota/installed-bundles.json";

export async function readLedger(cwd: string): Promise<InstalledBundlesFile> {
  const path = join(cwd, LEDGER_REL);
  try {
    const text = await readFile(path, "utf8");
    const parsed = JSON.parse(text) as InstalledBundlesFile;
    if (parsed.version !== 1 || !parsed.bundles) {
      throw new Error("corrupt ledger");
    }
    return parsed;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, bundles: {} };
    }
    throw e;
  }
}

export async function writeLedger(cwd: string, ledger: InstalledBundlesFile): Promise<void> {
  const path = join(cwd, LEDGER_REL);
  await mkdir(join(cwd, ".ivcota"), { recursive: true });
  await writeFile(path, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
}

export function packagesToApply(
  planPackages: string[],
  record: BundleInstallRecord | undefined,
): string[] {
  if (!record) {
    return planPackages;
  }
  if (record.status === "complete") {
    return [];
  }
  const applied = new Set(record.appliedPackages ?? []);
  return planPackages.filter((p) => !applied.has(p));
}
