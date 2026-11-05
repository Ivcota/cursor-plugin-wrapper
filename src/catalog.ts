import { githubRawUrl } from "./from-ref.js";
import type { CursorInstallPlan, FetchText, MarketplaceRef, Scope } from "./types.js";

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

/** Read adapter for catalog resolution (remote fetch + optional local manifest tree). */
export type CatalogDeps = {
  fetchText: FetchText;
  readLocal: (path: string) => Promise<string>;
  manifestLocalPath?: string;
};

/**
 * Resolve skill packages for a marketplace plugin entry: inline skills[], per-plugin manifest,
 * or directory discovery (trailing `/` on plugin.json skills declaration).
 */
export async function resolveSkillPackages(
  pluginEntryName: string,
  ref: MarketplaceRef,
  marketplaceText: string,
  deps: CatalogDeps,
): Promise<string[]> {
  const relPaths = await resolvePluginSkillRelPaths(marketplaceText, pluginEntryName, ref, deps);
  return relPaths.map((rel) => toSkillPackage(ref.ownerRepo, rel));
}

export async function buildPlan(
  bundle: string,
  ref: MarketplaceRef,
  scope: Scope,
  marketplaceText: string,
  deps: CatalogDeps,
): Promise<CursorInstallPlan> {
  const packages = await resolveSkillPackages(bundle, ref, marketplaceText, deps);
  return {
    kind: "skills-cli",
    bundle,
    from: ref,
    scope,
    packages,
  };
}

async function resolvePluginSkillRelPaths(
  marketplaceText: string,
  pluginEntryName: string,
  ref: MarketplaceRef,
  deps: CatalogDeps,
): Promise<string[]> {
  const marketplace = JSON.parse(marketplaceText) as MarketplaceJson;
  const plugin = findPluginEntry(marketplace, pluginEntryName);

  const inline = plugin.skills ?? [];
  if (inline.length > 0) {
    return inline;
  }

  return loadPerPluginManifestSkillRelPaths(
    ref,
    plugin.source ?? "./",
    deps.fetchText,
    deps.readLocal,
    deps.manifestLocalPath,
  );
}

function toSkillPackage(ownerRepo: string, relPath: string): string {
  const normalized = relPath.replace(/^\.\//, "").replace(/\/+$/, "");
  if (normalized.includes("..") || normalized.startsWith("/")) {
    throw new Error(`invalid skill path: ${relPath}`);
  }
  return `${ownerRepo}/${normalized}`;
}

/** Skill paths in per-plugin manifest are relative to the plugin folder; marketplace skills[] are repo-root relative. */
function pluginFolderRelativeSkillPath(pluginSource: string, skillRel: string): string {
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
  const repoPath = pluginFolderRelativeSkillPath(pluginSource, skillsDir);
  const entries = await fetchGitHubDirectoryListing(ref, repoPath, fetchText);
  const dirs = entries.filter((e) => e.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
  if (dirs.length === 0) {
    throw new Error(`no skill directories under ${repoPath}`);
  }
  return dirs.map((e) => pluginFolderRelativeSkillPath(pluginSource, joinRepoPath(skillsDir, e.name)));
}

function findPluginEntry(marketplace: MarketplaceJson, pluginEntryName: string) {
  const plugins = marketplace.plugins ?? [];
  const plugin = plugins.find((p) => p.name === pluginEntryName);
  if (!plugin) {
    throw new Error(`unknown plugin: ${pluginEntryName}`);
  }
  return plugin;
}

async function loadPerPluginManifestSkillRelPaths(
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
  return declared.paths.map((p) => pluginFolderRelativeSkillPath(source, p));
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
