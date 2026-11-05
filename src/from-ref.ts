import type { MarketplaceRef } from "./types.js";

const DEFAULT_OWNER_REPO = "Ivcota/skills";
const DEFAULT_REF = "main";
const DEFAULT_MANIFEST = ".claude-plugin/marketplace.json";

export function parseFromFlag(raw: string): MarketplaceRef {
  const at = raw.lastIndexOf("@");
  if (at <= 0) {
    return { ownerRepo: raw, ref: DEFAULT_REF, manifestPath: DEFAULT_MANIFEST };
  }
  return {
    ownerRepo: raw.slice(0, at),
    ref: raw.slice(at + 1) || DEFAULT_REF,
    manifestPath: DEFAULT_MANIFEST,
  };
}

export function defaultMarketplaceRef(env: NodeJS.ProcessEnv): MarketplaceRef {
  const fromEnv = env.SKILL_DECK_FROM ?? env.SKILLSTALL_FROM;
  if (fromEnv) {
    return parseFromFlag(fromEnv);
  }
  return {
    ownerRepo: DEFAULT_OWNER_REPO,
    ref: DEFAULT_REF,
    manifestPath: DEFAULT_MANIFEST,
  };
}

export function formatFrom(ref: MarketplaceRef): string {
  return `${ref.ownerRepo}@${ref.ref}`;
}

export function githubRawBase(ref: MarketplaceRef): string {
  const [owner, repo] = ref.ownerRepo.split("/");
  if (!owner || !repo) {
    throw new Error(`invalid owner/repo: ${ref.ownerRepo}`);
  }
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref.ref}`;
}

export function githubRawUrl(ref: MarketplaceRef, repoRelativePath: string): string {
  const base = githubRawBase(ref);
  const path = repoRelativePath.replace(/^\.\//, "");
  return `${base}/${path}`;
}
