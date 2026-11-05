import { defaultMarketplaceRef, parseFromFlag } from "./from-ref.js";
import type { Scope } from "./types.js";

export type ParsedCommand =
  | { cmd: "add"; bundle: string; from: ReturnType<typeof parseFromFlag>; manifest?: string; scope: Scope; json: boolean }
  | { cmd: "rm"; bundle: string; scope: Scope; json: boolean }
  | { cmd: "plan"; bundle: string; from: ReturnType<typeof parseFromFlag>; manifest?: string; scope: Scope; json: boolean }
  | { cmd: "ls"; json: boolean };

export function parseArgv(argv: string[], env: NodeJS.ProcessEnv): ParsedCommand {
  const args = [...argv];
  if (args.length === 0) {
    throw new Error("usage: deck <add|rm|plan|ls> ...");
  }

  const cmd = args.shift();
  let scope: Scope = "project";
  let json = false;
  let from = defaultMarketplaceRef(env);
  let manifest: string | undefined;

  const positional: string[] = [];
  while (args.length > 0) {
    const a = args[0];
    if (a === "--global" || a === "-g") {
      scope = "global";
      args.shift();
      continue;
    }
    if (a === "--json") {
      json = true;
      args.shift();
      continue;
    }
    if (a === "--from") {
      args.shift();
      const v = args.shift();
      if (!v) throw new Error("--from requires a value");
      from = parseFromFlag(v);
      continue;
    }
    if (a === "--manifest") {
      args.shift();
      const v = args.shift();
      if (!v) throw new Error("--manifest requires a path");
      manifest = v;
      continue;
    }
    if (a === "--yes" || a === "-y" || a === "--dry-run") {
      args.shift();
      continue;
    }
    if (a.startsWith("-")) {
      throw new Error(`unknown flag: ${a}`);
    }
    positional.push(args.shift()!);
  }

  if (cmd === "ls") {
    return { cmd: "ls", json };
  }

  const bundle = positional[0];
  if (!bundle) {
    throw new Error(`usage: deck ${cmd} <bundle>`);
  }
  if (bundle.includes("/")) {
    throw new Error("pass a bundle name, not a skill path");
  }

  if (cmd === "add") {
    return { cmd: "add", bundle, from, manifest, scope, json };
  }
  if (cmd === "rm" || cmd === "remove") {
    return { cmd: "rm", bundle, scope, json };
  }
  if (cmd === "plan") {
    return { cmd: "plan", bundle, from, manifest, scope, json };
  }

  throw new Error(`unknown command: ${cmd}`);
}
