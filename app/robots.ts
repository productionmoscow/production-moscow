import type { MetadataRoute } from "next";

const SITE_URL = "https://www.productionmoscow.ru";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/2camtrans" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
