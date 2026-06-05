#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const bump = process.argv[2];
const allowed = new Set(["patch", "minor", "major"]);

if (!allowed.has(bump)) {
  console.error("Usage: pnpm release:app <patch|minor|major>");
  process.exit(1);
}

run("git", ["diff", "--quiet"]);
run("git", ["diff", "--cached", "--quiet"]);

run("pnpm", ["typecheck"]);
run("pnpm", ["version", bump]);

const version = output("node", ["-p", "require('./package.json').version"]);

console.log("");
console.log(`App version bumped to v${version}.`);
console.log("");
console.log("Next commands:");
console.log("  git push --follow-tags");
console.log(
  `  gh release create v${version} --title v${version} --generate-notes`,
);

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function output(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}
