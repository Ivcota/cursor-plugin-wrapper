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
  skills?: string[] | string;
};

type GitHubContentEntry = { name: string; type: string };

export function expandSkillPath(ownerRepo: string, relPath: string): string {
  const normalized = relPath.replace(/^\.\//, "").replace(/\/+$/, "");
  if (normalized.includes("..") || normalized.startsWith("/")) {
    throw new Error(`invalid skill path: ${relPath}`);
  }
  return `${ownerRepo}/${normalized}`;
}

/** Skill paths in plugin.json are relative to the plugin folder; marketplace skills[] are repo-root relative. */
export function repoRelativeSkillPath(pluginSource: string, skillRel: string): string {
  const rel = skillRel.replace(/^\.\//, "");
  const source = (pluginSource || "./").replace(/^\.\//, "").replace(/\/$/, "");
  if (!source || source === ".") {
    return skillRel.startsWith("./") ? skillRel : `./${rel}`;
  }
  return `./${source}/${rel}`;
}

function normalizeSkillsDeclaration(
  skills: string[] | string | undefined,
): { mode: "paths"; paths: string[] } | { mode: "discover"; dir: string } {
  if (skills === undefined) {
    return { mode: "discover", dir: "./skills" };
  }
  if (typeof skills === "string") {
    const s = skills.trim();
    if (!s) {
      return { mode: "discover", dir: "./skills" };
    }
    if (s.endsWith("/")) {
      return { mode: "discover", dir: s.replace(/\/+$/, "") || "./skills" };
    }
    return { mode: "paths", paths: [s] };
  }
  if (skills.length === 0) {
    return { mode: "discover", dir: "./skills" };
  }
  return { mode: "paths", paths: skills };
}

async function fetchGitHubDirectoryListing(
  ref: MarketplaceRef,
  repoRelativePath: string,
  fetchText: FetchText,
): Promise<GitHubContentEntry[]> {
  const [owner, repo] = ref.ownerRepo.split("/");
  if (!owner || !repo) {
    throw new Error(`invalid owner/repo: ${ref.ownerRepo}`);
  }
  const path = repoRelativePath.replace(/^\.\//, "").replace(/\/+$/, "");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref.ref)}`;
  const text = await fetchText(url);
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`expected skills directory listing at ${path}`);
  }
  return parsed as GitHubContentEntry[];
}

async function discoverSkillRelPaths(
  ref: MarketplaceRef,
  pluginSource: string,
  skillsDir: string,
  fetchText: FetchText,
): Promise<string[]> {
  const repoPath = repoRelativeSkillPath(pluginSource, skillsDir);
  const entries = await fetchGitHubDirectoryListing(ref, repoPath, fetchText);
  const dirs = entries.filter((e) => e.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
  if (dirs.length === 0) {
    throw new Error(`no skill directories under ${repoPath}`);
  }
  return dirs.map((e) => repoRelativeSkillPath(pluginSource, joinRepoPath(skillsDir, e.name)));
}

function findPlugin(marketplace: MarketplaceJson, bundle: string) {
  const plugins = marketplace.plugins ?? [];
  const plugin = plugins.find((p) => p.name === bundle);
  if (!plugin) {
    throw new Error(`unknown plugin: ${bundle}`);
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
  const pluginJsonRelPaths = [
    joinRepoPath(source, ".cursor-plugin/plugin.json"),
    joinRepoPath(source, "plugin.json"),
    joinRepoPath(source, ".claude-plugin/plugin.json"),
  ];

  let text: string | undefined;
  let lastErr: unknown;
  if (manifestLocalPath) {
    const manifestDir = manifestLocalPath.replace(/\/[^/]+$/, "");
    const repoRoot = source === "./" ? dirname(manifestDir) : joinPath(manifestDir, source);
    for (const pluginJsonRel of pluginJsonRelPaths) {
      const localPath = joinPath(repoRoot, pluginJsonRel.replace(/^\.\//, ""));
      try {
        text = await readLocal(localPath);
        break;
      } catch (err) {
        lastErr = err;
      }
    }
  } else {
    for (const pluginJsonRel of pluginJsonRelPaths) {
      try {
        text = await fetchText(githubRawUrl(ref, pluginJsonRel));
        break;
      } catch (err) {
        lastErr = err;
      }
    }
  }
  if (text === undefined) {
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  const pluginJson = JSON.parse(text) as PluginJson;
  const declared = normalizeSkillsDeclaration(pluginJson.skills);
  if (declared.mode === "discover") {
    return discoverSkillRelPaths(ref, source, declared.dir, fetchText);
  }
  return declared.paths.map((p) => repoRelativeSkillPath(source, p));
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
