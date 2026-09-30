#!/usr/bin/env node

import { mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { load } from "cheerio";

export const DEFAULT_BASE_URL = "https://zoom-prokat.ru/";
export const DEFAULT_DELAY_MS = 350;
export const DEFAULT_OUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/zoom-prokat",
);
export const DEFAULT_XLSX_PATH = path.join(
  DEFAULT_OUT_DIR,
  "zoom-prokat-prices.xlsx",
);
export const XLSX_HEADERS = ["category", "name", "price_per_day_rub"];

export const EXCLUDED_ROOT_CATEGORY_IDS = new Set(["773"]);

const PHOTO_LENS_ROOT_CATEGORY_ID = "733";
const CINEMA_LENS_ROOT_CATEGORY_ID = "747";
const PHOTO_LENS_MOUNT_SUBCATEGORY_NAMES = new Set([
  "Canon EF и EF-S",
  "Canon RF",
  "Sony E",
  "Nikon F",
  "Nikon Z",
  "MFT",
  "Fujifilm XF",
  "Fujifilm GF",
]);

const USER_AGENT =
  process.env.ZOOM_USER_AGENT ??
  "ProductionMoscowPriceBot/1.0 (+https://productionmoscow.ru/)";

function normalizeWhitespace(value = "") {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function absoluteUrl(value, baseUrl) {
  if (!value) return null;
  return new URL(value, baseUrl).href;
}

export function parseRubles(value) {
  const normalized = normalizeWhitespace(value).replace(/\s/g, "");
  const match = normalized.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;

  const number = Number(match[0].replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function periodFromLabel(value) {
  const label = normalizeWhitespace(value).toLowerCase();
  if (label.includes("сут") || label.includes("рабоч")) return "day";
  if (label.includes("недел")) return "week";
  if (label.includes("месяц")) return "month";
  return null;
}

function categoryFromUrl(value, baseUrl) {
  const url = new URL(value, baseUrl);
  const categoryId = url.searchParams.get("categoryID");
  if (!categoryId || !/^\d+$/.test(categoryId) || categoryId === "1") {
    return null;
  }

  const categoryUrl = new URL("/index.php", baseUrl);
  categoryUrl.searchParams.set("categoryID", categoryId);
  const categorySlug = url.searchParams.get("category_slug");
  if (categorySlug) categoryUrl.searchParams.set("category_slug", categorySlug);

  return { id: categoryId, name: "", url: categoryUrl.href };
}

function mergeCategory(categories, category, baseUrl) {
  const existing = categories.get(category.id);
  if (existing) {
    if (!existing.name && category.name) existing.name = category.name;
    if (category.name) existing.aliases.add(category.name);
    return;
  }

  categories.set(category.id, {
    id: category.id,
    name: category.name,
    aliases: new Set(category.name ? [category.name] : []),
    url: absoluteUrl(category.url, baseUrl),
  });
}

function finalizeCategories(categories) {
  return [...categories.values()]
    .map((category) => ({
      id: category.id,
      name: category.name,
      aliases: [...category.aliases].sort((a, b) => a.localeCompare(b, "ru")),
      url: category.url,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export function extractRootCategories(html, baseUrl = DEFAULT_BASE_URL) {
  const $ = load(html);
  const categories = new Map();

  $(".x_cat_name a[href*='categoryID=']").each((_, element) => {
    const href = $(element).attr("href");
    const category = href ? categoryFromUrl(href, baseUrl) : null;
    const name = normalizeWhitespace($(element).text());
    if (!category || !name) return;
    if (
      EXCLUDED_ROOT_CATEGORY_IDS.has(category.id) ||
      name.toLowerCase() === "светофильтры"
    ) {
      return;
    }
    category.name = name;
    mergeCategory(categories, category, baseUrl);
  });

  return finalizeCategories(categories);
}

export function extractSubcategories(html, baseUrl = DEFAULT_BASE_URL) {
  const $ = load(html);
  const categories = new Map();

  $("#x_search_p_list .n_cat_category p.n_cat_p a[href*='categoryID=']").each(
    (_, element) => {
      const href = $(element).attr("href");
      const category = href ? categoryFromUrl(href, baseUrl) : null;
      const name = normalizeWhitespace($(element).text());
      if (!category || !name) return;
      category.name = name;
      mergeCategory(categories, category, baseUrl);
    },
  );

  return finalizeCategories(categories);
}

export function extractCategories(html, baseUrl = DEFAULT_BASE_URL) {
  const $ = load(html);
  const categories = new Map();

  $("a[href*='categoryID=']").each((_, element) => {
    const href = $(element).attr("href");
    const category = href ? categoryFromUrl(href, baseUrl) : null;
    const name = normalizeWhitespace($(element).text());
    if (!category || !name) return;
    category.name = name;
    mergeCategory(categories, category, baseUrl);
  });

  return finalizeCategories(categories);
}

function tableWithCurrentPrices($, $card) {
  return $card
    .find("table.x_cat_table_price")
    .toArray()
    .reverse()
    .find((element) => {
      const labels = $(element)
        .find("tr")
        .first()
        .find("td")
        .map((_, cell) => periodFromLabel($(cell).text()))
        .get();
      return labels.some(Boolean) && $(element).find(".x_cat_table_price_p").length;
    });
}

export function extractPrices($, $card) {
  const table = tableWithCurrentPrices($, $card);
  if (!table) return { day: null, week: null, month: null };

  const headers = $(table)
    .find("tr")
    .first()
    .find("td")
    .map((_, element) => periodFromLabel($(element).text()))
    .get();
  const values = $(table)
    .find(".x_cat_table_price_p")
    .map((_, element) => parseRubles($(element).text()))
    .get();

  const prices = { day: null, week: null, month: null };
  headers.forEach((period, index) => {
    if (period && prices[period] === null) prices[period] = values[index] ?? null;
  });
  return prices;
}

export function extractCinemaMount(name) {
  const normalized = normalizeWhitespace(name);
  if (/\bARRI\s+PL\b/i.test(normalized)) return "PL";
  if (/\bCanon\s+EF\b/i.test(normalized)) return "Canon EF";
  if (/\bCanon\s+RF\b/i.test(normalized)) return "Canon RF";
  if (/\bSony\s+E\b/i.test(normalized)) return "Sony E";
  if (/\bNikon\s+Z\b/i.test(normalized)) return "Nikon Z";
  if (/\bMFT\b/i.test(normalized)) return "MFT";
  return null;
}

function categoryForProduct(category, name) {
  if (category.id !== CINEMA_LENS_ROOT_CATEGORY_ID) return category;

  const mount = extractCinemaMount(name) ?? "БАЙОНЕТ НЕ УКАЗАН";
  return {
    ...category,
    id: `${CINEMA_LENS_ROOT_CATEGORY_ID}:mount:${mount}`,
    name: `Кинообъективы ${mount}`,
  };
}

export function extractProducts(html, category, pageUrl, baseUrl = DEFAULT_BASE_URL) {
  const $ = load(html);
  const products = [];

  $("form.product_brief_block").each((_, element) => {
    const $card = $(element);
    const productId = normalizeWhitespace(
      $card.find("input[name='productID']").attr("value") ||
        $card.attr("rel") ||
        "",
    );
    const name = normalizeWhitespace(
      $card.find("table.prdbrief_name a").first().text(),
    );
    const productHref = $card.find("table.prdbrief_name a").first().attr("href");

    if (!productId || !name || !productHref) return;

    const productCategory = categoryForProduct(category, name);
    products.push({
      id: productId,
      name,
      url: absoluteUrl(productHref, baseUrl),
      prices: extractPrices($, $card),
      categories: [
        {
          id: productCategory.id,
          name: productCategory.name,
          url: productCategory.url,
        },
      ],
      sourceUrl: pageUrl,
    });
  });

  return products;
}

function mergeProduct(existing, incoming) {
  if (!existing) return incoming;

  const categories = [...existing.categories, ...incoming.categories].filter(
    (category, index, all) =>
      all.findIndex((candidate) => candidate.id === category.id) === index,
  );
  const prices = { ...existing.prices };
  for (const period of ["day", "week", "month"]) {
    if (prices[period] === null && incoming.prices[period] !== null) {
      prices[period] = incoming.prices[period];
    }
  }

  return {
    ...existing,
    prices,
    categories: categories.sort((a, b) => a.name.localeCompare(b.name, "ru")),
  };
}

export function allProductsUrlForCategory(categoryUrl) {
  const url = new URL(categoryUrl);
  url.searchParams.set("ukey", "index.php");
  url.searchParams.set("show_all", "yes");
  url.searchParams.delete("offset");
  return url.href;
}

function categoryWithLensSubcategory(rootCategory, subcategory) {
  const isMountSubcategory = PHOTO_LENS_MOUNT_SUBCATEGORY_NAMES.has(
    subcategory.name,
  );
  return {
    ...subcategory,
    id: `${rootCategory.id}:${subcategory.id}`,
    name: isMountSubcategory
      ? `${rootCategory.name} ${subcategory.name}`
      : subcategory.name,
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchHtml(
  url,
  { fetchImpl = fetch, timeoutMs = 25_000, retries = 4 } = {},
) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-language": "ru-RU,ru;q=0.9",
          "user-agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) return await response.text();

      const error = new Error(`HTTP ${response.status} for ${url}`);
      const retryable =
        response.status === 403 ||
        response.status === 408 ||
        response.status === 425 ||
        response.status === 429 ||
        response.status >= 500;
      if (!retryable) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    }

    if (attempt < retries) await wait(attempt * 1_500);
  }

  throw lastError ?? new Error(`Unable to fetch ${url}`);
}

export async function scrapeCatalog({
  baseUrl = DEFAULT_BASE_URL,
  delayMs = DEFAULT_DELAY_MS,
  logger = console.error,
  fetchImpl = fetch,
} = {}) {
  const normalizedBaseUrl = new URL(baseUrl).href;
  const homeHtml = await fetchHtml(normalizedBaseUrl, { fetchImpl });
  const categories = extractRootCategories(homeHtml, normalizedBaseUrl);
  if (!categories.length) {
    throw new Error("No root catalog categories were found on the source site");
  }

  const products = new Map();
  const emptyCategories = [];

  for (const [index, category] of categories.entries()) {
    const url = allProductsUrlForCategory(category.url);
    logger(`[zoom-prokat] category ${index + 1}/${categories.length}: ${category.name}`);
    const html = await fetchHtml(url, { fetchImpl });
    let pageProducts;

    if (category.id === PHOTO_LENS_ROOT_CATEGORY_ID) {
      const subcategories = extractSubcategories(html, normalizedBaseUrl).filter(
        (subcategory) => subcategory.id !== category.id,
      );

      if (subcategories.length) {
        pageProducts = [];
        for (const [subcategoryIndex, subcategory] of subcategories.entries()) {
          const subcategoryUrl = allProductsUrlForCategory(subcategory.url);
          logger(
            `[zoom-prokat]   lens mount ${subcategoryIndex + 1}/${subcategories.length}: ${subcategory.name}`,
          );
          const subcategoryHtml = await fetchHtml(subcategoryUrl, {
            fetchImpl,
          });
          pageProducts.push(
            ...extractProducts(
              subcategoryHtml,
              categoryWithLensSubcategory(category, subcategory),
              subcategoryUrl,
              normalizedBaseUrl,
            ),
          );
          if (delayMs > 0 && subcategoryIndex < subcategories.length - 1) {
            await wait(delayMs);
          }
        }
      } else {
        pageProducts = extractProducts(html, category, url, normalizedBaseUrl);
      }
    } else {
      pageProducts = extractProducts(html, category, url, normalizedBaseUrl);
    }

    if (!pageProducts.length) {
      emptyCategories.push(category.name);
      logger(`[zoom-prokat]   no products`);
    } else {
      for (const product of pageProducts) {
        products.set(product.id, mergeProduct(products.get(product.id), product));
      }
      logger(
        `[zoom-prokat]   ${pageProducts.length} products, ${products.size} unique`,
      );
    }

    if (delayMs > 0 && index < categories.length - 1) await wait(delayMs);
  }

  if (!products.size) throw new Error("No products were found in the source catalog");

  const fetchedAt = new Date().toISOString();
  const sortedProducts = [...products.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "ru"),
  );
  return {
    source: {
      name: "Zoom Prokat",
      baseUrl: normalizedBaseUrl,
      fetchedAt,
      categoryCount: categories.length,
      emptyCategoryCount: emptyCategories.length,
      emptyCategories,
      productCount: sortedProducts.length,
      productsWithDayPrice: sortedProducts.filter(
        (product) => product.prices.day !== null,
      ).length,
    },
    products: sortedProducts,
  };
}

export function catalogToRows(catalog) {
  return catalog.products.map((product) => ({
    category: product.categories
      .map((category) => category.name)
      .filter(Boolean)
      .join(" | "),
    name: product.name,
    price_per_day_rub: product.prices.day,
  }));
}

export async function writeCatalogXlsx(catalog, outputPath = DEFAULT_XLSX_PATH) {
  const rows = catalogToRows(catalog);
  if (!rows.length) throw new Error("Refusing to write an empty price table");

  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Production Moscow";
  workbook.modified = new Date(catalog.source.fetchedAt);

  const sheet = workbook.addWorksheet("equipment_prices", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "category", key: "category", width: 36 },
    { header: "name", key: "name", width: 72 },
    { header: "price_per_day_rub", key: "price_per_day_rub", width: 20 },
  ];
  sheet.addRows(rows);
  sheet.addTable({
    name: "equipment_prices",
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: XLSX_HEADERS.map((name) => ({ name })),
    rows: rows.map((row) => XLSX_HEADERS.map((header) => row[header])),
  });
  sheet.getColumn("price_per_day_rub").numFmt = "#,##0";
  sheet.getColumn("price_per_day_rub").alignment = { horizontal: "right" };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 22;
  sheet.showGridLines = false;

  try {
    await workbook.xlsx.writeFile(temporaryPath);
    await rename(temporaryPath, outputPath);
  } finally {
    await unlink(temporaryPath).catch(() => undefined);
  }
}

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

function printHelp() {
  console.log(`Usage:
  npm run zoom:scrape -- [options]

Options:
  --delay-ms 350       Pause between root category requests
  --out-file PATH      Output XLSX path (default: data/zoom-prokat/zoom-prokat-prices.xlsx)
  --base-url URL       Source catalog URL
`);
}

async function runScrape(options) {
  const outputPath = path.resolve(options["out-file"] || DEFAULT_XLSX_PATH);
  const catalog = await scrapeCatalog({
    baseUrl: options["base-url"] || DEFAULT_BASE_URL,
    delayMs: numberOption(options, "delay-ms", DEFAULT_DELAY_MS),
  });
  await writeCatalogXlsx(catalog, outputPath);
  console.log(
    JSON.stringify(
      {
        ...catalog.source,
        output: outputPath,
      },
      null,
      2,
    ),
  );
}

export async function main(argv = process.argv.slice(2)) {
  const [command = "scrape", ...rest] = argv;
  const options = parseArgs(rest);

  if (options.help || command === "help") {
    printHelp();
    return;
  }
  if (command !== "scrape") throw new Error(`Unknown command: ${command}`);
  await runScrape(options);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(`[zoom-prokat] ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}
