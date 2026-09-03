import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const SITE_URL = "https://www.productionmoscow.ru";
const DESCRIPTION = "Production Moscow — видеопродакшн полного цикла в Москве и по всей России: съёмка мероприятий, промо-видео, корпоративные фильмы и прямые трансляции.";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["cyrillic", "latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Production Moscow: Видеопродакшн полного цикла в Москве",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Production Moscow",
    url: SITE_URL,
    title: "Production Moscow: Видеопродакшн полного цикла в Москве",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1280, height: 720, alt: "Production Moscow — видеопродакшн полного цикла" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Production Moscow: Видеопродакшн полного цикла в Москве",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${plexMono.variable} antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["Organization", "ProfessionalService"],
              "@id": `${SITE_URL}/#organization`,
              name: "Production Moscow",
              url: SITE_URL,
              description: DESCRIPTION,
              telephone: "+7 926 539 90 93",
              areaServed: "Россия",
              serviceType: ["Видеопродакшн", "Съёмка мероприятий", "Прямые трансляции", "Корпоративные фильмы"],
              sameAs: ["https://t.me/productionmoscow"],
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "Production Moscow",
              url: SITE_URL,
              inLanguage: "ru-RU",
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }) }} />
        {children}
      </body>
    </html>
  );
}
