/**
 * Scans the more-health source tree for `t("en", "zh")` calls and emits a
 * deduped catalog at `artifacts/more-health/src/lib/i18n.catalog.generated.json`.
 *
 * This catalog is the source of truth for the translations admin page: it's
 * the full list of strings the app can render, paired with their inline
 * Chinese defaults. The admin page lets staff download a CSV of (english,
 * chinese), edit it, re-upload as drafts, preview, and publish — the
 * published map then overrides the inline Chinese at runtime via `t()`.
 *
 * Regex captures the simple `t("...", "...")` form on a single line. Strings
 * may contain escaped double-quotes (\"). Multi-line or template-string calls
 * are not captured (and there aren't many of them in practice).
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const SRC_DIR = join(ROOT, "artifacts/more-health/src");
const OUT_FILE = join(ROOT, "artifacts/more-health/src/lib/i18n.catalog.generated.json");

// Single-line: t("anything with \"escapes\"", "中文")
const T_CALL = /\bt\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g;

function unescape(s: string): string {
  return s.replace(/\\(.)/g, (_, c) => {
    if (c === "n") return "\n";
    if (c === "t") return "\t";
    if (c === "r") return "\r";
    return c;
  });
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(entry) && !entry.endsWith(".generated.json"))
      out.push(p);
  }
  return out;
}

function main() {
  const files = walk(SRC_DIR);
  // Map english -> chinese. If the same english appears with different
  // chinese variants in source we keep the first occurrence (rare, and
  // surfacing it as a build error would be noise).
  const seen = new Map<string, string>();
  let totalMatches = 0;
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    let m: RegExpExecArray | null;
    T_CALL.lastIndex = 0;
    while ((m = T_CALL.exec(src)) !== null) {
      totalMatches++;
      const en = unescape(m[1]);
      const zh = unescape(m[2]);
      if (!en) continue;
      if (!seen.has(en)) seen.set(en, zh);
    }
  }

  const entries = [...seen.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([en, zh]) => ({ en, zh }));

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: entries.length,
        entries,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `extracted ${entries.length} unique strings from ${totalMatches} t() calls across ${files.length} files`,
  );
  console.log(`-> ${OUT_FILE}`);
}

main();
