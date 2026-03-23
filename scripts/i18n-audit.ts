/**
 * I18N Audit Script
 * Scans all locale JSON files and reports missing keys across EN/RO/RU.
 * 
 * Usage: npx tsx scripts/i18n-audit.ts
 */
import fs from "fs";
import path from "path";

const LOCALES_DIR = path.resolve(__dirname, "../src/locales");
const LANGUAGES = ["en", "ro", "ru"];

interface AuditResult {
  namespace: string;
  totalKeys: number;
  missingByLang: Record<string, string[]>;
  extraByLang: Record<string, string[]>;
  coverageByLang: Record<string, number>;
}

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadNamespace(lang: string, ns: string): Record<string, unknown> | null {
  const filePath = path.join(LOCALES_DIR, lang, `${ns}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    console.error(`❌ Failed to parse ${filePath}`);
    return null;
  }
}

function auditNamespace(ns: string): AuditResult {
  const allKeysByLang: Record<string, Set<string>> = {};
  const masterKeys = new Set<string>();

  for (const lang of LANGUAGES) {
    const data = loadNamespace(lang, ns);
    const keys = data ? flattenKeys(data) : [];
    allKeysByLang[lang] = new Set(keys);
    keys.forEach(k => masterKeys.add(k));
  }

  const missingByLang: Record<string, string[]> = {};
  const extraByLang: Record<string, string[]> = {};
  const coverageByLang: Record<string, number> = {};

  // EN is source of truth
  const enKeys = allKeysByLang["en"] || new Set<string>();

  for (const lang of LANGUAGES) {
    const langKeys = allKeysByLang[lang] || new Set<string>();
    const missing = [...enKeys].filter(k => !langKeys.has(k));
    const extra = [...langKeys].filter(k => !enKeys.has(k));
    missingByLang[lang] = missing;
    extraByLang[lang] = extra;
    coverageByLang[lang] = enKeys.size > 0
      ? Math.round(((enKeys.size - missing.length) / enKeys.size) * 100)
      : 100;
  }

  return {
    namespace: ns,
    totalKeys: enKeys.size,
    missingByLang,
    extraByLang,
    coverageByLang,
  };
}

function main() {
  // Discover namespaces from EN directory
  const enDir = path.join(LOCALES_DIR, "en");
  if (!fs.existsSync(enDir)) {
    console.error("❌ EN locale directory not found:", enDir);
    process.exit(1);
  }

  const namespaces = fs.readdirSync(enDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║     I18N AUDIT REPORT — AI-IDEI PLATFORM     ║");
  console.log("╚══════════════════════════════════════════════╝\n");
  console.log(`Languages: ${LANGUAGES.join(", ")}`);
  console.log(`Namespaces: ${namespaces.length}\n`);

  let totalMissing = 0;
  let totalKeys = 0;
  const results: AuditResult[] = [];

  for (const ns of namespaces) {
    const result = auditNamespace(ns);
    results.push(result);
    totalKeys += result.totalKeys;

    const hasMissing = LANGUAGES.some(l => result.missingByLang[l]?.length > 0);

    console.log(`\n📦 ${ns.toUpperCase()} (${result.totalKeys} keys)`);
    console.log(`   Coverage: ${LANGUAGES.map(l => `${l}=${result.coverageByLang[l]}%`).join("  ")}`);

    if (hasMissing) {
      for (const lang of LANGUAGES) {
        const missing = result.missingByLang[lang];
        if (missing.length > 0) {
          totalMissing += missing.length;
          console.log(`   ⚠️  ${lang}: ${missing.length} missing`);
          missing.slice(0, 5).forEach(k => console.log(`       - ${k}`));
          if (missing.length > 5) console.log(`       ... and ${missing.length - 5} more`);
        }
      }
    } else {
      console.log("   ✅ Complete");
    }
  }

  // Summary
  console.log("\n" + "═".repeat(50));
  console.log("SUMMARY");
  console.log("═".repeat(50));
  console.log(`Total namespaces: ${namespaces.length}`);
  console.log(`Total keys (EN): ${totalKeys}`);
  console.log(`Total missing translations: ${totalMissing}`);

  const overallCoverage = LANGUAGES.map(l => {
    const langMissing = results.reduce((sum, r) => sum + (r.missingByLang[l]?.length || 0), 0);
    return { lang: l, coverage: totalKeys > 0 ? Math.round(((totalKeys - langMissing) / totalKeys) * 100) : 100 };
  });

  console.log(`\nOverall coverage:`);
  overallCoverage.forEach(({ lang, coverage }) => {
    const icon = coverage === 100 ? "✅" : coverage >= 90 ? "⚠️" : "❌";
    console.log(`  ${icon} ${lang}: ${coverage}%`);
  });

  if (totalMissing > 0) {
    console.log(`\n❌ FAIL: ${totalMissing} missing translations detected.`);
    process.exit(1);
  } else {
    console.log("\n✅ PASS: All translations complete across all languages.");
    process.exit(0);
  }
}

main();
