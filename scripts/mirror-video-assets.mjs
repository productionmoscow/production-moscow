#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DEFAULT = process.env.PRODUCTIONMOSCOW_VIDEO_ROOT || "/Volumes/cloud/productionmoscow-video-assets";
const USER_AGENT = "ProductionMoscowVideoArchiver/1.0";
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_ASSET_BYTES = 256 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024 * 1024;

function argumentsFromCli(argv) {
  const options = { root: ROOT_DEFAULT, resume: false, all: false, slug: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") options.root = argv[++index];
    else if (value === "--slug") options.slug = argv[++index];
    else if (value === "--all") options.all = true;
    else if (value === "--resume") options.resume = true;
    else if (value === "--help") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  if (options.all === Boolean(options.slug) && !options.help) throw new Error("Choose exactly one of --slug <slug> or --all.");
  return options;
}

function parseVideoSourceCatalog(source) {
  const start = source.indexOf("export const videoPages:");
  if (start < 0) throw new Error("Could not find videoPages catalog in app/video-pages-data.ts.");
  const blocks = [...source.slice(start).matchAll(/\n {2}\{\n([\s\S]*?)\n {2}\},?/gu)].map((match) => match[1]);
  return blocks.map((block) => {
    const slug = block.match(/^\s*slug: "([^"]+)"/mu)?.[1];
    const title = block.match(/^\s*title: "([^"]+)"/mu)?.[1];
    const explicitId = block.match(/^\s*providerId: "([^"]+)"/mu)?.[1];
    const providerSpread = block.match(/\.\.\.(vk|kinescope)\("([^"]+)"\)/u);
    return {
      slug,
      title,
      provider: providerSpread?.[1],
      providerId: explicitId || providerSpread?.[2],
      available: Boolean(providerSpread && explicitId !== "unconfirmed"),
    };
  }).filter((record) => record.slug && record.title);
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function playlistName(url) {
  return `playlist-${hash(url.href)}.m3u8`;
}

function mediaName(url, contentType = "") {
  const sourceExtension = extname(url.pathname).toLowerCase().replace(/[^.a-z0-9]/gu, "");
  const byType = contentType.includes("mp2t") ? ".ts"
    : contentType.includes("iso.segment") ? ".m4s"
      : contentType.includes("mp4") ? ".mp4"
        : contentType.includes("aac") ? ".aac"
          : contentType.includes("vtt") ? ".vtt" : ".bin";
  const extension = /^\.[a-z0-9]{2,8}$/u.test(sourceExtension) ? sourceExtension : byType;
  return `asset-${hash(url.href)}${extension}`;
}

function requestHeaders(referer) {
  return {
    "User-Agent": USER_AGENT,
    ...(referer ? { Referer: referer } : {}),
  };
}

async function fetchText(url, referer) {
  const response = await fetch(url, { headers: requestHeaders(referer), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
  return { response, text: await response.text() };
}

function videoManifestUrls(html) {
  const normalized = html.replaceAll("\\/", "/").replaceAll("\\u0026", "&").replaceAll("\\\"", "\"");
  const candidates = [];
  let searchFrom = 0;
  while (true) {
    const manifestEnd = normalized.indexOf(".m3u8", searchFrom);
    if (manifestEnd < 0) break;
    searchFrom = manifestEnd + 5;
    const start = Math.max(normalized.lastIndexOf("https://", manifestEnd), normalized.lastIndexOf("http://", manifestEnd));
    if (start < 0) continue;
    let end = manifestEnd + 5;
    while (end < normalized.length && !["\"", "'", "<", ">", "\\", " ", "\n", "\r", "\t"].includes(normalized[end])) end += 1;
    try {
      const parsed = new URL(normalized.slice(start, end));
      if (!candidates.some((candidate) => candidate.href === parsed.href)) candidates.push(parsed);
    } catch {
      // Ignore malformed URLs in the provider's HTML.
    }
  }
  return candidates;
}

function variantsIn(lines) {
  const variants = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startsWith("#EXT-X-STREAM-INF:")) continue;
    let uriIndex = index + 1;
    while (uriIndex < lines.length && (!lines[uriIndex] || lines[uriIndex].startsWith("#"))) uriIndex += 1;
    if (uriIndex >= lines.length) continue;
    const resolution = /RESOLUTION=(\d+)x(\d+)/u.exec(lines[index]);
    const bandwidth = /(?:AVERAGE-BANDWIDTH|BANDWIDTH)=(\d+)/u.exec(lines[index]);
    variants.push({
      tag: lines[index],
      uri: lines[uriIndex],
      height: resolution ? Number(resolution[2]) : 0,
      bandwidth: bandwidth ? Number(bandwidth[1]) : 0,
    });
  }
  return variants;
}

function preferredVariant(variants) {
  if (!variants.length) return undefined;
  const atOrBelow720 = variants.filter((variant) => variant.height > 0 && variant.height <= 720);
  const pool = atOrBelow720.length ? atOrBelow720 : variants;
  return [...pool].sort((left, right) => right.height - left.height || right.bandwidth - left.bandwidth)[0];
}

function selectedMasterLines(lines, variant) {
  const audioGroup = /(?:^|,)AUDIO="([^"]+)"/u.exec(variant.tag)?.[1];
  const audioLines = lines.filter((line) => line.startsWith("#EXT-X-MEDIA:TYPE=AUDIO"));
  const selectedAudio = audioGroup
    ? audioLines.filter((line) => /(?:^|,)GROUP-ID="([^"]+)"/u.exec(line)?.[1] === audioGroup)
    : [];
  const defaultAudio = selectedAudio.find((line) => /(?:^|,)DEFAULT=YES(?:,|$)/u.test(line)) || selectedAudio[0];
  const headers = lines.filter((line) => line === "#EXTM3U"
    || line.startsWith("#EXT-X-VERSION:")
    || line === "#EXT-X-INDEPENDENT-SEGMENTS"
    || line.startsWith("#EXT-X-DEFINE:")
    || line.startsWith("#EXT-X-SESSION-DATA:")
    || line.startsWith("#EXT-X-START:"));
  return [...new Set(["#EXTM3U", ...headers.filter((line) => line !== "#EXTM3U")]), ...(defaultAudio ? [defaultAudio] : []), variant.tag, variant.uri];
}

function assertUnencrypted(lines) {
  const protectedTags = lines.filter((line) => /^#EXT-X-(?:SESSION-)?KEY:/u.test(line) && !/METHOD=NONE/u.test(line));
  if (protectedTags.length) throw new Error("The HLS source is encrypted; it was not mirrored.");
}

async function resolveSourceManifest(video) {
  if (video.provider === "kinescope") {
    const url = new URL(`https://kinescope.io/${video.providerId}/master.m3u8`);
    const { text } = await fetchText(url, `https://kinescope.io/embed/${video.providerId}`);
    return { url, text, referer: `https://kinescope.io/embed/${video.providerId}` };
  }

  const embedUrl = `https://vk.com/video_ext.php?oid=-59299172&id=${video.providerId}`;
  const { text: html } = await fetchText(embedUrl);
  const manifests = videoManifestUrls(html);
  if (!manifests.length) throw new Error("No public HLS manifest was found in the source player.");

  const candidates = [];
  for (const url of manifests) {
    try {
      const { text } = await fetchText(url, embedUrl);
      const lines = text.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
      if (!lines.includes("#EXTM3U")) continue;
      assertUnencrypted(lines);
      const variants = variantsIn(lines);
      const audioCount = lines.filter((line) => line.startsWith("#EXT-X-MEDIA:TYPE=AUDIO")).length;
      candidates.push({ url, text, lines, score: variants.length * 10 - audioCount * 2 });
    } catch {
      // Try the other player manifest. Do not expose signed source URLs in logs.
    }
  }
  candidates.sort((left, right) => right.score - left.score);
  const selected = candidates[0];
  if (!selected) throw new Error("No readable, unencrypted HLS playlist was found.");
  return { url: selected.url, text: selected.text, referer: embedUrl };
}

async function mirrorVideo(video, root, resume) {
  const directory = join(root, video.slug);
  if (!resume) {
    try {
      await stat(directory);
      throw new Error(`Destination already exists for ${video.slug}; use --resume to continue without deleting files.`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  await mkdir(directory, { recursive: true });

  const stats = { files: 0, bytes: 0, skipped: 0 };
  const localByRemote = new Map();
  const inProgress = new Set();

  async function mirrorAsset(remoteUrl, referer) {
    const url = new URL(remoteUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("A playlist references a non-HTTP asset.");
    const name = mediaName(url);
    const target = join(directory, name);
    if (resume) {
      try {
        const existing = await stat(target);
        if (existing.isFile() && existing.size > 0) {
          stats.skipped += 1;
          return name;
        }
      } catch {
        // Download the missing asset.
      }
    }
    const response = await fetch(url, { headers: requestHeaders(referer), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok || !response.body) throw new Error(`A video segment returned HTTP ${response.status}.`);
    const lengthHeader = Number(response.headers.get("content-length") || 0);
    if (lengthHeader > MAX_ASSET_BYTES) throw new Error("A media segment exceeded the safe per-file size limit.");
    const contentType = response.headers.get("content-type") || "";
    const finalName = mediaName(url, contentType);
    const finalTarget = join(directory, finalName);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_ASSET_BYTES) throw new Error("A media segment was empty or exceeded the safe per-file size limit.");
    if (stats.bytes + bytes.length > MAX_VIDEO_BYTES) throw new Error("The video exceeded the 30 GiB per-video archive limit.");
    await writeFile(finalTarget, bytes, { flag: resume ? "w" : "wx" });
    stats.files += 1;
    stats.bytes += bytes.length;
    if (stats.files % 50 === 0) {
      console.log(`${video.slug}: ${stats.files} files fetched (${Math.ceil(stats.bytes / 1024 / 1024)} MiB).`);
    }
    return finalName;
  }

  async function mirrorPlaylist(remoteUrl, localName, referer) {
    const url = new URL(remoteUrl);
    if (localByRemote.has(url.href)) return localByRemote.get(url.href);
    if (inProgress.has(url.href)) throw new Error("The playlist contains a recursive manifest reference.");
    const name = localName || playlistName(url);
    localByRemote.set(url.href, name);
    inProgress.add(url.href);

    const { text } = await fetchText(url, referer);
    const lines = text.split(/\r?\n/u).map((line) => line.trim());
    if (!lines.includes("#EXTM3U")) throw new Error("A video playlist did not contain a valid HLS manifest.");
    assertUnencrypted(lines);
    const variants = variantsIn(lines);
    const isMaster = variants.length > 0;
    let outputLines = lines;

    if (variants.length) {
      const variant = preferredVariant(variants);
      if (!variant) throw new Error("No playable HLS quality was found.");
      outputLines = selectedMasterLines(lines, variant);
    } else if (!lines.includes("#EXT-X-ENDLIST")) {
      throw new Error("The source is not a completed video playlist, so it was not archived.");
    }

    const rewritten = [];
    for (const line of outputLines) {
      if (!line) continue;
      if (line.startsWith("#")) {
        const matches = [...line.matchAll(/URI="([^"]+)"/gu)];
        let replacement = line;
        for (const match of matches) {
          const absolute = new URL(match[1], url);
          const isRenditionPlaylist = isMaster && line.startsWith("#EXT-X-MEDIA:TYPE=AUDIO");
          const local = isRenditionPlaylist || absolute.pathname.toLowerCase().endsWith(".m3u8")
            ? await mirrorPlaylist(absolute.href, undefined, referer)
            : await mirrorAsset(absolute.href, referer);
          replacement = replacement.replace(match[0], `URI="${local}"`);
        }
        rewritten.push(replacement);
      } else {
        const absolute = new URL(line, url);
        const local = isMaster || absolute.pathname.toLowerCase().endsWith(".m3u8")
          ? await mirrorPlaylist(absolute.href, undefined, referer)
          : await mirrorAsset(absolute.href, referer);
        rewritten.push(local);
      }
    }

    await writeFile(join(directory, name), `${rewritten.join("\n")}\n`, "utf8");
    stats.files += 1;
    inProgress.delete(url.href);
    return name;
  }

  const source = await resolveSourceManifest(video);
  await mirrorPlaylist(source.url.href, "master.m3u8", source.referer);
  return stats;
}

async function main() {
  const options = argumentsFromCli(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node scripts/mirror-video-assets.mjs (--slug <slug> | --all) [--root <directory>] [--resume]");
    return;
  }

  const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const source = await readFile(join(projectRoot, "app/video-pages-data.ts"), "utf8");
  const catalog = parseVideoSourceCatalog(source);
  const chosen = options.all ? catalog : catalog.filter((video) => video.slug === options.slug);
  if (!chosen.length) throw new Error(`No video page found for ${options.slug || "catalog"}.`);
  const unknown = chosen.filter((video) => !video.available);
  const available = chosen.filter((video) => video.available);
  if (!options.all && unknown.length) throw new Error(`${unknown[0].slug} has no confirmed original video source.`);

  const root = resolve(options.root);
  await mkdir(root, { recursive: true });
  const failures = [];
  console.log(`Source catalog: ${catalog.length} pages; ${available.length} confirmed source(s) selected.`);

  for (const video of available) {
    if (options.resume) {
      try {
        const completedMaster = await stat(join(root, video.slug, "master.m3u8"));
        if (completedMaster.isFile() && completedMaster.size > 0) {
          console.log(`${video.slug}: existing master playlist found; skipped.`);
          continue;
        }
      } catch {
        // No completed archive exists yet; fetch it below.
      }
    }
    try {
      const stats = await mirrorVideo(video, root, options.resume);
      console.log(`${video.slug}: ${stats.files} file(s), ${Math.ceil(stats.bytes / 1024 / 1024)} MiB downloaded, ${stats.skipped} existing file(s) reused.`);
    } catch (error) {
      failures.push({ slug: video.slug, message: error instanceof Error ? error.message : String(error) });
      console.error(`${video.slug}: ${failures.at(-1).message}`);
      if (!options.all) process.exitCode = 1;
    }
  }

  for (const video of unknown) console.warn(`${video.slug}: skipped; the original source ID is unconfirmed.`);
  if (options.all && failures.length) process.exitCode = 1;
  if (!failures.length) console.log(`Finished with ${unknown.length} unconfirmed source(s) skipped.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
