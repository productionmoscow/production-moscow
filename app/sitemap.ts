import type { MetadataRoute } from "next";
import { videoPages, videoPageUrl } from "./video-pages-data";

const SITE_URL = "https://www.productionmoscow.ru";
const LAST_MODIFIED = new Date("2026-10-03T00:00:00+03:00");
const AGENT_PROFILE_MODIFIED = LAST_MODIFIED;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/case",
    "/event",
    "/stream",
    "/food",
    "/politika",
    "/studio",
    "/kiselev",
    "/golf",
    "/pokavsedoma",
    "/vsacademy",
    "/gnivts",
    "/contact",
    "/gpt",
    "/conf",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  })).concat(videoPages.map((video) => ({
    url: `${SITE_URL}${videoPageUrl(video.slug)}`,
    lastModified: new Date("2026-10-03T00:00:00+03:00"),
    changeFrequency: "monthly" as const,
    priority: video.priority === "high" ? 0.8 : 0.65,
  }))).concat([
    {
      url: `${SITE_URL}/llms.txt`,
      lastModified: AGENT_PROFILE_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/llms.md`,
      lastModified: AGENT_PROFILE_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ]);
}
