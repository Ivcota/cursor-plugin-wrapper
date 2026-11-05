import { readFile as fsReadFile, writeFile as fsWriteFile, mkdir as fsMkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { buildPlan } from "./catalog.js";
import { parseArgv } from "./argv.js";
import { formatFrom, githubRawUrl, defaultMarketplaceRef, MARKETPLACE_MANIFEST_CANDIDATES } from "./from-ref.js";
import { packagesToApply, readLedger, writeLedger } from "./ledger.js";
import { createSkillsPort } from "./skills-cli.js";
import type { BundleInstallRecord, CursorInstallPlan, Ports, RunResult } from "./types.js";

async function loadMarketplaceText(
  parsed: { from: ReturnType<typeof defaultMarketplaceRef>; manifest?: string },
  ports: Ports,
): Promise<{ text: string; manifestLocalPath?: string }> {
  if (parsed.manifest) {
    const path = isAbsolute(parsed.manifest) ? parsed.manifest : join(ports.cwd, parsed.manifest);
    const text = await ports.readFile(path);
    return { text, manifestLocalPath: path };
  }
  const candidates = parsed.from.manifestPath
    ? [parsed.from.manifestPath]
    : [...MARKETPLACE_MANIFEST_CANDIDATES];
  let lastErr: unknown;
  for (const manifestPath of candidates) {
    const url = githubRawUrl(parsed.from, manifestPath);
    try {
      const text = await ports.fetchText(url);
      return { text };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function renderPlan(plan: CursorInstallPlan, json: boolean): string {
  if (json) {
    return `${JSON.stringify({ ok: true, op: "plan", plan }, null, 2)}\n`;
  }
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export async function run(argv: string[], partialPorts?: Partial<Ports>): Promise<RunResult> {
  const cwd = partialPorts?.cwd ?? process.cwd();
  const env = partialPorts?.env ?? process.env;
  const ports: Ports = {
    cwd,
    env,
    fetchText: partialPorts?.fetchText ?? ((url) => fetch(url).then((r) => {
      if (!r.ok) throw new Error(`fetch failed ${r.status}: ${url}`);
      return r.text();
    })),
    skills: partialPorts?.skills ?? createSkillsPort(cwd),
    readFile: partialPorts?.readFile ?? ((p) => fsReadFile(p, "utf8")),
    writeFile: partialPorts?.writeFile ?? ((p, d) => fsWriteFile(p, d, "utf8")),
    mkdir: partialPorts?.mkdir ?? (async (p) => {
      await fsMkdir(p, { recursive: true });
    }),
  };

  try {
    const parsed = parseArgv(argv, env);

    if (parsed.cmd === "ls") {
      const ledger = await readLedger(cwd);
      const names = Object.keys(ledger.bundles).sort();
      if (parsed.json) {
        return { code: 0, stdout: `${JSON.stringify({ ok: true, op: "ls", bundles: names }, null, 2)}\n`, stderr: "" };
      }
      return { code: 0, stdout: names.length ? `${names.join("\n")}\n` : "", stderr: "" };
    }

    if (parsed.cmd === "rm") {
      const ledger = await readLedger(cwd);
      const record = ledger.bundles[parsed.bundle];
      if (!record) {
        const msg = parsed.json
          ? JSON.stringify({ ok: true, op: "rm", alreadyAbsent: true, bundle: parsed.bundle }, null, 2)
          : "not installed\n";
        return { code: 0, stdout: `${msg}\n`, stderr: "" };
      }
      for (const key of record.skillKeys) {
        await ports.skills.remove(key, parsed.scope);
      }
      delete ledger.bundles[parsed.bundle];
      await writeLedger(cwd, ledger);
      const out = parsed.json
        ? JSON.stringify({ ok: true, op: "rm", bundle: parsed.bundle }, null, 2)
        : `removed ${parsed.bundle}\n`;
      return { code: 0, stdout: `${out}\n`, stderr: "" };
    }

    const { text, manifestLocalPath } = await loadMarketplaceText(parsed, ports);
    const plan = await buildPlan(parsed.bundle, parsed.from, parsed.scope, text, {
      fetchText: ports.fetchText,
      readLocal: (p) => ports.readFile(p),
      manifestLocalPath,
    });

    if (parsed.cmd === "plan") {
      return { code: 0, stdout: renderPlan(plan, parsed.json), stderr: "" };
    }

    if (parsed.cmd === "add") {
      const ledger = await readLedger(cwd);
      const existing = ledger.bundles[parsed.bundle];
      const toApply = packagesToApply(plan.packages, existing);
      if (toApply.length === 0) {
        const msg = parsed.json
          ? JSON.stringify({ ok: true, op: "add", alreadyInstalled: true, bundle: parsed.bundle }, null, 2)
          : "unchanged\n";
        return { code: 0, stdout: `${msg}\n`, stderr: "" };
      }

      const skillKeys: string[] = existing?.skillKeys ?? [];
      const applied: string[] = existing?.appliedPackages ?? [];

      for (const pkg of toApply) {
        const key = await ports.skills.add(pkg, parsed.scope);
        skillKeys.push(key);
        applied.push(pkg);
        const partial: BundleInstallRecord = {
          bundle: parsed.bundle,
          from: formatFrom(parsed.from),
          packages: plan.packages,
          skillKeys: [...skillKeys],
          status: "partial",
          appliedPackages: [...applied],
        };
        ledger.bundles[parsed.bundle] = partial;
        await writeLedger(cwd, ledger);
      }

      const complete: BundleInstallRecord = {
        bundle: parsed.bundle,
        from: formatFrom(parsed.from),
        packages: plan.packages,
        skillKeys,
        status: "complete",
        installedAt: new Date().toISOString(),
      };
      ledger.bundles[parsed.bundle] = complete;
      await writeLedger(cwd, ledger);

      const out = parsed.json
        ? JSON.stringify({ ok: true, op: "add", record: complete }, null, 2)
        : `installed ${parsed.bundle} (${skillKeys.length} skills)\n`;
      return { code: 0, stdout: `${out}\n`, stderr: "" };
    }

    return { code: 1, stdout: "", stderr: "unreachable\n" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { code: 1, stdout: "", stderr: `${message}\n` };
  }
}
