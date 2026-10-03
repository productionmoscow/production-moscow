import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { basename, extname, join, resolve, sep } from "node:path";
import { videoPageBySlug } from "../../../../video-pages-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string; asset: string }> };

const MIME_TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".m4s": "video/iso.segment",
  ".mp4": "video/mp4",
  ".aac": "audio/aac",
  ".vtt": "text/vtt; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".bin": "application/octet-stream",
};

function errorResponse(status: number) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, { params }: RouteContext) {
  const { slug, asset } = await params;
  const video = videoPageBySlug(slug);
  if (!video || video.providerId === "unconfirmed" || basename(asset) !== asset || !/^(?:master|(?:asset|playlist)-[a-f0-9]{64})\.[a-z0-9]{2,8}$/u.test(asset)) {
    return errorResponse(404);
  }

  const root = resolve(process.env.PRODUCTIONMOSCOW_VIDEO_ROOT || join(process.cwd(), "video-assets"));
  const videoDirectory = resolve(root, slug);
  const filePath = resolve(videoDirectory, asset);
  if (!filePath.startsWith(`${videoDirectory}${sep}`)) return errorResponse(404);

  let fileInfo;
  try {
    fileInfo = await stat(filePath);
  } catch {
    return errorResponse(404);
  }
  if (!fileInfo.isFile()) return errorResponse(404);

  const rangeHeader = request.headers.get("range");
  let start = 0;
  let end = fileInfo.size - 1;
  let status = 200;
  if (rangeHeader && extname(asset) !== ".m3u8") {
    const match = /^bytes=(\d*)-(\d*)$/u.exec(rangeHeader);
    if (!match || (!match[1] && !match[2])) return errorResponse(416);
    if (!match[1]) {
      const suffixLength = Number(match[2]);
      start = Math.max(0, fileInfo.size - suffixLength);
    } else {
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : end;
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= fileInfo.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${fileInfo.size}` } });
    }
    end = Math.min(end, fileInfo.size - 1);
    status = 206;
  }

  const contentLength = end - start + 1;
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": asset === "master.m3u8" ? "public, max-age=300" : "public, max-age=31536000, immutable",
    "Content-Length": String(contentLength),
    "Content-Type": MIME_TYPES[extname(asset)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (status === 206) headers.set("Content-Range", `bytes ${start}-${end}/${fileInfo.size}`);
  if (request.method === "HEAD") return new Response(null, { status, headers });

  const body = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream<Uint8Array>;
  return new Response(body, { status, headers });
}

export const HEAD = GET;
