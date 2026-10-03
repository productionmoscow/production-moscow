import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Production Moscow home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<html lang="ru">/i);
  assert.match(html, /<title>Production Moscow: Видеопродакшн полного цикла в Москве<\/title>/i);
  assert.match(html, /rel="canonical" href="https:\/\/www\.productionmoscow\.ru\/?"/);
  assert.match(html, /Надёжный видеопродакшн для мероприятий и бизнеса/);
  assert.match(html, /Форумы, конференции и корпоративные события\./);
  assert.match(html, /Полный цикл производства: съёмка, трансляции и монтаж/);
  assert.match(html, /ПОСМОТРИТЕ НАШ ШОУРИЛ/);
  assert.match(html, /Что мы можем\?/);
  for (const title of ["Прямые трансляции", "Фильмы для мероприятий", "Промо-ролики", "Съемка мероприятий", "Музыкальные клипы для кавер-групп", "Документальные фильмы"]) {
    assert.match(html, new RegExp(title));
  }
  for (const title of ["Картинка", "Проработка", "Прозрачность", "Соблюдение сроков"]) {
    assert.match(html, new RegExp(title));
  }

  const nav = html.slice(html.indexOf('<nav class="desktop-nav"'), html.indexOf("</nav>") + 6);
  const labels = ["Портфолио", "Трансляции", "Мероприятия", "ФудФото"].map((label) => nav.indexOf(`>${label}</a>`));
  assert.ok(labels.every((position) => position >= 0));
  assert.deepEqual(labels, [...labels].sort((a, b) => a - b));
  assert.doesNotMatch(html, /Антон Чернов/);
  assert.doesNotMatch(html, /Промо для ведущих/);
  assert.doesNotMatch(html, /promodemo/);
  assert.match(html, /class="site-footer"/);
  assert.match(html, /ProductionMoscow\.ru/);
});

test("all Production Moscow public routes render their primary content", async () => {
  const expected = {
    "/case": "Портфолио",
    "/event": "Съёмка корпоративных мероприятий",
    "/stream": "ПРЯМЫЕ",
    "/contact": "Мы сами можем",
    "/gpt": "AI-ассистент Production Moscow",
    "/conf": "Политика в отношении обработки персональных данных",
  };

  for (const [pathname, heading] of Object.entries(expected)) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.ok(html.includes(heading), pathname);
    assert.match(html, /class="site-footer"/, pathname);
    assert.doesNotMatch(html, /antonchernov\.ru|Видеограф Антон Чернов/, pathname);
  }
});

test("portfolio page renders its playlists with links to self-hosted video pages", async () => {
  const response = await render("/case");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Фильмы для показа на мероприятях/);
  assert.match(html, /Ведущим, агентствам, декораторам, диджеям, всем-всем-всем/);
  assert.match(html, /Мы любим снимать необычные и обычные проекты/);
  assert.match(html, /мероприятиям - будь то День рождения компании или человека/);
  assert.match(html, /Подкаст Адиса Маммо «Темная Сторона»\. Гость - Виктор Комаров/);
  assert.match(html, /Операторский скилл - часовой подкаст/);
  assert.equal((html.match(/class="video-gallery"/g) ?? []).length, 3);
  assert.equal((html.match(/class="video-choice /g) ?? []).length, 17);
  for (const slug of ["olga-nechaeva-film", "upyr-host-promo", "dark-side-podcast"]) {
    assert.match(html, new RegExp(`href="/video/${slug}"`));
  }
  for (const title of ["Открывающий ролик конференции EdCrunch", "Коробков и Зубков", "Лео в гостях у Жени Резниченко"]) {
    assert.match(html, new RegExp(title));
  }
});

test("stream page preserves source content, media, process and FAQ", async () => {
  const response = await render("/stream");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /ПРЯМЫЕ<br\/>ТРАНСЛЯЦИИ/);
  assert.match(html, /Мы проводим трансляции на мероприятиях любого формата/);
  assert.match(html, /онлайн-платформ - будь то ВК, Телеграм или заграничные сервисы/);
  assert.match(html, /href="\/video\/fsa-grappling-backstage"/);
  assert.doesNotMatch(html, /kinescope\.io\/embed\/jCnWpQG5onNrYKL3A7fDue/);
  assert.equal((html.match(/class="video-gallery"/g) ?? []).length, 1);
  assert.equal((html.match(/class="video-choice /g) ?? []).length, 4);
  for (const title of ["FSA", "Презентация книги", "Летний турнир по грэпплингу", "Новогодний онлайн-корпоратив", "Получение технического задания", "Подготовка оборудования и площадки", "Проведение трансляции"]) {
    assert.match(html, new RegExp(title));
  }
  for (const slug of ["fsa-grappling-livestream", "book-presentation-stream", "summer-grappling-stream", "new-year-online-corporate"]) {
    assert.match(html, new RegExp(`href="/video/${slug}"`));
  }
  assert.doesNotMatch(html, /(?:kinescope\.io\/embed|vk\.com\/video_ext\.php)/);
  assert.equal((html.match(/<details>/g) ?? []).length, 8);
  assert.match(html, /thanks-hytest\.png/);
  assert.match(html, /thanks-sber\.png/);
  assert.match(html, /thanks-resanta\.png/);
});

test("event page renders all source videos, copy and FAQ", async () => {
  const response = await render("/event");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /ПЕРВЫЙ ИВЕНТ-ПРОДАКШН/);
  assert.match(html, /под ключ в Москве \| ProductionMoscow/);
  assert.match(html, /фото \/\/ видео \/\/ трансляции/);
  assert.match(html, /Наши видео говорят сами за себя:/);
  assert.match(html, /❓ Какие мероприятия вы снимаете\?/);
  assert.match(html, /до\u00a0события, чтобы показать их на событии/);
  assert.match(html, /От подготовки технического задания для фотографов и видеографов/);
  assert.equal((html.match(/class="video-choice /g) ?? []).length, 11);
  assert.equal((html.match(/<details>/g) ?? []).length, 7);
  assert.match(html, /съёмка в вертолёте/);
});

test("all remaining sitemap pages preserve original text, links, media and documents", async () => {
  const expected = {
    "/politika": ["Политика в отношении обработки персональных данных", "Федерального закона от 27.07.2006."],
    "/studio": ["Белое на Белом - студия предметной съемки", "https://youtu.be/8O5nBIbacZo"],
    "/kiselev": ["АНДРЕЙ КИСЕЛЕВ", "https://instagram.com/videokisel"],
    "/golf": ["Трансляция турнира по гольфу 22 мая 2025 года", "Камера FX3;12;7190;2;172560"],
    "/pokavsedoma": ["Смета съемок и постпродакшена", "Оператор-постановщик;1;50000;50000"],
    "/vsacademy": ["Расчет сметы на создание фотозоны в VS academy", "Falcon Eyes A3303"],
    "/gnivts": ["КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", "ГНИВЦ необходимо не просто рассказывать"],
  };

  for (const [pathname, [primary, source]] of Object.entries(expected)) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, new RegExp(primary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), pathname);
    assert.match(html, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), pathname);
    assert.match(html, /class="source-record"/, pathname);
    assert.match(html, /class="source-inventory-grid"/, pathname);
  }

  const food = await (await render("/food")).text();
  assert.match(food, /Фуд-фото и меню/);
  assert.match(food, /class="food-menu-frame"/);
  assert.match(food, /https:\/\/heyzine\.com\/flip-book\/b61cad3e63\.html/);
  assert.ok(food.indexOf("food-gallery-section") < food.indexOf("food-menu-section"));
  assert.equal((food.match(/class="food-gallery-item"/g) ?? []).length, 37);
  assert.equal((food.match(/<img src="https:\/\/static\.tildacdn\.com\//g) ?? []).length, 38);
  assert.equal((food.match(/class="food-gallery-link"/g) ?? []).length, 37);
  assert.doesNotMatch(food, /2025-01-20_121715\.jpg/);
  assert.doesNotMatch(food, /tild3762-6266-4232-a166-346133363839\/__\.png/);
  assert.match(food, /<h2>КОНТАКТЫ<\/h2>/);
  assert.doesNotMatch(food, /ОСТАВЬТЕ КОНТАКТЫ/);
  assert.doesNotMatch(food, /79585647717/);
  assert.doesNotMatch(food, /Открыть оригинал/);

  const studio = await (await render("/studio")).text();
  assert.equal((studio.match(/class="source-video-card"/g) ?? []).length, 7);
  assert.ok((studio.match(/class="source-image"/g) ?? []).length >= 40);
  const golf = await (await render("/golf")).text();
  assert.equal((golf.match(/class="source-table"/g) ?? []).length, 3);
  const vsacademy = await (await render("/vsacademy")).text();
  assert.equal((vsacademy.match(/class="source-table"/g) ?? []).length, 2);
});

test("crawler metadata exposes the new canonical host", async () => {
  const robotsResponse = await render("/robots.txt");
  assert.equal(robotsResponse.status, 200);
  const robots = await robotsResponse.text();
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Sitemap: https:\/\/www\.productionmoscow\.ru\/sitemap\.xml/);

  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  for (const path of ["/", "/case", "/event", "/stream", "/food", "/politika", "/studio", "/kiselev", "/golf", "/pokavsedoma", "/vsacademy", "/gnivts", "/contact", "/gpt", "/conf"]) {
    assert.match(sitemap, new RegExp(`<loc>https://www\\.productionmoscow\\.ru${path}<\\/loc>`));
  }
  const videoPaths = [...sitemap.matchAll(/<loc>https:\/\/www\.productionmoscow\.ru\/video\/([^<]+)<\/loc>/gu)].map((match) => match[1]);
  assert.equal(videoPaths.length, 34);
  assert.equal(new Set(videoPaths).size, 34);
  assert.doesNotMatch(sitemap, /antonchernov|promodemo|wedding|\/mk/);
});

test("all 34 video pages are independently rendered and indexed for agents", async () => {
  const sitemap = await (await render("/sitemap.xml")).text();
  const videoSlugs = [...sitemap.matchAll(/<loc>https:\/\/www\.productionmoscow\.ru\/video\/([^<]+)<\/loc>/gu)].map((match) => match[1]);
  const llms = await (await render("/llms.md")).text();
  assert.equal(videoSlugs.length, 34);

  for (const slug of videoSlugs) {
    const response = await render(`/video/${slug}`);
    assert.equal(response.status, 200, slug);
    const html = await response.text();
    assert.match(html, /class="video-detail-hero(?:\s|")/u, slug);
    assert.match(html, /rel="canonical"/, slug);
    assert.ok(llms.includes(`/video/${slug}`), slug);
    if (["dmitry-dibrov-podcast", "olga-nechaeva-film", "itagency-team-film", "sberbank-winter-games", "fsa-grappling-livestream"].includes(slug)) {
      assert.match(html, /marketing-tech\.ru\/cases\/productionmoscow-ru\//, slug);
    }
    if (slug === "kazminerals-corporate") {
      assert.match(html, /исходный видеофайл/i, slug);
      assert.doesNotMatch(html, new RegExp(`/media/video/${slug}/master\\.m3u8`), slug);
    } else {
      assert.ok(html.includes(`/media/video/${slug}/master.m3u8`), slug);
    }
  }
});

test("Anton-only routes are not published", async () => {
  for (const pathname of ["/promodemo", "/mk", "/wed", "/wedding"]) {
    const response = await render(pathname);
    assert.equal(response.status, 404, pathname);
  }
});

test("private two-camera checklist is noindex and omitted from sitemap", async () => {
  const response = await render("/2camtrans");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /name="robots" content="[^"]*noindex[^"]*nofollow/i);
  assert.match(html, /src="\/2camtrans\/index\.html"/);

  const robots = await (await render("/robots.txt")).text();
  assert.match(robots, /Disallow: \/2camtrans/);
  const sitemap = await (await render("/sitemap.xml")).text();
  assert.doesNotMatch(sitemap, /2camtrans/);
});
