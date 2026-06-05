#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const bump = process.argv[2];
const publish = process.argv.includes("--publish");
const allowed = new Set(["patch", "minor", "major"]);
let publishedCount = 0;

const packages = [
  { name: "@gethelia/widget", dir: "packages/widget" },
  { name: "@gethelia/server", dir: "packages/server" },
  { name: "@gethelia/react", dir: "packages/react" },
];

if (!allowed.has(bump)) {
  console.error("Usage: pnpm release:sdk <patch|minor|major> [--publish]");
  process.exit(1);
}

run("git", ["diff", "--quiet"]);
run("git", ["diff", "--cached", "--quiet"]);

const currentVersion = readJson("packages/widget/package.json").version;
const nextVersion = bumpVersion(currentVersion, bump);
const originalManifests = new Map();

for (const pkg of packages) {
  const manifestPath = join(pkg.dir, "package.json");
  const manifest = readJson(manifestPath);
  originalManifests.set(manifestPath, manifest);
  manifest.version = nextVersion;
  writeJson(manifestPath, manifest);
}

console.log(`SDK packages bumped ${currentVersion} -> ${nextVersion}`);

run("pnpm", ["sdk:check"]);

const packDir = mkdtempSync(join(tmpdir(), "helia-sdk-pack-"));
const tarballs = [];

try {
  for (const pkg of packages) {
    const before = listTarballs(packDir);
    run("pnpm", [
      "--dir",
      pkg.dir,
      "pack",
      "--pack-destination",
      packDir,
    ]);
    const after = listTarballs(packDir);
    const created = after.find((file) => !before.includes(file));
    if (!created) throw new Error(`Could not find packed tarball for ${pkg.name}`);
    verifyPackedManifest(join(packDir, created), pkg.name, nextVersion);
    tarballs.push(join(packDir, created));
  }

  console.log("");
  console.log("Packed SDK tarballs:");
  for (const tarball of tarballs) {
    console.log(`  ${tarball}`);
  }

  if (!publish) {
    restoreManifests(originalManifests);
    console.log("");
    console.log("Dry run complete. Re-run with --publish to publish to npm.");
    process.exit(0);
  }

  for (const tarball of tarballs) {
    run("npm", ["publish", tarball, "--access", "public"]);
    publishedCount += 1;
  }

  console.log("");
  console.log(`Published SDK packages at ${nextVersion}.`);
  console.log("");
  console.log("Recommended follow-up:");
  console.log(`  git add packages/*/package.json`);
  console.log(`  git commit -m "chore: release sdk ${nextVersion}"`);
  console.log(`  git tag sdk-v${nextVersion}`);
  console.log("  git push --follow-tags");
} catch (err) {
  if (!publish || publishedCount === 0) restoreManifests(originalManifests);
  console.error("");
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function restoreManifests(manifests) {
  for (const [path, manifest] of manifests) {
    writeJson(path, manifest);
  }
}

function bumpVersion(version, type) {
  const parts = version.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid semver version: ${version}`);
  }
  const [major, minor, patch] = parts;
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function listTarballs(dir) {
  return output("find", [dir, "-maxdepth", "1", "-name", "*.tgz", "-print"])
    .split("\n")
    .filter(Boolean)
    .map((file) => basename(file));
}

function verifyPackedManifest(tarball, expectedName, expectedVersion) {
  const manifest = JSON.parse(
    output("tar", ["-xOf", tarball, "package/package.json"]),
  );
  if (manifest.name !== expectedName) {
    throw new Error(`${tarball} has unexpected name ${manifest.name}`);
  }
  if (manifest.version !== expectedVersion) {
    throw new Error(`${tarball} has unexpected version ${manifest.version}`);
  }
  const deps = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
  };
  for (const [name, range] of Object.entries(deps)) {
    if (typeof range === "string" && range.startsWith("workspace:")) {
      throw new Error(`${expectedName} packed with workspace dependency ${name}`);
    }
  }
}

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function output(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}
