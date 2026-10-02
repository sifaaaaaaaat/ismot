#!/usr/bin/env node
/**
 * Ismot auto-save.
 *
 * Watches the repository and, once the working tree has been quiet for a while,
 * commits everything and pushes it to the remote. Run it in the background
 * while you work:
 *
 *   node tools/autosave.mjs
 *
 * Tunables (environment variables):
 *   AUTOSAVE_DEBOUNCE_MS  quiet period before a snapshot (default 15000)
 *   AUTOSAVE_REMOTE       remote to push to            (default "origin")
 *
 * Notes:
 *   - Ignored paths (see ../.gitignore) are filtered out before any git work,
 *     so node_modules/.next churn never triggers a commit.
 *   - It never rewrites history and never force-pushes: a failed push is
 *     reported and simply retried on the next quiet period.
 *   - Stop it with Ctrl-C; it leaves the repository in a normal state.
 */
import { watch, readdirSync, statSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEBOUNCE_MS = Number(process.env.AUTOSAVE_DEBOUNCE_MS ?? 15_000);
const REMOTE = process.env.AUTOSAVE_REMOTE ?? "origin";

/** Directories that never contain project source. */
const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "out",
  "build",
  "dist",
  "coverage",
  ".vercel",
  ".freebuff",
  "__pycache__",
]);

/** Files that are generated, machine-local, or churn constantly. */
const IGNORE_FILES =
  /(\.log|\.tsbuildinfo|\.pyc)$|^\.DS_Store$|^Thumbs\.db$|^desktop\.ini$|^next-env\.d\.ts$|^\.env/;

function shouldIgnore(relPath) {
  const parts = relPath.split(/[\\/]/);
  if (parts.some((part) => IGNORE_DIRS.has(part))) return true;
  return IGNORE_FILES.test(parts[parts.length - 1]);
}

/* ------------------------------------------------------------------ git --- */

const git = (args) =>
  run("git", args, { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 });

function buildMessage(changed) {
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  const shown = changed.slice(0, 12).map((file) => `- ${file}`);
  if (changed.length > shown.length) {
    shown.push(`- … and ${changed.length - shown.length} more`);
  }
  return [
    `chore(autosave): sync ${changed.length} file(s)`,
    "",
    `Automatic snapshot taken by tools/autosave.mjs at ${stamp} UTC.`,
    "",
    ...shown,
  ].join("\n");
}

/* ---------------------------------------------------------------- state --- */

const pending = new Set();
let timer = null;
let busy = false;

async function sync() {
  if (busy) return;
  busy = true;
  // Events that arrive while this sync runs re-populate `pending` and are
  // picked up on the next quiet period.
  pending.clear();

  try {
    const { stdout } = await git(["rev-parse", "--abbrev-ref", "HEAD"]);
    const branch = stdout.trim();
    if (!branch || branch === "HEAD") {
      console.log("[autosave] detached HEAD — nothing pushed");
      return;
    }

    await git(["add", "-A"]);
    const { stdout: staged } = await git(["diff", "--cached", "--name-only"]);
    const changed = staged.split("\n").filter(Boolean);
    if (changed.length === 0) {
      console.log("[autosave] clean — nothing to save");
      return;
    }

    await git(["commit", "-m", buildMessage(changed)]);
    console.log(`[autosave] committed ${changed.length} file(s)`);

    try {
      await git(["push", REMOTE, branch]);
      console.log(`[autosave] pushed to ${REMOTE}/${branch}`);
    } catch (err) {
      // Offline, or credentials needed. Keep the commit; retry next cycle.
      const detail = (err.stderr || err.message || "").trim().split("\n")[0];
      console.error(`[autosave] commit kept, push failed: ${detail}`);
    }
  } catch (err) {
    const detail = (err.stderr || err.message || "").trim().split("\n")[0];
    console.error(`[autosave] failed: ${detail}`);
  } finally {
    busy = false;
  }
}

function schedule(relPath) {
  pending.add(relPath);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void sync();
  }, DEBOUNCE_MS);
}

/* ---------------------------------------------------------------- watch --- */

const onEvent = (_event, filename) => {
  if (!filename) return;
  if (shouldIgnore(filename)) return;
  schedule(filename);
};

const watchers = [];

// Watch the root non-recursively (so new top-level files and directories are
// noticed) and each keepable top-level directory recursively. This avoids
// descending into node_modules, which on some platforms means one OS handle
// per directory.
try {
  watchers.push(watch(ROOT, { recursive: false }, onEvent));
} catch (err) {
  console.error(`[autosave] cannot watch ${ROOT}: ${err.message}`);
  process.exit(1);
}

for (const name of readdirSync(ROOT)) {
  if (shouldIgnore(name)) continue;
  const full = path.join(ROOT, name);
  let isDirectory = false;
  try {
    isDirectory = statSync(full).isDirectory();
  } catch {
    continue;
  }
  if (!isDirectory) continue;
  try {
    watchers.push(watch(full, { recursive: true }, onEvent));
  } catch {
    // Recursive watching unsupported here — the root watcher still catches
    // direct children of this directory.
    watchers.push(watch(full, { recursive: false }, onEvent));
  }
}

const shutdown = () => {
  for (const watcher of watchers) watcher.close();
  console.log("\n[autosave] stopped");
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(
  `[autosave] watching ${ROOT}\n` +
    `[autosave] debounce ${DEBOUNCE_MS} ms, remote ${REMOTE}`,
);

// Capture anything already outstanding when the watcher starts.
void sync();
