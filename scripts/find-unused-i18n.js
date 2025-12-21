#!/usr/bin/env node
// Reports i18n keys that are defined but not referenced in the source tree.
// Heuristic-based: handles direct `t("key").path` usage and common aliases.
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(ROOT, "src", "i18n", "locales");
const SOURCE_ROOT = path.join(ROOT, "src");
const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".astro"]);

function hasFlag(name) {
  return process.argv.some((a) => a === `--${name}` || a === `-${name}`);
}
function getArg(name, def) {
  const pref = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(pref));
  if (!arg) return def;
  return arg.slice(pref.length);
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (["node_modules", "dist", ".vercel", ".astro"].includes(entry.name))
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

function extractPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
  if (ts.isStringLiteralLike(name)) return name.text;
  return null;
}

function collectKeysFromObjectLiteral(node, prefix, out) {
  // Only collect leaf keys (lowest levels). Categories/containers are ignored.
  for (const prop of node.properties) {
    if (
      !ts.isPropertyAssignment(prop) &&
      !ts.isShorthandPropertyAssignment(prop)
    )
      continue;
    const key = extractPropertyName(prop.name);
    if (!key) continue;
    const nextPath = prefix ? `${prefix}.${key}` : key;
    // If this property is an object, recurse to find deeper leaves.
    if (ts.isPropertyAssignment(prop) && prop.initializer) {
      if (ts.isObjectLiteralExpression(prop.initializer)) {
        collectKeysFromObjectLiteral(prop.initializer, nextPath, out);
        continue;
      }
      // Non-object initializer => leaf
      out.add(nextPath);
      continue;
    }
    // Shorthand properties are references (e.g., index aggregators) —
    // skip them as they are categories, not leaves.
  }
}

function extractLocaleKeysFromSource(sourceText, fileName) {
  const sf = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const keys = new Set();

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!isExported) {
        ts.forEachChild(node, visit);
        return;
      }
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const init = decl.initializer;
        if (!init || !ts.isObjectLiteralExpression(init)) continue;
        collectKeysFromObjectLiteral(init, decl.name.text, keys);
      }
      return;
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sf, visit);
  return keys;
}

function extractLocaleLeavesWithValues(sourceText, fileName) {
  const sf = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const leaves = new Map();

  function collectLeaves(node, prefix) {
    for (const prop of node.properties) {
      if (
        !ts.isPropertyAssignment(prop) &&
        !ts.isShorthandPropertyAssignment(prop)
      )
        continue;
      const key = extractPropertyName(prop.name);
      if (!key) continue;
      const nextPath = prefix ? `${prefix}.${key}` : key;
      if (ts.isPropertyAssignment(prop) && prop.initializer) {
        if (ts.isObjectLiteralExpression(prop.initializer)) {
          collectLeaves(prop.initializer, nextPath);
          continue;
        }
        if (ts.isStringLiteralLike(prop.initializer)) {
          leaves.set(nextPath, prop.initializer.text);
        }
      }
    }
  }

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!isExported) return ts.forEachChild(node, visit);
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const init = decl.initializer;
        if (!init || !ts.isObjectLiteralExpression(init)) continue;
        collectLeaves(init, decl.name.text);
      }
      return;
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sf, visit);
  return leaves;
}

function readChain(node, stopNode) {
  const parts = [];
  let current = node;
  while (current && current !== stopNode) {
    if (ts.isPropertyAccessExpression(current)) {
      parts.unshift(current.name.text);
      current = current.expression;
      continue;
    }
    if (ts.isElementAccessExpression(current)) {
      if (ts.isStringLiteralLike(current.argumentExpression)) {
        parts.unshift(current.argumentExpression.text);
      } else {
        break;
      }
      current = current.expression;
      continue;
    }
    break;
  }
  return { parts, root: current };
}

function getTCallKey(callNode) {
  if (!ts.isIdentifier(callNode.expression)) return null;
  if (callNode.expression.text !== "t") return null;
  const arg = callNode.arguments[0];
  if (!ts.isStringLiteralLike(arg)) return null;
  return arg.text;
}

function collectUsedKeysFromTS(sourceText, fileName) {
  const sf = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const used = new Set();
  const aliases = new Map();

  function addPath(base, parts) {
    used.add(parts.length ? `${base}.${parts.join(".")}` : base);
  }

  function handleCall(callNode) {
    const base = getTCallKey(callNode);
    if (!base) return;
    const { parts } = readChain(callNode.parent, callNode);
    addPath(base, parts);
  }

  function handleAlias(name, callNode) {
    const base = getTCallKey(callNode);
    if (!base) return;
    aliases.set(name, base);
    used.add(base);
  }

  function handleDestructuredAlias(binding, callNode) {
    const base = getTCallKey(callNode);
    if (!base) return;
    for (const element of binding.elements) {
      if (!element.name) continue;
      const prop = element.propertyName || element.name;
      const propName =
        ts.isIdentifier(prop) || ts.isStringLiteralLike(prop)
          ? prop.text
          : null;
      if (!propName) continue;
      const boundName = ts.isIdentifier(element.name)
        ? element.name.text
        : propName;
      const full = `${base}.${propName}`;
      aliases.set(boundName, full);
      used.add(full);
    }
  }

  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isCallExpression(node.initializer)) {
        if (ts.isIdentifier(node.name)) {
          handleAlias(node.name.text, node.initializer);
        } else if (ts.isObjectBindingPattern(node.name)) {
          handleDestructuredAlias(node.name, node.initializer);
        }
      }
    }

    if (ts.isCallExpression(node)) {
      handleCall(node);
    }

    if (
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      const { parts, root } = readChain(node, null);
      if (ts.isIdentifier(root) && aliases.has(root.text)) {
        addPath(aliases.get(root.text), parts);
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sf, visit);
  return used;
}

function readChainFromText(text, startIndex) {
  const parts = [];
  let i = startIndex;
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) i += 1;
    if (text.startsWith("?.", i)) i += 2;
    else if (text[i] === ".") i += 1;
    else if (text[i] === "[") {
      i += 1;
      while (i < text.length && /\s/.test(text[i])) i += 1;
      const quote = text[i];
      if (quote !== '"' && quote !== "'") break;
      i += 1;
      let value = "";
      while (i < text.length && text[i] !== quote) {
        value += text[i];
        i += 1;
      }
      if (text[i] === quote) i += 1;
      while (i < text.length && text[i] !== "]") i += 1;
      if (text[i] === "]") i += 1;
      if (value) parts.push(value);
      continue;
    } else {
      break;
    }

    let ident = "";
    while (i < text.length && /[\w$]/.test(text[i])) {
      ident += text[i];
      i += 1;
    }
    if (ident) parts.push(ident);
    else break;
  }
  return parts;
}

function collectUsedKeysFromText(text) {
  const used = new Set();
  const regex = /t\(\s*["'`](.+?)["'`]\s*\)/g;
  let match;
  while ((match = regex.exec(text))) {
    const base = match[1];
    const chain = readChainFromText(text, match.index + match[0].length);
    used.add(chain.length ? `${base}.${chain.join(".")}` : base);
  }
  return used;
}

function extractAstroFrontmatter(text) {
  if (!text.startsWith("---")) return "";
  const end = text.indexOf("---", 3);
  if (end === -1) return "";
  return text.slice(3, end);
}

async function collectLocaleKeys() {
  const locales = await fs.readdir(LOCALES_ROOT, { withFileTypes: true });
  const localeKeys = new Map();
  const localeLeavesWithValues = new Map();

  for (const localeDir of locales) {
    if (!localeDir.isDirectory()) continue;
    const locale = localeDir.name;
    const files = await fs.readdir(path.join(LOCALES_ROOT, locale));
    const keys = new Set();
    const values = new Map();
    for (const file of files) {
      if (!file.endsWith(".ts")) continue;
      // Skip index.ts which aggregates locale modules via shorthand props.
      if (file === "index.ts") continue;
      const fullPath = path.join(LOCALES_ROOT, locale, file);
      const source = await fs.readFile(fullPath, "utf8");
      const fileKeys = extractLocaleKeysFromSource(source, fullPath);
      for (const key of fileKeys) keys.add(key);
      const fileLeaves = extractLocaleLeavesWithValues(source, fullPath);
      for (const [k, v] of fileLeaves) values.set(k, v);
    }
    localeKeys.set(locale, keys);
    localeLeavesWithValues.set(locale, values);
  }

  return { localeKeys, localeLeavesWithValues };
}

function computeAllowedRoots(localeKeys) {
  const roots = new Set();
  for (const [, keys] of localeKeys) {
    for (const key of keys) {
      const root = String(key).split(".")[0];
      if (root) roots.add(root);
    }
  }
  return roots;
}

function computeUnionLeaves(localeKeys) {
  const union = new Set();
  for (const [, keys] of localeKeys) {
    for (const k of keys) union.add(k);
  }
  return union;
}

function computeContainerPaths(unionLeaves) {
  const containers = new Set();
  for (const leaf of unionLeaves) {
    const parts = String(leaf).split(".");
    for (let i = 1; i < parts.length; i++) {
      containers.add(parts.slice(0, i).join("."));
    }
  }
  return containers;
}

async function collectUsedKeys() {
  const files = await walk(SOURCE_ROOT);
  const used = new Set();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!FILE_EXTENSIONS.has(ext)) continue;
    const text = await fs.readFile(file, "utf8");

    if (ext === ".astro") {
      const frontmatter = extractAstroFrontmatter(text);
      if (frontmatter) {
        for (const key of collectUsedKeysFromTS(
          frontmatter,
          `${file}-frontmatter`,
        )) {
          used.add(key);
        }
      }
      for (const key of collectUsedKeysFromText(text)) used.add(key);
      continue;
    }

    for (const key of collectUsedKeysFromTS(text, file)) used.add(key);
  }

  return used;
}

function compare(localeKeys, usedKeys) {
  const results = [];
  for (const [locale, keys] of localeKeys) {
    const unused = [...keys].filter((k) => !usedKeys.has(k)).sort();
    const missing = [...usedKeys].filter((k) => !keys.has(k)).sort();
    results.push({ locale, unused, missing, total: keys.size });
  }
  return results;
}

function printResults(results, usedKeys) {
  console.log(`Scanned ${usedKeys.size} used translation paths.`);
  for (const result of results) {
    console.log(
      `\n${result.locale}: ${result.total} defined, ${result.unused.length} unused, ${result.missing.length} missing`,
    );
    if (result.unused.length) {
      console.log("  Unused:");
      for (const key of result.unused) console.log(`   - ${key}`);
    }
    if (result.missing.length) {
      console.log("  Used but missing:");
      for (const key of result.missing) console.log(`   - ${key}`);
    }
  }
}

function pathToSegments(p) {
  return String(p).split(".");
}

function removeLeafFromObject(objLiteral, segments) {
  if (!ts.isObjectLiteralExpression(objLiteral))
    return { updated: objLiteral, removed: false };
  const [head, ...rest] = segments;
  let removed = false;
  const newProps = [];
  for (const prop of objLiteral.properties) {
    if (
      !ts.isPropertyAssignment(prop) &&
      !ts.isShorthandPropertyAssignment(prop)
    ) {
      newProps.push(prop);
      continue;
    }
    const key = extractPropertyName(prop.name);
    if (key !== head) {
      newProps.push(prop);
      continue;
    }
    if (rest.length === 0) {
      // Remove this leaf property
      removed = true;
      continue;
    }
    // Recurse into child object
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isObjectLiteralExpression(prop.initializer)
    ) {
      const { updated, removed: childRemoved } = removeLeafFromObject(
        prop.initializer,
        rest,
      );
      if (childRemoved) {
        const updatedProp = ts.factory.updatePropertyAssignment(
          prop,
          prop.name,
          updated,
        );
        newProps.push(updatedProp);
        removed = true;
      } else {
        newProps.push(prop);
      }
      continue;
    }
    // Path does not exist as object chain
    newProps.push(prop);
  }
  const updated = ts.factory.updateObjectLiteralExpression(
    objLiteral,
    newProps,
  );
  return { updated, removed };
}

async function pruneUnusedLeaves(results) {
  console.log("\nPruning unused leaf keys (--prune) ...");
  for (const { locale, unused } of results) {
    const dir = path.join(LOCALES_ROOT, locale);
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (!file.endsWith(".ts") || file === "index.ts") continue;
      const fullPath = path.join(dir, file);
      const sourceText = await fs.readFile(fullPath, "utf8");
      const sf = ts.createSourceFile(
        fullPath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      let changed = false;
      const updatedStatements = [];
      for (const stmt of sf.statements) {
        if (!ts.isVariableStatement(stmt)) {
          updatedStatements.push(stmt);
          continue;
        }
        const isExported = stmt.modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.ExportKeyword,
        );
        if (!isExported) {
          updatedStatements.push(stmt);
          continue;
        }
        const declList = stmt.declarationList;
        const newDecls = [];
        for (const decl of declList.declarations) {
          if (!ts.isIdentifier(decl.name)) {
            newDecls.push(decl);
            continue;
          }
          const rootName = decl.name.text;
          if (
            !decl.initializer ||
            !ts.isObjectLiteralExpression(decl.initializer)
          ) {
            newDecls.push(decl);
            continue;
          }
          let obj = decl.initializer;
          for (const leaf of unused) {
            const segs = pathToSegments(leaf);
            if (segs[0] !== rootName) continue;
            const { updated, removed } = removeLeafFromObject(
              obj,
              segs.slice(1),
            );
            if (removed) {
              obj = updated;
              changed = true;
            }
          }
          const newDecl = ts.factory.updateVariableDeclaration(
            decl,
            decl.name,
            decl.exclamationToken,
            decl.type,
            obj,
          );
          newDecls.push(newDecl);
        }
        const newDeclList = ts.factory.updateVariableDeclarationList(
          declList,
          newDecls,
        );
        const newStmt = ts.factory.updateVariableStatement(
          stmt,
          stmt.modifiers,
          newDeclList,
        );
        updatedStatements.push(newStmt);
      }
      if (changed) {
        const updatedFile = ts.factory.updateSourceFile(sf, updatedStatements);
        const printed = printer.printFile(updatedFile);
        await fs.writeFile(fullPath, printed, "utf8");
        console.log(`  Pruned ${locale}/${file}`);
      }
    }
  }
}

function hashString(str) {
  return crypto.createHash("sha1").update(str).digest("hex").slice(0, 8);
}

async function ensureCommonIndex(locale) {
  const indexPath = path.join(LOCALES_ROOT, locale, "index.ts");
  let text = await fs.readFile(indexPath, "utf8");
  if (!/import\s*\{\s*common\s*\}/.test(text)) {
    text = `import { common } from "./common";\n` + text;
  }
  if (!/export\s+const\s+\w+\s*=\s*\{[\s\S]*\}/.test(text)) {
    await fs.writeFile(indexPath, text, "utf8");
    return;
  }
  // Insert common into export object if missing
  text = text.replace(
    /export\s+const\s+\w+\s*=\s*\{([\s\S]*?)\};/,
    (m, inner) => {
      if (/\bcommon\b/.test(inner)) return m;
      const withComma = inner.trim().length ? inner + "\n  , common" : "common";
      return m.replace(inner, withComma);
    },
  );
  await fs.writeFile(indexPath, text, "utf8");
}

async function updateCommonFile(locale, entries) {
  const filePath = path.join(LOCALES_ROOT, locale, "common.ts");
  let exists = true;
  try {
    await fs.access(filePath);
  } catch {
    exists = false;
  }
  let text;
  if (!exists) {
    const props = [...entries]
      .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
      .join("\n");
    text = `export const common = {\n  strings: {\n${props}\n  },\n};\n`;
  } else {
    text = await fs.readFile(filePath, "utf8");
    if (!/strings:\s*\{/.test(text)) {
      const props = [...entries]
        .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
        .join("\n");
      text = `export const common = {\n  strings: {\n${props}\n  },\n};\n`;
    } else {
      for (const [k, v] of entries) {
        const re = new RegExp(`\\b${k}\\s*:`);
        if (!re.test(text)) {
          text = text.replace(/strings:\s*\{([\s\S]*?)\}/, (m, inner) => {
            const insert = `\n    ${k}: ${JSON.stringify(v)},`;
            return m.replace(inner, `${inner}${insert}\n  `);
          });
        }
      }
    }
  }
  await fs.writeFile(filePath, text, "utf8");
  await ensureCommonIndex(locale);
}

function findDuplicateStrings(localeLeavesWithValues, threshold) {
  const enMap = localeLeavesWithValues.get("en") || new Map();
  const svMap = localeLeavesWithValues.get("sv") || new Map();
  const byValue = new Map();
  for (const [pathKey, val] of enMap) {
    if (!byValue.has(val)) byValue.set(val, []);
    byValue.get(val).push(pathKey);
  }
  const candidates = [];
  for (const [val, keys] of byValue) {
    if (keys.length >= threshold) {
      const haveSv = keys.every((k) => svMap.has(k));
      if (haveSv) candidates.push({ value: val, keys });
    }
  }
  return candidates;
}

function buildConsolidationMapping(candidates, localeLeavesWithValues) {
  const mappings = new Map();
  const enMap = localeLeavesWithValues.get("en") || new Map();
  const svMap = localeLeavesWithValues.get("sv") || new Map();
  for (const { value, keys } of candidates) {
    const id = `s_${hashString(value)}`;
    for (const k of keys) mappings.set(k, id);
  }
  const commonEntriesEn = new Map();
  const commonEntriesSv = new Map();
  for (const { value, keys } of candidates) {
    const id = `s_${hashString(value)}`;
    commonEntriesEn.set(id, value);
    const svVal = svMap.get(keys[0]);
    commonEntriesSv.set(id, svVal ?? value);
  }
  return { mappings, commonEntriesEn, commonEntriesSv };
}

function replaceUsageInText(text, oldFullPath, newFullPath) {
  const parts = pathToSegments(oldFullPath);
  const base = parts[0];
  const chain = parts.slice(1).join(".");
  const re = new RegExp(
    `t\\(\\s*['\"]${base}['\"]\\s*\\)\\s*(?:\\.\\s*[\\w$]+\\s*)*`,
    "g",
  );
  return text.replace(re, (m) => {
    const normalized = m.replace(/\s+/g, "");
    if (!normalized.endsWith(`.${chain}`)) return m;
    const newId = newFullPath.split(".").pop();
    return `t('common').strings.${newId}`;
  });
}

async function applyConsolidationToSources(mappings) {
  const files = await walk(SOURCE_ROOT);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!FILE_EXTENSIONS.has(ext)) continue;
    let text = await fs.readFile(file, "utf8");
    let changed = false;
    for (const [oldPath, id] of mappings) {
      const before = text;
      text = replaceUsageInText(text, oldPath, `common.strings.${id}`);
      if (text !== before) changed = true;
    }
    if (changed) {
      await fs.writeFile(file, text, "utf8");
      console.log(`  Updated ${file}`);
    }
  }
}

async function consolidateRepeatedStrings(
  localeLeavesWithValues,
  threshold,
  apply,
) {
  console.log(
    `\nConsolidating repeated strings (--consolidate; min=${threshold}; apply=${apply}) ...`,
  );
  const candidates = findDuplicateStrings(localeLeavesWithValues, threshold);
  if (!candidates.length) {
    console.log("  No duplicates above threshold found.");
    return;
  }
  const { mappings, commonEntriesEn, commonEntriesSv } =
    buildConsolidationMapping(candidates, localeLeavesWithValues);
  console.log("  Candidates:");
  for (const { value, keys } of candidates) {
    const id = `s_${hashString(value)}`;
    console.log(`   - ${id}: \"${value}\" -> ${keys.join(", ")}`);
  }
  if (!apply) {
    console.log(
      "  Dry-run: pass --apply to write common entries and update sources.",
    );
    return;
  }
  await updateCommonFile("en", commonEntriesEn);
  await updateCommonFile("sv", commonEntriesSv);
  await applyConsolidationToSources(mappings);
}

async function main() {
  const { localeKeys, localeLeavesWithValues } = await collectLocaleKeys();
  const usedKeysRaw = await collectUsedKeys();
  // Filter used keys to only i18n roots that exist in locales to avoid
  // false-positives from non-i18n strings.
  const allowedRoots = computeAllowedRoots(localeKeys);
  const unionLeaves = computeUnionLeaves(localeKeys);
  const containerPaths = computeContainerPaths(unionLeaves);
  const usedKeys = new Set(
    [...usedKeysRaw]
      .filter((k) => allowedRoots.has(String(k).split(".")[0]))
      // Remove category/container paths; we only report leaf usages.
      .filter((k) => !containerPaths.has(String(k))),
  );
  const results = compare(localeKeys, usedKeys);
  printResults(results, usedKeys);

  // Autoprune unused leaf keys when requested
  if (hasFlag("prune")) {
    await pruneUnusedLeaves(results);
  }

  // Consolidate repeated strings when requested
  if (hasFlag("consolidate")) {
    const threshold = parseInt(getArg("min", "2"), 10) || 2;
    const apply = hasFlag("apply");
    await consolidateRepeatedStrings(localeLeavesWithValues, threshold, apply);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
