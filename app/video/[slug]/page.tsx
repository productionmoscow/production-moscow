import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Site from "../../site";
import { videoPageBySlug, videoPages, videoPageUrl } from "../../video-pages-data";

const SITE_URL = "https://www.productionmoscow.ru";

type VideoPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return videoPages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = videoPageBySlug(slug);
  if (!video) return { title: "Видео не найдено | Production Moscow", robots: { index: false, follow: false } };

  const url = `${SITE_URL}${videoPageUrl(video.slug)}`;
  return {
    title: `${video.title} | Портфолио Production Moscow`,
    description: video.summary,
    keywords: video.keywords,
    alternates: { canonical: videoPageUrl(video.slug) },
    openGraph: {
      type: "video.other",
      locale: "ru_RU",
      siteName: "Production Moscow",
      url,
      title: video.title,
      description: video.summary,
      images: [{ url: "/og.png", width: 1280, height: 720, alt: `Production Moscow — ${video.title}` }],
      videos: video.providerId !== "unconfirmed" ? [{ url: `${SITE_URL}/media/video/${video.slug}/master.m3u8` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description: video.summary,
      images: ["/og.png"],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1 } },
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { slug } = await params;
  const video = videoPageBySlug(slug);
  if (!video) notFound();
  return <Site page="video" videoSlug={video.slug} />;
}
