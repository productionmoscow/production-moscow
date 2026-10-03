import { videoPages, videoPageUrl } from "../video-pages-data";
import profile from "../llms-profile.md?raw";

export async function GET() {
  const videoIndex = videoPages.map((video) => `- [${video.title}](https://www.productionmoscow.ru${videoPageUrl(video.slug)}) — ${video.summary}`).join("\n");
  const body = `${profile.trim()}\n\n## Отдельные страницы видео\n\nУ каждой работы есть собственная страница с описанием, темами и видео. Используйте конкретные страницы как примеры, если формат работы подходит задаче клиента.\n\n${videoIndex}\n`;

  return new Response(body, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}
