import { githubRawUrl } from "./from-ref.js";
import type { FetchText, MarketplaceRef } from "./types.js";

type MarketplaceJson = {
  plugins?: Array<{
    name?: string;
    source?: string;
    skills?: string[];
  }>;
};

type PluginJson = {
  skills?: string[];
};

export function expandSkillPath(ownerRepo: string, relPath: string): string {
  const normalized = relPath.replace(/^\.\//, "").replace(/\/+$/, "");
  if (normalized.includes("..") || normalized.startsWith("/")) {
    throw new Error(`invalid skill path: ${relPath}`);
  }
  return `${ownerRepo}/${normalized}`;
}

function findPlugin(marketplace: MarketplaceJson, bundle: string) {
  const plugins = marketplace.plugins ?? [];
  const plugin = plugins.find((p) => p.name === bundle);
  if (!plugin) {
    throw new Error(`unknown bundle: ${bundle}`);
  }
  return plugin;
}

async function loadPluginJsonSkills(
  ref: MarketplaceRef,
  pluginSource: string,
  fetchText: FetchText,
  readLocal: (path: string) => Promise<string>,
  manifestLocalPath?: string,
): Promise<string[]> {
  const source = pluginSource || "./";
  const pluginJsonRel = joinRepoPath(source, ".claude-plugin/plugin.json");

  let text: string;
  if (manifestLocalPath) {
    const manifestDir = manifestLocalPath.replace(/\/[^/]+$/, "");
    const repoRoot = source === "./" ? dirname(manifestDir) : joinPath(manifestDir, source);
    text = await readLocal(joinPath(repoRoot, ".claude-plugin/plugin.json"));
  } else {
    text = await fetchText(githubRawUrl(ref, pluginJsonRel));
  }

  const pluginJson = JSON.parse(text) as PluginJson;
  const skills = pluginJson.skills ?? [];
  if (skills.length === 0) {
    throw new Error(`plugin.json has no skills for bundle`);
  }
  return skills;
}

export async function resolveSkillRelPaths(
  marketplaceText: string,
  bundle: string,
  ref: MarketplaceRef,
  deps: {
    fetchText: FetchText;
    readLocal: (path: string) => Promise<string>;
    manifestLocalPath?: string;
  },
): Promise<string[]> {
  const marketplace = JSON.parse(marketplaceText) as MarketplaceJson;
  const plugin = findPlugin(marketplace, bundle);

  const inline = plugin.skills ?? [];
  if (inline.length > 0) {
    return inline;
  }

  return loadPluginJsonSkills(
    ref,
    plugin.source ?? "./",
    deps.fetchText,
    deps.readLocal,
    deps.manifestLocalPath,
  );
}

export async function buildPlan(
  bundle: string,
  ref: MarketplaceRef,
  scope: import("./types.js").Scope,
  marketplaceText: string,
  deps: {
    fetchText: FetchText;
    readLocal: (path: string) => Promise<string>;
    manifestLocalPath?: string;
  },
): Promise<import("./types.js").CursorInstallPlan> {
  const relPaths = await resolveSkillRelPaths(marketplaceText, bundle, ref, deps);
  const packages = relPaths.map((rel) => expandSkillPath(ref.ownerRepo, rel));
  return {
    kind: "skills-cli",
    bundle,
    from: ref,
    scope,
    packages,
  };
}

function joinRepoPath(source: string, file: string): string {
  if (source === "./" || source === ".") {
    return file;
  }
  return `${source.replace(/\/$/, "")}/${file}`;
}

function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i <= 0 ? p : p.slice(0, i);
}

function joinPath(a: string, b: string): string {
  if (a.endsWith("/")) return a + b;
  return `${a}/${b}`;
}
