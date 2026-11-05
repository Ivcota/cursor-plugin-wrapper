export type Scope = "project" | "global";

export type MarketplaceRef = {
  ownerRepo: string;
  ref: string;
  manifestPath: string;
};

export type CursorInstallPlan = {
  kind: "skills-cli";
  bundle: string;
  from: MarketplaceRef;
  scope: Scope;
  packages: string[];
};

export type BundleInstallRecord = {
  bundle: string;
  from: string;
  packages: string[];
  skillKeys: string[];
  status: "partial" | "complete";
  installedAt?: string;
  appliedPackages?: string[];
};

export type InstalledBundlesFile = {
  version: 1;
  bundles: Record<string, BundleInstallRecord>;
};

export type SkillsPort = {
  add(pkg: string, scope: Scope): Promise<string>;
  remove(key: string, scope: Scope): Promise<void>;
};

export type FetchText = (url: string) => Promise<string>;

export type Ports = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  fetchText: FetchText;
  skills: SkillsPort;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
};

export type RunResult = {
  code: number;
  stdout: string;
  stderr: string;
};
