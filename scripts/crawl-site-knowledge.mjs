#!/usr/bin/env node

import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";

const DEFAULT_BASE_URL = "https://www.productionmoscow.ru";
const DEFAULT_OUTPUT_DIR = resolve(process.cwd(), "data/site-knowledge");
const USER_AGENT = "ProductionMoscowKnowledgeCrawler/1.0 (+https://www.productionmoscow.ru/contact)";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_DELAY_MS = 250;
const DEFAULT_MAX_PAGES = 200;

const args = parseArgs(process.argv.slice(2));
const baseUrl = new URL(args.baseUrl || process.env.PRODUCTIONMOSCOW_SITE_URL || DEFAULT_BASE_URL);
const outputDir = resolve(args.outputDir || process.env.PRODUCTIONMOSCOW_KNOWLEDGE_DIR || DEFAULT_OUTPUT_DIR);
const maxPages = Number(args.maxPages || process.env.PRODUCTIONMOSCOW_CRAWLER_MAX_PAGES || DEFAULT_MAX_PAGES);
const delayMs = Number(args.delayMs || process.env.PRODUCTIONMOSCOW_CRAWLER_DELAY_MS || DEFAULT_DELAY_MS);
const runId = new Date().toISOString().slice(0, 10);

const seen = new Set();
const pages = [];
const errors = [];

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const [key, inlineValue] = item.slice(2).split("=", 2);
    const normalizedKey = key.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
    result[normalizedKey] = inlineValue ?? argv[index + 1] ?? "true";
    if (inlineValue === undefined && argv[index + 1] && !argv[index + 1].startsWith("--")) index += 1;
  }
  return result;
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function hash(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function cleanText(value) {
  return decodeEntities(value
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/p>/giu, "\n")
    .replace(/<[^>]+>/gu, " "))
    .replace(/[ \t\f\r]+/gu, " ")
    .replace(/\n[ \t]+/gu, "\n")
    .replace(/[ \t]+\n/gu, "\n")
    .trim();
}

function htmlAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "iu"));
  return match ? decodeEntities(match[1]) : "";
}

function stripUnwantedHtml(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/giu, "")
    .replace(/<style\b[\s\S]*?<\/style>/giu, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/giu, "")
    .replace(/<template\b[\s\S]*?<\/template>/giu, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/giu, "")
    .replace(/<nav\b[\s\S]*?<\/nav>/giu, "")
    .replace(/<header\b[\s\S]*?<\/header>/giu, "")
    .replace(/<footer\b[\s\S]*?<\/footer>/giu, "")
    .replace(/<button\b[\s\S]*?<\/button>/giu, "");
}

function mainHtml(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/iu)?.[1];
  return stripUnwantedHtml(main || html);
}

function extractMeta(html, name, attribute = "name") {
  const pattern = new RegExp(`<meta\\b[^>]*${attribute}\\s*=\\s*["']${name}["'][^>]*>`, "iu");
  const tag = html.match(pattern)?.[0] || "";
  return htmlAttribute(tag, "content");
}

function extractTitle(html) {
  return cleanText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1] || "");
}

function extractCanonical(html, pageUrl) {
  const tag = html.match(/<link\b[^>]*rel\s*=\s*["'][^"']*canonical[^"']*["'][^>]*>/iu)?.[0] || "";
  const value = htmlAttribute(tag, "href");
  return value ? normalizeUrl(value, pageUrl) || pageUrl : pageUrl;
}

function extractBlocks(html) {
  const blocks = [];
  const pattern = /<(h[1-6]|p|li|blockquote|figcaption|dt|dd|summary)\b[^>]*>([\s\S]*?)<\/\1>/giu;
  for (const match of html.matchAll(pattern)) {
    const text = cleanText(match[2]);
    if (text) blocks.push({ kind: match[1].toLowerCase(), text });
  }
  return blocks;
}

function blocksToMarkdown(blocks) {
  const result = [];
  let last = "";
  for (const block of blocks) {
    const value = block.kind.startsWith("h")
      ? `${"#".repeat(Number(block.kind.slice(1)))} ${block.text}`
      : block.kind === "li"
        ? `- ${block.text}`
        : block.text;
    if (value !== last) result.push(value);
    last = value;
  }
  return result.join("\n\n").trim();
}

function extractTables(html) {
  const tables = [];
  for (const tableMatch of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/giu)) {
    const rows = [];
    for (const rowMatch of tableMatch[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/giu)) {
      const cells = [];
      for (const cellMatch of rowMatch[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/giu)) {
        const cell = cleanText(cellMatch[1]).replace(/\|/gu, "\\|");
        if (cell) cells.push(cell);
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

function tablesToMarkdown(tables) {
  return tables.map((rows, tableIndex) => {
    const width = Math.max(...rows.map((row) => row.length));
    const normalized = rows.map((row) => [...row, ...Array.from({ length: width - row.length }, () => "")]);
    const header = normalized[0];
    const separator = header.map(() => "---");
    const body = normalized.slice(1);
    return [
      `### Таблица ${tableIndex + 1}`,
      `| ${header.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      ...body.map((row) => `| ${row.join(" | ")} |`),
    ].join("\n");
  }).join("\n\n");
}

function extractMedia(html, pageUrl) {
  const media = [];
  const add = (item) => {
    if (!item.url || media.some((existing) => existing.url === item.url)) return;
    media.push({ ...item, url: normalizeExternalUrl(item.url, pageUrl) || item.url });
  };

  for (const match of html.matchAll(/<iframe\b([^>]*)>/giu)) {
    const url = htmlAttribute(match[0], "src");
    if (url) add({ type: "video", platform: platformFor(url), url, title: htmlAttribute(match[0], "title") });
  }
  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/giu)) {
    const url = htmlAttribute(match[0], "data-video-url");
    if (!url) continue;
    const title = cleanText(match[2].match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/iu)?.[1] || "");
    add({ type: "video", platform: platformFor(url), url, title });
  }
  for (const match of html.matchAll(/\bdata-video-url\s*=\s*["']([^"']+)["']/giu)) {
    add({ type: "video", platform: platformFor(match[1]), url: decodeEntities(match[1]), title: "" });
  }
  for (const match of html.matchAll(/<(?:video|source)\b([^>]*)>/giu)) {
    const url = htmlAttribute(match[0], "src");
    if (url) add({ type: "video", platform: platformFor(url), url, title: htmlAttribute(match[0], "title") });
  }
  for (const match of html.matchAll(/<img\b([^>]*)>/giu)) {
    const url = htmlAttribute(match[0], "src") || htmlAttribute(match[0], "data-src");
    if (url) add({ type: "image", platform: platformFor(url), url, title: htmlAttribute(match[0], "alt") });
  }
  return media;
}

function platformFor(url) {
  try {
    return new URL(url).hostname.replace(/^www\./iu, "");
  } catch {
    return "unknown";
  }
}

function extractLinks(html, pageUrl, siteOrigin) {
  const internal = [];
  const external = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/giu)) {
    const rawHref = htmlAttribute(match[0], "href");
    const href = /^(?:t\.me|telegram\.me|vk\.com|instagram\.com)\//iu.test(rawHref) ? `https://${rawHref}` : rawHref;
    const text = cleanText(match[2]);
    const url = normalizeUrl(href, pageUrl);
    if (!url) continue;
    if (new URL(url).origin === siteOrigin) {
      if (!internal.some((item) => item.url === url)) internal.push({ text, url });
    } else if (!external.some((item) => item.url === url)) {
      external.push({ text, url });
    }
  }
  return { internal, external };
}

function extractContacts(html) {
  const text = cleanText(html);
  const phones = [...new Set(text.match(/(?:\+7|8)[\s().-]*\d[\s().-]*\d[\s().-]*\d[\s().-]*\d[\s().-]*\d[\s().-]*\d[\s().-]*\d[\s().-]*\d[\s().-]*\d[\s().-]*\d/gu) || [])];
  const emails = [...new Set(text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/giu) || [])];
  const social = [...new Set((html.match(/https?:\/\/(?:t\.me|telegram\.me|vk\.com|instagram\.com)\/[a-z\d_./-]+/giu) || [])
    .map((item) => decodeEntities(item))
    .filter((item) => !/vk\.com\/video_ext\.php/iu.test(item)))];
  return { phones, emails, social };
}

function normalizeUrl(value, pageUrl) {
  if (!value) return "";
  try {
    const url = new URL(value, pageUrl);
    if (!/^https?:$/iu.test(url.protocol)) return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_|fbclid|gclid|yclid)/iu.test(key)) url.searchParams.delete(key);
    }
    if (url.searchParams.toString() === "") url.search = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/u, "");
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeExternalUrl(value, pageUrl) {
  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return "";
  }
}

function isAllowedSiteUrl(value, siteOrigin) {
  try {
    return new URL(value).origin === siteOrigin;
  } catch {
    return false;
  }
}

function isDisallowedPath(url, disallowPaths) {
  try {
    const pathname = new URL(url).pathname;
    return disallowPaths.some((path) => path !== "/" && pathname.startsWith(path));
  } catch {
    return true;
  }
}

function parseRobots(text) {
  const sitemapUrls = [...text.matchAll(/^sitemap:\s*(\S+)/gimu)].map((match) => match[1]);
  const disallowPaths = [];
  let appliesToAll = false;
  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (/^user-agent:\s*\*/iu.test(trimmed)) appliesToAll = true;
    if (appliesToAll && /^disallow:\s*(\S+)/iu.test(trimmed)) {
      const value = trimmed.replace(/^disallow:\s*/iu, "");
      if (value) disallowPaths.push(value);
    }
  }
  return { sitemapUrls, disallowPaths };
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html, application/xml, text/xml, */*" },
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, contentType: response.headers.get("content-type") || "", text, finalUrl: response.url };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOptional(url) {
  try {
    return await fetchText(url);
  } catch (error) {
    errors.push({ url, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

async function discoverSitemapUrls(siteUrl, robots) {
  const candidates = [...robots.sitemapUrls, new URL("/sitemap.xml", siteUrl).toString()];
  const urls = new Set();
  for (const candidate of candidates) {
    const sitemapUrl = normalizeUrl(candidate, siteUrl);
    if (!sitemapUrl || !isAllowedSiteUrl(sitemapUrl, siteUrl.origin)) continue;
    const response = await fetchOptional(sitemapUrl);
    if (!response?.ok) continue;
    const locations = [...response.text.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/giu)].map((match) => decodeEntities(match[1]));
    for (const location of locations) {
      const normalized = normalizeUrl(location, sitemapUrl);
      if (normalized && isAllowedSiteUrl(normalized, siteUrl.origin)) urls.add(normalized);
    }
  }
  urls.add(siteUrl.toString().replace(/\/$/u, "/"));
  return [...urls];
}

function pageType(pageUrl) {
  const path = new URL(pageUrl).pathname;
  if (path === "/" || path === "") return "home";
  if (/\/contact$|\/conf$/iu.test(path)) return "contacts";
  if (/\/gpt$/iu.test(path)) return "assistant";
  if (/\/case$|\/event$|\/stream$|\/food$|\/studio$|\/golf$|\/vsacademy$|\/gnivts$|\/kiselev$|\/pokavsedoma$|\/politika$/iu.test(path)) return "services";
  return "pages";
}

function pageId(pageUrl) {
  const pathname = new URL(pageUrl).pathname.replace(/^\/+|\/+$/gu, "") || "home";
  return pathname.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/gu, "").toLocaleLowerCase("ru-RU") || "home";
}

function yamlValue(value) {
  return JSON.stringify(value ?? "");
}

function firstParagraph(blocks) {
  return blocks.find((block) => !block.kind.startsWith("h") && block.kind !== "li")?.text || "";
}

function buildMarkdown(page) {
  const lines = [
    "---",
    `id: ${yamlValue(page.id)}`,
    `title: ${yamlValue(page.title || page.url)}`,
    `type: ${yamlValue(page.type)}`,
    `url: ${yamlValue(page.url)}`,
    `canonical_url: ${yamlValue(page.canonicalUrl)}`,
    "source: \"productionmoscow.ru\"",
    "language: \"ru\"",
    "visibility: \"public\"",
    "status: \"active\"",
    `last_seen: ${yamlValue(page.lastSeen)}`,
    `content_hash: ${yamlValue(page.contentHash)}`,
    "---",
    "",
    `# ${page.title || page.url}`,
    "",
    "## Кратко",
    "",
    page.description || page.summary || "На странице нет отдельного meta-описания.",
    "",
    "## Содержимое страницы",
    "",
    page.content || "На странице не найден текстовый контент.",
  ];

  if (page.tables) lines.push("", "## Таблицы", "", page.tables);
  if (page.media.length) {
    lines.push("", "## Медиа", "");
    for (const media of page.media) {
      lines.push(
        `- Название: ${media.title || "без названия"}`,
        `  - Тип: ${media.type}`,
        `  - Платформа: ${media.platform}`,
        `  - URL: ${media.url}`,
      );
    }
  }
  if (page.contacts.phones.length || page.contacts.emails.length || page.contacts.social.length) {
    lines.push("", "## Контакты, найденные на странице", "");
    for (const phone of page.contacts.phones) lines.push(`- Телефон: ${phone}`);
    for (const email of page.contacts.emails) lines.push(`- Email: ${email}`);
    for (const social of page.contacts.social) lines.push(`- Социальная сеть: ${social}`);
  }
  if (page.links.internal.length || page.links.external.length) {
    lines.push("", "## Ссылки", "");
    for (const link of page.links.internal) lines.push(`- ${link.text || link.url}: ${link.url}`);
    for (const link of page.links.external) lines.push(`- ${link.text || link.url}: ${link.url}`);
  }
  return `${lines.join("\n").replace(/\n{3,}/gu, "\n\n").trim()}\n`;
}

function relativeMarkdownPath(page) {
  return join("active", page.type, `${page.id}.md`);
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeAtomic(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, content, "utf8");
  await rename(temporary, path);
}

async function crawlPage(url, siteOrigin, disallowPaths) {
  const response = await fetchText(url);
  if (!response.ok || !/^text\/html/iu.test(response.contentType)) {
    throw new Error(`HTTP ${response.status} ${response.contentType}`);
  }
  const sourceHtml = response.text;
  const pageHtml = mainHtml(sourceHtml);
  const blocks = extractBlocks(pageHtml);
  const content = blocksToMarkdown(blocks);
  const tables = tablesToMarkdown(extractTables(sourceHtml));
  const links = extractLinks(sourceHtml, url, siteOrigin);
  const media = extractMedia(sourceHtml, url);
  const contacts = extractContacts(sourceHtml);
  const canonicalUrl = extractCanonical(sourceHtml, url);
  const title = extractTitle(sourceHtml);
  const description = extractMeta(sourceHtml, "description");
  const page = {
    id: pageId(canonicalUrl || url),
    title,
    type: pageType(canonicalUrl || url),
    url,
    canonicalUrl,
    description,
    summary: firstParagraph(blocks),
    content,
    tables,
    links,
    media,
    contacts,
    lastSeen: runId,
    contentHash: hash(JSON.stringify({ title, description, content, tables, links, media, contacts })),
    rawHtml: sourceHtml,
  };
  page.markdown = buildMarkdown(page);
  if (isDisallowedPath(url, disallowPaths)) throw new Error("blocked by robots.txt");
  return page;
}

async function savePage(page, previousPage, archiveDir) {
  const markdownPath = join(outputDir, relativeMarkdownPath(page));
  if (previousPage && previousPage.content_hash !== page.contentHash) {
    const previousPath = join(outputDir, previousPage.file);
    try {
      await mkdir(join(outputDir, archiveDir, dirname(previousPage.file)), { recursive: true });
      await copyFile(previousPath, join(outputDir, archiveDir, previousPage.file));
    } catch {
      // A missing previous file is not fatal; the new active copy is still useful.
    }
  }
  await writeAtomic(markdownPath, page.markdown);
  const rawPath = join("raw", runId, "pages", `${page.id}.html`);
  await writeAtomic(join(outputDir, rawPath), page.rawHtml);
  return { ...page, file: relativeMarkdownPath(page), raw_file: rawPath };
}

async function writeIndex(savedPages) {
  const lines = [
    "# Production Moscow — индекс материалов",
    "",
    `Последнее обновление: ${runId}`,
    "",
    "Это индекс фактически найденных публичных страниц сайта. Файлы не дополняются предположениями.",
    "",
  ];
  for (const type of [...new Set(savedPages.map((page) => page.type))].sort()) {
    lines.push(`## ${type}`, "");
    for (const page of savedPages.filter((item) => item.type === type).sort((a, b) => a.title.localeCompare(b.title, "ru"))) {
      lines.push(`- [${page.title || page.url}](./${page.file.replace(/^active\//u, "")}) — ${page.url}`);
    }
    lines.push("");
  }
  await writeAtomic(join(outputDir, "active/_index.md"), `${lines.join("\n").trim()}\n`);
}

function manifestPage(page) {
  return {
    id: page.id,
    title: page.title,
    type: page.type,
    url: page.url,
    canonical_url: page.canonicalUrl,
    file: page.file,
    raw_file: page.raw_file,
    status: "active",
    last_seen: page.lastSeen,
    content_hash: page.contentHash,
  };
}

async function main() {
  if (!Number.isFinite(maxPages) || maxPages < 1) throw new Error("--max-pages должен быть положительным числом");
  await mkdir(outputDir, { recursive: true });

  const robotsResponse = await fetchOptional(new URL("/robots.txt", baseUrl).toString());
  const robots = parseRobots(robotsResponse?.ok ? robotsResponse.text : "");
  const discovered = await discoverSitemapUrls(baseUrl, robots);
  const queue = discovered.filter((url) => !isDisallowedPath(url, robots.disallowPaths)).slice(0, maxPages);
  const previousManifest = await readJson(join(outputDir, "manifest.json"), { pages: [] });
  const previousById = new Map(previousManifest.pages.map((page) => [page.id, page]));
  const archiveDir = join("archive", runId);

  while (queue.length && pages.length < maxPages) {
    const url = queue.shift();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    try {
      const page = await crawlPage(url, baseUrl.origin, robots.disallowPaths);
      const saved = await savePage(page, previousById.get(page.id), archiveDir);
      pages.push(saved);
      for (const link of page.links.internal) {
        if (!seen.has(link.url) && !queue.includes(link.url) && !isDisallowedPath(link.url, robots.disallowPaths)) queue.push(link.url);
      }
      console.log(`saved ${page.type}/${page.id}: ${url}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ url, error: message });
      console.error(`skip ${url}: ${message}`);
    }
    if (queue.length) await sleep(delayMs);
  }

  const previousIds = new Set(previousManifest.pages.map((page) => page.id));
  const currentIds = new Set(pages.map((page) => page.id));
  const missing = previousManifest.pages
    .filter((page) => !currentIds.has(page.id))
    .map((page) => ({ ...page, status: "not_seen", not_seen_on: runId }));
  const manifest = {
    crawl_id: runId,
    source: baseUrl.toString(),
    crawled_at: new Date().toISOString(),
    pages: [...pages.map(manifestPage), ...missing],
    errors,
  };
  await writeAtomic(join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeIndex(pages);

  const changes = [];
  for (const page of pages) {
    const previous = previousById.get(page.id);
    changes.push({
      crawl_id: runId,
      id: page.id,
      url: page.url,
      change: !previous ? "new" : previous.content_hash === page.contentHash ? "unchanged" : "updated",
      content_hash: page.contentHash,
    });
  }
  for (const page of missing) {
    if (previousIds.has(page.id)) changes.push({ crawl_id: runId, id: page.id, url: page.url, change: "not_seen" });
  }
  await writeAtomic(join(outputDir, "changes.ndjson"), `${changes.map((item) => JSON.stringify(item)).join("\n")}\n`);

  console.log(JSON.stringify({
    outputDir,
    discovered: discovered.length,
    saved: pages.length,
    notSeen: missing.length,
    errors: errors.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
