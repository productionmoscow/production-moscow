#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_BASE_URL,
  DEFAULT_DELAY_MS,
  scrapeCatalog,
  writeCatalogXlsx,
} from "./zoom-prokat.mjs";

const DEFAULT_OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../data/zoom-prokat-knowledge",
);
const DEFAULT_XLSX_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../data/zoom-prokat/zoom-prokat-prices.xlsx",
);
const CHUNK_SIZE = 80;

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) continue;
    const [key, inlineValue] = argument.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return options;
}

function numberOption(options, name, fallback) {
  if (options[name] === undefined) return fallback;
  const value = Number(options[name]);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`--${name} must be a non-negative number`);
  }
  return value;
}

function safeSlug(value) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "uncategorized";
}

function markdownText(value) {
  return String(value || "").replace(/\r?\n/gu, " ").replace(/\|/gu, "\\|").trim();
}

function money(value) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
}

function frontMatterValue(value) {
  return JSON.stringify(value);
}

function hash(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function groupProducts(catalog) {
  const groups = new Map();

  for (const product of catalog.products) {
    if (product.prices.day === null) continue;
    const categories = product.categories.length > 0
      ? product.categories
      : [{ id: "uncategorized", name: "Без категории", url: catalog.source.baseUrl }];

    for (const category of categories) {
      const key = category.id || "uncategorized";
      const group = groups.get(key) || {
        id: key,
        name: category.name || "Без категории",
        url: category.url || catalog.source.baseUrl,
        products: new Map(),
      };
      group.products.set(product.id, product);
      groups.set(key, group);
    }
  }

  return [...groups.values()]
    .map((group) => ({ ...group, products: [...group.products.values()] }))
    .sort((left, right) => left.name.localeCompare(right.name, "ru"));
}

function splitIntoChunks(products) {
  const chunks = [];
  for (let index = 0; index < products.length; index += CHUNK_SIZE) {
    chunks.push(products.slice(index, index + CHUNK_SIZE));
  }
  return chunks;
}

function pageMarkdown({ catalog, group, products, part, totalParts }) {
  const title = totalParts > 1
    ? `Аренда: ${group.name}, часть ${part} из ${totalParts}`
    : `Аренда: ${group.name}`;
  const rows = products
    .map((product) => `- ${markdownText(product.name)} — ${money(product.prices.day)} ₽/сутки`)
    .join("\n");
  return [
    "---",
    `id: ${frontMatterValue(`zoom-prokat-${safeSlug(group.id)}-${part}`)}`,
    `title: ${frontMatterValue(title)}`,
    "type: rental-equipment",
    `canonical_url: ${frontMatterValue(catalog.source.baseUrl)}`,
    `source_url: ${frontMatterValue(group.url)}`,
    `fetched_at: ${frontMatterValue(catalog.source.fetchedAt)}`,
    "status: active",
    "---",
    "",
    `# ${title}`,
    "",
    `Источник: [Zoom Prokat](${catalog.source.baseUrl})`,
    `Дата обновления каталога: ${catalog.source.fetchedAt}`,
    "",
    "Цена ниже указана за одни сутки по каталогу на дату обновления. Наличие, комплектность, даты и окончательные условия аренды нужно подтвердить у проката отдельно.",
    "",
    `Позиций в этом фрагменте: ${products.length}`,
    "",
    rows,
    "",
  ].join("\n");
}

function manifestFor(catalog, pages) {
  return {
    schema_version: 1,
    crawl_id: catalog.source.fetchedAt.slice(0, 10),
    source: catalog.source.baseUrl,
    source_name: catalog.source.name,
    crawled_at: catalog.source.fetchedAt,
    product_count: catalog.source.productCount,
    products_with_day_price: catalog.source.productsWithDayPrice,
    category_count: catalog.source.categoryCount,
    empty_categories: catalog.source.emptyCategories,
    pages,
  };
}

async function writeKnowledge(catalog, outputDir) {
  const root = path.resolve(outputDir);
  const temporaryActive = path.join(root, `.active-${process.pid}`);
  const active = path.join(root, "active");
  await rm(temporaryActive, { recursive: true, force: true });
  await mkdir(path.join(temporaryActive, "equipment"), { recursive: true, mode: 0o700 });

  const pages = [];
  for (const group of groupProducts(catalog)) {
    const chunks = splitIntoChunks(group.products);
    for (const [index, products] of chunks.entries()) {
      const part = index + 1;
      const title = chunks.length > 1
        ? `Аренда: ${group.name}, часть ${part} из ${chunks.length}`
        : `Аренда: ${group.name}`;
      const fileName = `${safeSlug(group.id)}-${part}.md`;
      const relativeFile = `active/equipment/${fileName}`;
      const content = pageMarkdown({ catalog, group, products, part, totalParts: chunks.length });
      await writeFile(path.join(temporaryActive, "equipment", fileName), content, { mode: 0o600 });
      pages.push({
        id: `zoom-prokat-${safeSlug(group.id)}-${part}`,
        title,
        type: "rental-equipment",
        url: catalog.source.baseUrl,
        canonical_url: catalog.source.baseUrl,
        file: relativeFile,
        status: "active",
        last_seen: catalog.source.fetchedAt.slice(0, 10),
        content_hash: hash(content),
        product_count: products.length,
      });
    }
  }

  if (!pages.length) throw new Error("No rental knowledge pages were generated");
  await mkdir(root, { recursive: true, mode: 0o700 });
  await rm(active, { recursive: true, force: true });
  await rename(temporaryActive, active);
  const manifest = manifestFor(catalog, pages);
  const manifestTemporary = path.join(root, `.manifest-${process.pid}.json`);
  await writeFile(manifestTemporary, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await rename(manifestTemporary, path.join(root, "manifest.json"));
  return { pageCount: pages.length, manifest };
}

function printHelp() {
  console.log(`Usage:
  node scripts/zoom-prokat-knowledge.mjs [options]

Options:
  --delay-ms 350       Pause between source requests
  --output-dir PATH    RAG output directory
  --xlsx-out PATH      Excel output path
  --base-url URL       Source catalog URL
`);
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }

  const catalog = await scrapeCatalog({
    baseUrl: options["base-url"] || DEFAULT_BASE_URL,
    delayMs: numberOption(options, "delay-ms", DEFAULT_DELAY_MS),
  });
  const xlsxPath = path.resolve(options["xlsx-out"] || DEFAULT_XLSX_PATH);
  await writeCatalogXlsx(catalog, xlsxPath);
  const knowledge = await writeKnowledge(catalog, options["output-dir"] || DEFAULT_OUTPUT_DIR);
  console.log(JSON.stringify({ ...catalog.source, ...knowledge, xlsx: xlsxPath }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(`[zoom-prokat-knowledge] ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}
