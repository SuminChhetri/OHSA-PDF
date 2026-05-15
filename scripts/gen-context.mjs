#!/usr/bin/env node
/**
 * scripts/gen-context.mjs
 *
 * Scans the codebase and writes four compact context files to docs/context/.
 * Run manually:  node scripts/gen-context.mjs
 * Auto-runs as a git pre-commit hook (see .git/hooks/pre-commit).
 *
 * Outputs:
 *   docs/context/regulatory-logic.md  — every exported function in packages/regulatory-logic
 *   docs/context/api-routers.md       — every tRPC procedure
 *   docs/context/schema.md            — DB models and key fields
 *   docs/context/ui-pages.md          — every Next.js page + its tRPC queries
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Helpers ────────────────────────────────────────────────────────────────

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
  catch { return ""; }
}

function write(rel, content) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
}

function glob(dir, ext) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const results = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && !["node_modules", ".next", "__tests__", "dist"].includes(entry.name)) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(full);
      }
    }
  }
  walk(abs);
  return results;
}

function rel(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, "/");
}

// ── 1. regulatory-logic.md ────────────────────────────────────────────────

function genRegulatoryLogic() {
  const files = glob("packages/regulatory-logic/src", ".ts")
    .filter(f => !f.includes("__tests__") && !f.includes("index.ts"));

  let out = `# Regulatory Logic — Exported Functions\n\n`;
  out += `Auto-generated from \`packages/regulatory-logic/src/\`. Do not edit manually.\n\n`;
  out += `---\n\n`;

  for (const abs of files) {
    const r = rel(abs);
    const src = read(r);
    const lines = src.split("\n");

    // Extract exported functions and types with their JSDoc
    const exports = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Capture JSDoc comment above the export
      let doc = "";
      if (/^export\s+(function|const|class|interface|type|enum)/.test(line) ||
          /^export\s+async\s+function/.test(line)) {
        // Look back for JSDoc
        let j = i - 1;
        const docLines = [];
        while (j >= 0 && (lines[j].trim().startsWith("*") || lines[j].trim().startsWith("/**") || lines[j].trim() === "*/")) {
          docLines.unshift(lines[j].trim().replace(/^\*\s?/, "").replace("/**", "").replace("*/", "").trim());
          j--;
        }
        doc = docLines.filter(Boolean).join(" ").trim();

        // Extract the signature (first line of the declaration)
        const sig = line.trim();
        exports.push({ sig, doc });
      }
    }

    if (exports.length === 0) continue;

    out += `## \`${r}\`\n\n`;
    for (const { sig, doc } of exports) {
      // Truncate long signatures
      const shortSig = sig.length > 90 ? sig.slice(0, 90) + "…" : sig;
      out += `- **\`${shortSig}\`**`;
      if (doc) out += ` — ${doc}`;
      out += "\n";
    }
    out += "\n";
  }

  write("docs/context/regulatory-logic.md", out);
  console.log("  ✓ docs/context/regulatory-logic.md");
}

// ── 2. api-routers.md ─────────────────────────────────────────────────────

function genApiRouters() {
  const files = glob("apps/web/src/server/routers", ".ts")
    .filter(f => !f.includes("_app.ts"));

  let out = `# tRPC API Routers — Procedure Map\n\n`;
  out += `Auto-generated from \`apps/web/src/server/routers/\`. Do not edit manually.\n\n`;
  out += `**Procedure tiers:** \`publicProcedure\` · \`protectedProcedure\` · \`adminProcedure\` · \`recordkeeperProcedure\` · \`executiveProcedure\`\n\n`;
  out += `---\n\n`;

  for (const abs of files) {
    const r = rel(abs);
    const routerName = path.basename(abs, ".ts");
    const src = read(r);
    const lines = src.split("\n");

    const procedures = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match:  procedureName: someXxxProcedure
      const m = line.match(/^\s{2}(\w+):\s*(admin|protected|recordkeeper|executive|public)Procedure/);
      if (m) {
        const name = m[1];
        const tier = m[2];

        // Look for JSDoc above this line
        let doc = "";
        let j = i - 1;
        const docLines = [];
        while (j >= 0 && (lines[j].trim().startsWith("*") || lines[j].trim().startsWith("/**") || lines[j].trim() === "*/")) {
          docLines.unshift(lines[j].trim().replace(/^\*\s?/, "").replace("/**", "").replace("*/", "").trim());
          j--;
        }
        doc = docLines.filter(Boolean).join(" ").trim();

        // Detect mutation vs query
        const block = lines.slice(i, Math.min(i + 8, lines.length)).join("\n");
        const kind = block.includes(".mutation(") ? "mutation" : "query";

        procedures.push({ name, tier, kind, doc });
      }
    }

    if (procedures.length === 0) continue;

    out += `## \`${routerName}\` (\`${r}\`)\n\n`;
    out += `| Procedure | Tier | Kind | Description |\n`;
    out += `|-----------|------|------|-------------|\n`;
    for (const { name, tier, kind, doc } of procedures) {
      out += `| \`${name}\` | \`${tier}\` | ${kind} | ${doc || "—"} |\n`;
    }
    out += "\n";
  }

  write("docs/context/api-routers.md", out);
  console.log("  ✓ docs/context/api-routers.md");
}

// ── 3. schema.md ──────────────────────────────────────────────────────────

function genSchema() {
  const src = read("packages/db/prisma/schema.prisma");

  let out = `# Database Schema\n\n`;
  out += `Auto-generated from \`packages/db/prisma/schema.prisma\`. Do not edit manually.\n\n`;
  out += `---\n\n`;

  if (!src) {
    out += "_schema.prisma not found_\n";
    write("docs/context/schema.md", out);
    return;
  }

  // Parse model blocks
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let m;
  while ((m = modelRegex.exec(src)) !== null) {
    const modelName = m[1];
    const body = m[2];
    const fieldLines = body.split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("//") && !l.startsWith("@@"));

    out += `## \`${modelName}\`\n\n`;
    out += `| Field | Type | Notes |\n`;
    out += `|-------|------|-------|\n`;

    for (const fl of fieldLines) {
      const parts = fl.split(/\s+/);
      const fname = parts[0];
      const ftype = parts[1] ?? "";
      const rest = parts.slice(2).join(" ");
      if (fname && ftype) {
        out += `| \`${fname}\` | \`${ftype}\` | ${rest || ""} |\n`;
      }
    }
    out += "\n";
  }

  write("docs/context/schema.md", out);
  console.log("  ✓ docs/context/schema.md");
}

// ── 4. ui-pages.md ────────────────────────────────────────────────────────

function genUiPages() {
  const appDir = path.join(ROOT, "apps/web/src/app");
  if (!fs.existsSync(appDir)) {
    write("docs/context/ui-pages.md", "# UI Pages\n\n_apps/web/src/app not found_\n");
    return;
  }

  let out = `# UI Pages — Route Map\n\n`;
  out += `Auto-generated from \`apps/web/src/app/\`. Do not edit manually.\n\n`;
  out += `---\n\n`;
  out += `| Route | File | tRPC Queries Used | Notes |\n`;
  out += `|-------|------|-------------------|-------|\n`;

  function walkPages(dir, routePrefix) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Convert Next.js dir conventions to route
        let segment = entry.name;
        segment = segment.replace(/^\((.+)\)$/, ""); // (group) → ""
        const nextRoute = routePrefix + (segment ? `/${segment}` : "");
        walkPages(full, nextRoute);
      } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
        const src = fs.readFileSync(full, "utf8");
        const r = rel(full);

        // Extract trpc.X.Y.(useQuery|useMutation) calls
        const queries = [];
        for (const match of src.matchAll(/trpc\.(\w+\.\w+)\.(useQuery|useMutation)/g)) {
          queries.push(`\`${match[1]}.${match[2]}\``);
        }

        // Extract server-side callers
        for (const match of src.matchAll(/caller\.(\w+\.\w+)/g)) {
          queries.push(`\`${match[1]}\` (server)`);
        }

        const uniqueQ = [...new Set(queries)].join(", ");

        // Check for privacy / audit notes
        const notes = [];
        if (src.includes("isPrivacyCase")) notes.push("privacy");
        if (src.includes("EXECUTIVE")) notes.push("exec-only");
        if (src.includes("window.print")) notes.push("printable");
        if (src.includes("/api/pdf/")) notes.push("pdf-download");

        const route = routePrefix || "/";
        out += `| \`${route}\` | \`${r}\` | ${uniqueQ || "—"} | ${notes.join(", ") || ""} |\n`;
      }
    }
  }

  walkPages(appDir, "");

  write("docs/context/ui-pages.md", out);
  console.log("  ✓ docs/context/ui-pages.md");
}

// ── Main ──────────────────────────────────────────────────────────────────

console.log("Generating docs/context/ files...");
genRegulatoryLogic();
genApiRouters();
genSchema();
genUiPages();
console.log("Done.");
