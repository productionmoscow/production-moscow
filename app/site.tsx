"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

export type SitePage = "home" | "case" | "event" | "stream" | "contact" | "conf";

const navItems = [
  { label: "Портфолио", href: "/case" },
  { label: "Трансляции", href: "/stream" },
  { label: "Мероприятия", href: "/event" },
] as const;

type VideoWork = { title: string; duration?: string; href: string; embed?: string };

const vkVideo = (id: string, title: string, duration?: string): VideoWork => ({
  title,
  duration,
  href: `https://vk.com/video_ext.php?oid=-59299172&id=${id}`,
  embed: `https://vk.com/video_ext.php?oid=-59299172&id=${id}&hd=2`,
});

const showreel: VideoWork = {
  title: "ПОСМОТРИТЕ НАШ ШОУРИЛ",
  href: "https://kinescope.io/embed/jtfz36DqKYQ1TMvZeoSQRY",
  embed: "https://kinescope.io/embed/jtfz36DqKYQ1TMvZeoSQRY",
};

const caseFilms = [
  vkVideo("456239022", "Фильм про блогера Ольгу Нечаеву", "12:42"),
  vkVideo("456239024", "Открывающий ролик конференции EdCrunch", "1:50"),
  vkVideo("456239058", "Фильм для корпоратива ItAgency", "7:02"),
  vkVideo("456239027", "Фильм для инвесторов HiTest Russia", "4:06"),
];

const casePromos = [
  vkVideo("456239049", "Ведущий - упырь", "4:35"),
  vkVideo("456239023", "Промо группы «МОДАЛ»", "48:07"),
  vkVideo("456239062", "Сократ и Веда. Заявка на WA-24", "44:46"),
  vkVideo("456239057", "МАРК-3000", "6:05"),
  vkVideo("456239060", "Фестиваль рекламных роликов Марка Мирзояна", "7:46"),
  vkVideo("456239045", "Коробков и Зубков", "4:53"),
  vkVideo("456239061", "Ивент-бар", "2:13"),
];

const caseProjects = [
  vkVideo("456239059", "Подкаст Адиса Маммо «Темная Сторона». Гость - Виктор Комаров", "45:35"),
  vkVideo("456239055", "Проект «Антракт» Никиты Жукова // в гостях Анастасия Соколова", "44:46"),
  vkVideo("456239056", "Проект «Бобров+» Кирилла Боброва // выпуск про ТОП100", "56:05"),
  vkVideo("456239048", "Подкаст с Дмитрием Дибровым", "48:07"),
  vkVideo("456239025", "Операторский скилл - часовой подкаст «Точка сборки» одной камерой одним кадром", "1:15:46"),
  vkVideo("456239050", "Лео в гостях у Жени Резниченко", "34:53"),
];

const eventWorks = [
  vkVideo("456239028", "26 лет Студии Артемия Лебедева", "1:24"),
  vkVideo("456239041", "НРФ // Национальный рекламный форум", "7:40"),
  vkVideo("456239037", "Корпоративные зимние соревнования Сбербанка", "4:16"),
  vkVideo("456239069", "Спартакиада МГТС", "3:16"),
  vkVideo("456239071", "27 лет Студии Артемия Лебедева", "1:15"),
  vkVideo("456239068", "МГТС Фэмили фест", "4:16"),
  vkVideo("456239031", "Все звезды на благотворительном балу", "6:17"),
  vkVideo("456239037", "Корпоратив «KAZminerals»", "3:23"),
  vkVideo("456239042", "Летний тимбилдинг с бассейном", "4:32"),
  vkVideo("456239067", "Корпоратив Fplus на 1000 человек"),
  vkVideo("456239030", "Потрясающий по атмосфере корпоратив «Рокетбанка»", "3:37"),
];

const streamExamples = [
  vkVideo("456239036", "FSA", "5:02:20"),
  vkVideo("456239034", "Презентация книги", "3:28:12"),
  vkVideo("456239035", "Летний турнир по грэпплингу", "6:10:20"),
  vkVideo("456239040", "Новогодний онлайн-корпоратив", "2:14:20"),
];

const streamFeatureVideo: VideoWork = {
  title: "Турнир по грэпплингу FSA",
  duration: "БЭКСТЕЙДЖ ТРАНСЛЯЦИИ",
  href: "https://kinescope.io/embed/jCnWpQG5onNrYKL3A7fDue",
  embed: "https://kinescope.io/embed/jCnWpQG5onNrYKL3A7fDue",
};

const services = [
  ["Прямые трансляции", "Организуем прямые трансляции мероприятий любого масштаба в Москве. Обеспечим многокамерную съемку, профессиональную графику и стабильное соединение для трансляции на любые онлайн-платформы"],
  ["Фильмы для мероприятий", "Создаем документальные фильмы, которые показываем на крупнейших мероприятиях - как достижения компании или семейные фильмы на юбилей"],
  ["Промо-ролики", "Создаем эффективные промо-ролики, которые привлекают внимание к вашему личному бренду и вашему продукту, повышая узнаваемость в индустрии и, как следствие ваши продажи"],
  ["Съемка мероприятий", "Осуществляем видеосъемку и трансляцию мероприятий различного формата, гарантируя вдумчивый подход и качественный результат. Мы снимаем мероприятия с 2009 года."],
  ["Музыкальные клипы для кавер-групп", "Предлагаем профессиональную съемку музыкальных клипов для кавер-групп в Москве, помогая им выделиться из общей массы, повысить продажи и привлечь новую аудиторию"],
  ["Документальные фильмы", "Мы беремся за сложные, крупные и вдумчивые проекты с большим удовольствием. Степень нашей увлеченности документальным фильмом зависит конечно же от необычности проекта и от бюджета"],
] as const;

const principles = [
  ["Картинка", "Мы стремимся к кинематографическому качеству в каждом проекте, используя профессиональное оборудование и команду опытных операторов и режиссеров"],
  ["Проработка", "Над каждым проектом работает команда специалистов, включая сценаристов, операторов, монтажеров и других профессионалов, обеспечивая тщательную проработку каждой детали"],
  ["Прозрачность", "Предлагаем прозрачную и понятную систему ценообразования без скрытых платежей, чтобы вы точно знали, за что платите"],
  ["Соблюдение сроков", "Мы ценим ваше время и гарантируем строгое соблюдение оговоренных сроков, включая возможность экспресс-производства полного цикла за 4 дня"],
] as const;

const streamFaq = [
  ["Какие платформы вы используете для трансляций?", "Мы работаем с любыми платформами: YouTube, Рутьюб, ВК, Телеграм, специализированными стриминговыми сервисами или вашими корпоративными сайтами."],
  ["Какую технику вы используете?", "Мы используем современное оборудование для видеосъёмки, звука и света: камеры с высоким разрешением, микрофоны, световые панели и другое оборудование, которое обеспечивает качественную картинку и звук. У нас всегда есть запасное оборудование на случай выхода из строя основного оборудования"],
  ["Можете ли вы добавить графику и анимацию в трансляцию?", "Да, мы можем разработать, отрисовать и добавить графику: титры, заставки, логотипы, анимацию и другие элементы в режиме реального времени."],
  ["Сможете ли вы обеспечить стабильное подключение?", "Мы заранее проверяем площадку и настраиваем резервные каналы связи, чтобы исключить перебои. Стабильность трансляции для нас — приоритет."],
  ["Возможно ли настроить трансляцию на несколько языков?", "Да, мы можем организовать трансляцию с синхронным переводом, чтобы охватить международную аудиторию."],
  ["Предоставляете ли вы запись трансляции?", "Да, мы сохраняем записи трансляций и предоставляем их вам в удобном формате после завершения события."],
  ["Что делать, если на площадке нет интернета?", "Мы можем предоставить собственные мобильные решения для подключения к интернету, чтобы обеспечить стабильную трансляцию даже на удалённых площадках."],
  ["Какие типы мероприятий вы можете транслировать??", "Конференции, спортивные соревнования, семинары, концерты, шоу, соревнования, вебинары, телемосты"],
] as const;

const eventFaq = [
  ["❓ Какие мероприятия вы снимаете?", "Мы работаем с любыми типами событий: от камерных корпоративов до масштабных форумов, презентаций и гала-ужинов. Снимаем как для внутреннего пользования, так и для публичного размещения."],
  ["❓ Можно ли заказать прямую трансляцию мероприятия?", "Да. Мы делаем многокамерные прямые эфиры с графикой, титрами, врезками и стабильным интернетом. Транслируем на любые платформы: YouTube, Zoom, корпоративные сервисы и соцсети."],
  ["❓ Вы работаете только в Москве или по всей России?", "База — Москва, но мы работаем по всей стране. Часто выезжаем в регионы: Казань, Сочи, Екатеринбург, Калининград и другие. Всё оборудование привозим с собой или берём на месте."],
  ["❓ Можете ли вы сделать видео для показа на самом мероприятии?", "Да, это одно из наших главных направлений. Мы снимаем клипы и фильмы до\u00a0события, чтобы показать их на событии — например, перед выходом спикера или в начале вечера."],
  ["❓ Что входит в стоимость? Есть ли скрытые платежи?", "Мы работаем прозрачно. В смету включаем всё: логистику, оборудование, съёмочную смену, монтаж, графику (если она нужна). Никаких сюрпризов — всё обсуждаем заранее и утверждаем с вами."],
  ["❓ Сможете ли вы выдать материалы в день мероприятия?", "Да, если это необходимо. Можем выделить отдельного монтажёра и подготовить горячие материалы (трейлер, превью, первые кадры) прямо на площадке. Это нужно обсуждать заранее."],
  ["❓ А если у нас совсем нестандартный проект?", "Тем интереснее. Мы любим сложные и нестандартные задачи: съёмка в вертолёте, интервью на воде, видеописьмо президенту, эфир из леса — всё было. Главное — заранее обсудить нюансы."],
] as const;

function MenuMark() {
  return <span className="menu-mark" aria-hidden="true"><i /><i /><i /></span>;
}

function SiteHeader({ current }: { current: SitePage }) {
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => href === "/" ? current === "home" : current === href.slice(1);

  return <header className="site-header">
    <Link className="brand" href="/" onClick={() => setOpen(false)}>
      <span>ProductionMoscow.ru</span>
      <small>ИВЕНТ-ПРОДАКШН / 01</small>
    </Link>
    <nav className="desktop-nav" aria-label="Основная навигация">
      {navItems.map((item) => <a key={item.href} className={isActive(item.href) ? "active" : ""} href={item.href}>{item.label}</a>)}
    </nav>
    <a className="header-contact" href="/contact">Контакты <span aria-hidden="true">*</span></a>
    <button className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Закрыть меню" : "Открыть меню"} onClick={() => setOpen((value) => !value)}><MenuMark /></button>
    {open ? <div className="mobile-navigation" id="mobile-navigation">
      {navItems.map((item, index) => <a key={item.href} href={item.href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{item.label}</a>)}
      <a href="/contact" onClick={() => setOpen(false)}><span>04</span>Контакты</a>
    </div> : null}
  </header>;
}

function SectionHead({ number, title, children, emphasizeNumber = false }: { number: string; title: string; children?: ReactNode; emphasizeNumber?: boolean }) {
  return <div className={`section-head ${emphasizeNumber ? "section-head-number-emphasis" : ""}`}><span className="section-number">{number}</span><div><h2>{title}</h2>{children ? <p>{children}</p> : null}</div></div>;
}

function ArrowLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  return <a className="arrow-link" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}><span>{children}</span><b aria-hidden="true">↗</b></a>;
}

const contactPeople = [
  ["+79260608970", "Михаил, генеральный продюсер"],
  ["+79265399093", "Антон, художественный руководитель"],
] as const;

function ContactPhones({ compact = false }: { compact?: boolean }) {
  return <div className={`contact-phones ${compact ? "contact-phones-compact" : ""}`.trim()}>{contactPeople.map(([phone, label]) => <a className={compact ? undefined : "phone-link"} href={`tel:${phone}`} key={phone}>{phone} - {label}</a>)}</div>;
}

function VideoEmbed({ video, showMeta = true, showSource = true, loading = "eager" }: { video: VideoWork; showMeta?: boolean; showSource?: boolean; loading?: "eager" | "lazy" }) {
  return <article className="video-embed-card">
    <div className="video-frame"><iframe src={video.embed || video.href} title={video.title} loading={loading} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen /></div>
    {showMeta ? <div className="video-embed-meta"><div><h3>{video.title}</h3>{video.duration ? <p>{video.duration}</p> : null}</div>{showSource ? <span className="video-source">Видео</span> : null}</div> : null}
  </article>;
}

function VideoGallery({ videos, showSelectedMeta = true, showSelectedSource = true }: { videos: VideoWork[]; showSelectedMeta?: boolean; showSelectedSource?: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = videos[selectedIndex];

  return <div className="video-gallery">
    <VideoEmbed video={selected} showMeta={showSelectedMeta} showSource={showSelectedSource} />
    <div className="video-choice-panel">
      <div className="video-choices">
        {videos.map((video, index) => <button className={`video-choice ${index === selectedIndex ? "selected" : ""}`} type="button" aria-pressed={index === selectedIndex} key={`${video.title}-${video.href}`} onClick={() => setSelectedIndex(index)}>
          <span>{String(index + 1).padStart(2, "0")}</span><strong>{video.title}</strong><small>{video.duration}</small><b aria-hidden="true">{index === selectedIndex ? "●" : "↗"}</b>
        </button>)}
      </div>
    </div>
  </div>;
}

function FaqSection({ number, title, items, className = "" }: { number: string; title: ReactNode; items: readonly (readonly [string, string])[]; className?: string }) {
  const titleId = `${className || "faq"}-title`;
  return <section className={`faq-section ${className}`} {...(title ? { "aria-labelledby": titleId } : {})}>
    {title ? <div className="faq-head"><span className="section-number">{number}</span><div><h2 id={titleId}>{title}</h2></div></div> : null}
    <div className="faq-list">{items.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }) }} />
  </section>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-mark" aria-hidden="true">*</div>
    <div><p className="footer-kicker">ProductionMoscow.ru</p><p className="footer-copy">Мы предлагаем прямые трансляции, промо-видео, корпоративные фильмы и видеосъёмку мероприятий.<br />Работаем по всей России, базируемся в Москве.<br />Картинка как в кино, команда, которая знает, что делает, и продакшн, которому можно доверять.</p></div>
    <div className="footer-links"><ContactPhones compact /><a href="https://t.me/productionmoscow" target="_blank" rel="noreferrer">Телеграм</a><a href="/conf">Контакты</a></div>
    <div className="footer-bottom"><span>ProductionMoscow.ru</span><a href="/contact">Контакты ↗</a></div>
  </footer>;
}

function Shell({ current, children }: { current: SitePage; children: ReactNode }) {
  const pageClassName = [current === "stream" ? "stream-page" : "", current === "case" ? "case-page" : "", current === "event" ? "production-event-page" : ""].filter(Boolean).join(" ");
  return <div className="site-frame"><SiteHeader current={current} /><main id="main-content" className={pageClassName || undefined}>{children}</main><Footer /></div>;
}

function HomePage() {
  return <Shell current="home">
    <section className="hero-grid production-hero reveal">
      <div className="hero-copy"><p className="eyebrow">ProductionMoscow.ru</p><h1>Надёжный видеопродакшн для мероприятий и бизнеса<span className="accent">*</span></h1><div className="hero-credentials"><span>Форумы, конференции и корпоративные события.</span><span>Полный цикл производства: съёмка, трансляции и монтаж</span><span>Простая коммуникация и прозрачное ценообразование</span><span>Работаем с бизнесом и ивент-агентствами</span></div><div className="hero-actions"><ArrowLink href="/case">ПОРТФОЛИО</ArrowLink><ArrowLink href="/stream">ПРЯМЫЕ ТРАНСЛЯЦИИ</ArrowLink></div></div>
      <div className="hero-video"><VideoEmbed video={showreel} showMeta={false} /><div className="hero-video-foot"><h2>ПОСМОТРИТЕ НАШ ШОУРИЛ<span className="accent">*</span></h2><p>За минуту вы поймете наш стиль и уровень</p></div></div>
    </section>

    <section className="lined-section production-services reveal"><SectionHead number="02" title="Что мы можем?" emphasizeNumber>Список сервисов, которые мы предоставляем</SectionHead><div className="service-answers production-services-grid">{services.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="lined-section production-why reveal"><SectionHead number="03" title="Почему мы?">Есть несколько отличительных особенностей,<br />за которые нас выбирают</SectionHead><div className="production-principles-grid">{principles.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="lined-section production-contact-prompt reveal"><p className="eyebrow">productionmoscow.ru</p><h2>Мы сами можем с вами связаться</h2><p>Просто оставьте нам свои контакты</p><ArrowLink href="/contact">Отправить</ArrowLink></section>
    <section className="lined-section production-thanks reveal"><SectionHead number="04" title="Нам благодарны">Иногда мы просим компании прислать нам фидбэк</SectionHead><div className="production-thanks-grid"><figure><Image src="/stream/thanks-hytest.png" alt="Благодарность Production Moscow от компании Хайтест" width={1680} height={1680} loading="lazy" /><figcaption>ООО «Хайтест»</figcaption></figure><figure><Image src="/stream/thanks-sber.png" alt="Благодарность Production Moscow от Сбербанка" width={1680} height={1680} loading="lazy" /><figcaption>Сбербанк</figcaption></figure><figure><Image src="/stream/thanks-resanta.png" alt="Благодарность Production Moscow от компании Ресанта" width={1680} height={1680} loading="lazy" /><figcaption>ГК «Ресанта»</figcaption></figure></div></section>
    <section className="contact-banner reveal"><div><p className="small-label">05 / Контакты</p><h2>Мы предлагаем<br /><span>прямые трансляции, промо-видео, корпоративные фильмы и видеосъёмку мероприятий</span></h2></div><div className="contact-banner-action"><p>Работаем по всей России, базируемся в Москве.</p><p>Картинка как в кино, команда, которая знает, что делает, и продакшн, которому можно доверять.</p><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div></section>
  </Shell>;
}

function CasePage() {
  return <Shell current="case">
    <section className="page-intro reveal"><div className="intro-number">01</div><div><p className="eyebrow">ИВЕНТ-ПРОДАКШН</p><h1>Портфолио<br />видеопродакшна<br />Production Moscow</h1></div></section>
    <section className="lined-section production-portfolio-section reveal"><SectionHead number="02" title="Фильмы для показа на мероприятиях" /><p className="section-lead">Мы любим снимать сложные и интересные фильмы к определенным мероприятиям - будь то День рождения компании или человека. Как правило - это большой объемный проект со сценарием, несколькими съемочными днями и обстоятельным монтажом. Это то, что мы делаем лучше всего.</p><VideoGallery videos={caseFilms} /></section>
    <section className="lined-section production-portfolio-section reveal"><SectionHead number="03" title="Промо-ролики" /><p className="section-lead">Ведущим, агентствам, декораторам, диджеям, всем-всем-всем</p><VideoGallery videos={casePromos} /></section>
    <section className="lined-section production-portfolio-section reveal"><SectionHead number="04" title="Проекты" /><p className="section-lead">Мы любим снимать необычные и обычные проекты - подкасты, стендапы, интервью (которые у нас лучше всего получаются), спортивные мероприятия, мастер-классы</p><VideoGallery videos={caseProjects} /></section>
    <section className="contact-banner event-contact reveal"><div><p className="small-label">05 / Контакты</p><h2>Мы предлагаем<br /><span>прямые трансляции, промо-видео, корпоративные фильмы и видеосъёмку мероприятий</span></h2></div><div className="contact-banner-action"><p>Работаем по всей России, базируемся в Москве.</p><p>Картинка как в кино, команда, которая знает, что делает, и продакшн, которому можно доверять.</p><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div></section>
  </Shell>;
}

function EventPage() {
  return <Shell current="event">
    <section className="event-hero reveal"><div className="event-hero-content"><p className="eyebrow">ПЕРВЫЙ ИВЕНТ-ПРОДАКШН</p><h1>Съёмка корпоративных мероприятий<br />под ключ в Москве | ProductionMoscow</h1><p className="event-hero-subtitle">фото // видео // трансляции</p><span className="event-hero-rule" /></div><span className="event-hero-mark" aria-hidden="true">*</span></section>
    <section className="lined-section production-event-playlist reveal"><SectionHead number="02" title="Наши видео говорят сами за себя:" /><VideoGallery videos={eventWorks} /></section>
    <section className="lined-section production-event-copy reveal"><div className="two-column-copy"><p>От подготовки технического задания для фотографов и видеографов на основании сценария мероприятия до финального монтажа и цветокоррекции</p><div><p><strong>Мы — продакшн полного цикла, специализирующийся на видеосъёмке мероприятий в Москве и по всей России.</strong></p><p>Мы работаем с корпоративными клиентами, ивент-агентствами и частными заказчиками.</p><p>В наших руках — всё: от подготовки технического задания для фотографов и видеографов на основании сценария мероприятия до финального монтажа и цветокоррекции. В каждый проект мы вкладываем визуальный язык — мягкий свет, живую динамику, красивый свет, расфокус и ту самую ламповость, которую любят наши клиенты.</p></div></div></section>
    <FaqSection number="03" title="" items={eventFaq} className="production-event-faq" />
    <section className="contact-banner event-contact reveal"><div><p className="small-label">04 / Контакты</p><h2>Мы сами можем<br /><span>с вами связаться</span></h2></div><div className="contact-banner-action"><p>Просто оставьте нам свои контакты</p><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div></section>
  </Shell>;
}

function StreamPage() {
  return <Shell current="stream">
    <section className="stream-hero reveal"><div className="stream-hero-copy"><span className="stream-hero-number intro-number">01</span><div className="stream-hero-copy-main"><p className="eyebrow">ИВЕНТ-ПРОДАКШН</p><h1>ПРЯМЫЕ<br />ТРАНСЛЯЦИИ<span className="accent">*</span></h1></div></div><div className="stream-hero-feature" id="stream-case-video"><VideoEmbed video={streamFeatureVideo} /></div><div className="stream-hero-after"><div><p className="stream-hero-lead">Мы проводим трансляции на мероприятиях любого формата с полным техническим обеспечением: многокамерная съемка, графическое оформление, аренда и настройка оборудования и стабильное подключение для любых онлайн-платформ - будь то ВК, Телеграм или заграничные сервисы</p><ArrowLink href="/contact">НАПИСАТЬ</ArrowLink></div></div></section>
    <section className="lined-section stream-case reveal"><SectionHead number="02" title={'Кейс онлайн-трансляции "Турнир по грэпплингу FSA"'} /><div className="stream-case-layout"><div className="stream-case-copy"><p>Мы сняли Бэкстейдж проведения сложной спортивной трансляции с воспроизведением повторов и лучших моментов матча после каждого поединка</p><ArrowLink href="https://kinescope.io/embed/jCnWpQG5onNrYKL3A7fDue" external>СМОТРЕТЬ ВИДЕО</ArrowLink></div></div></section>
    <section className="lined-section stream-examples reveal"><SectionHead number="03" title="Примеры проведенных нами онлайн-трансляций">Хотя большое количество трансляций проводится на закрытую аудиторию из-за соблюдения коммерческих тайн и мы не имеем право их публиковать, но несколько примеров все-таки есть</SectionHead><VideoGallery videos={streamExamples} /></section>
    <section className="lined-section stream-proof reveal"><SectionHead number="04" title="Нам благодарны">Иногда мы просим компании прислать нам фидбэк</SectionHead><div className="stream-proof-grid"><figure><Image src="/stream/thanks-hytest.png" alt="Благодарность Production Moscow от компании Хайтест" width={1680} height={1680} loading="lazy" /><figcaption>ООО «Хайтест»</figcaption></figure><figure><Image src="/stream/thanks-sber.png" alt="Благодарность Production Moscow от Сбербанка" width={1680} height={1680} loading="lazy" /><figcaption>Сбербанк</figcaption></figure><figure><Image src="/stream/thanks-resanta.png" alt="Благодарность Production Moscow от компании Ресанта" width={1680} height={1680} loading="lazy" /><figcaption>ГК «Ресанта»</figcaption></figure></div></section>
    <section className="lined-section stream-process reveal"><SectionHead number="05" title="Этапы работы" /><div className="stream-process-grid"><article><span>01</span><h3>Получение технического задания</h3><p>«Мы начинаем с того, что слушаем вас. Ваши цели, задачи, аудитория и формат мероприятия — это то, что определяет сценарий трансляции. Мы помогаем сформулировать ключевые моменты, выбираем платформы для трансляции и составляем понятное техническое задание.»</p><ul><li>Определяем формат и задачи трансляции.</li><li>Проговариваем детали (платформы, графика, структура).</li><li>При необходимости выезжаем на площадку для осмотра.</li></ul></article><article><span>02</span><h3>Подготовка оборудования и площадки</h3><p>«Мы обеспечиваем техническую сторону вашего события: от настройки света и звука до тестирования всех систем. На площадке мы устанавливаем камеры, готовим графику и настраиваем стабильное соединение для трансляции. Всё тестируется заранее, чтобы избежать любых сбоев.»</p><ul><li>Устанавливаем камеры, свет и звук.</li><li>Настраиваем графику и платформы для эфира.</li><li>Тестируем оборудование и готовим резервные системы.</li></ul></article><article><span>03</span><h3>Проведение трансляции</h3><p>«В назначенный день мы превращаем ваше событие в телешоу. Работаем с многокамерной съёмкой, живым переключением кадров и графикой, чтобы ваша аудитория увидела всё на высшем уровне. Мы следим за стабильностью трансляции, чтобы ничего не отвлекало от происходящего на экране.»</p><ul><li>Проводим многокамерную съёмку.</li><li>Используем графику и визуальные эффекты в реальном времени.</li><li>Гарантируем стабильность трансляции на всех платформах.</li></ul></article></div></section>
    <FaqSection number="06" title={<>Частые вопросы<br />про трансляции</>} items={streamFaq} className="stream-faq" />
    <section className="contact-banner stream-contact event-contact reveal"><div><p className="small-label">07 / Контакты</p><h2>Вопросы по<br /><span>трансляции?</span></h2></div><div className="contact-banner-action"><p>Мы можем сами связаться с Вами</p><p>Просто заполните форму, и мы свяжемся с Вами в ближайшее время</p><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div></section>
  </Shell>;
}

function ContactPage() {
  return <Shell current="contact"><section className="contact-page reveal"><div className="intro-number">01</div><div><p className="eyebrow">ProductionMoscow.ru // Контакты</p><h1>Мы сами можем<br />с вами связаться</h1><p className="contact-description">Мы предлагаем прямые трансляции, промо-видео, корпоративные фильмы и видеосъёмку мероприятий.<br />Работаем по всей России, базируемся в Москве.<br />Картинка как в кино, команда, которая знает, что делает, и продакшн, которому можно доверять.</p><ContactPhones /><div className="contact-links"><ArrowLink href="https://t.me/productionmoscow" external>Телеграм</ArrowLink></div></div></section><section className="contact-note reveal"><span className="asterisk">*</span><p>Просто оставьте нам свои контакты</p></section></Shell>;
}

function PrivacyPage() {
  const sections = [["1. Общие положения", "Настоящая политика определяет порядок обработки персональных данных на сайте ProductionMoscow.ru."], ["2. Какие данные мы обрабатываем", "Имя, номер телефона и другие сведения, которые пользователь добровольно оставляет для связи."], ["3. Цели обработки", "Данные используются только для связи с пользователем, подготовки предложения и организации работы по проекту."], ["4. Контакты", "По вопросам обработки персональных данных можно связаться с Production Moscow по телефону +7 926 539 90 93."]] as const;
  return <Shell current="conf"><section className="legal-page reveal"><div className="intro-number">05</div><div><p className="eyebrow">ProductionMoscow.ru</p><h1>Политика в отношении обработки персональных данных</h1><div className="legal-copy">{sections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}</div></div></section></Shell>;
}

export default function Site({ page = "home" }: { page?: SitePage }) {
  if (page === "case") return <CasePage />;
  if (page === "event") return <EventPage />;
  if (page === "stream") return <StreamPage />;
  if (page === "contact") return <ContactPage />;
  if (page === "conf") return <PrivacyPage />;
  return <HomePage />;
}
