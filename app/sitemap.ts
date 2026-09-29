import type { MetadataRoute } from "next";

const SITE_URL = "https://www.productionmoscow.ru";
const LAST_MODIFIED = new Date("2026-09-03T00:00:00+03:00");

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
  }));
}
