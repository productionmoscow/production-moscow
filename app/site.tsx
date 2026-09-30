"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { sourcePages, type SourcePageData } from "./source-pages-data";

export type SitePage = "home" | "case" | "event" | "stream" | "food" | "politika" | "studio" | "kiselev" | "golf" | "pokavsedoma" | "vsacademy" | "gnivts" | "contact" | "conf" | "gpt";

const navItems = [
  { label: "Портфолио", href: "/case" },
  { label: "Трансляции", href: "/stream" },
  { label: "Мероприятия", href: "/event" },
  { label: "ФудФото", href: "/food" },
  { label: "GPT", href: "/gpt" },
] as const;

type VideoWork = { title: string; duration?: string; href: string; embed?: string };

const kinescopeEmbed = (id: string) => `https://kinescope.io/embed/${id}?autoplay=true&muted=true&controls=false&loop=true&autopause=false`;

const vkVideo = (id: string, title: string, duration?: string): VideoWork => ({
  title,
  duration,
  href: `https://vk.com/video_ext.php?oid=-59299172&id=${id}`,
  embed: `https://vk.com/video_ext.php?oid=-59299172&id=${id}`,
});

const sourceVkVideo = (id: string, title: string, duration?: string, href = `https://vk.com/video-59299172_${id}`): VideoWork => ({
  title,
  duration,
  href,
  embed: `https://vk.com/video_ext.php?oid=-59299172&id=${id}`,
});

const showreel: VideoWork = {
  title: "ПОСМОТРИТЕ НАШ ШОУРИЛ",
  href: "https://kinescope.io/embed/jtfz36DqKYQ1TMvZeoSQRY",
  embed: kinescopeEmbed("jtfz36DqKYQ1TMvZeoSQRY"),
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
  sourceVkVideo("456239036", "FSA", "5:02:20", "https://vk.com/prodmskru?z=video-59299172_456239036%2Fvideos-59299172%2Fpl_-59299172_-2"),
  sourceVkVideo("456239034", "Презентация книги", "3:28:12"),
  sourceVkVideo("456239035", "Летний турнир по грэпплингу", "6:10:20"),
  sourceVkVideo("456239040", "Новогодний онлайн-корпоратив", "2:14:20"),
];

const streamFeatureVideo: VideoWork = {
  title: "Турнир по грэпплингу FSA",
  duration: "БЭКСТЕЙДЖ ТРАНСЛЯЦИИ",
  href: "https://kinescope.io/embed/jCnWpQG5onNrYKL3A7fDue",
  embed: kinescopeEmbed("jCnWpQG5onNrYKL3A7fDue"),
};

const services = [
  ["Прямые трансляции", "Организуем прямые трансляции мероприятий любого масштаба в Москве. Обеспечим многокамерную съемку, профессиональную графику и стабильное соединение для трансляции на любые онлайн-платформы", "/stream"],
  ["Фильмы для мероприятий", "Создаем документальные фильмы, которые показываем на крупнейших мероприятиях - как достижения компании или семейные фильмы на юбилей", "/case#films"],
  ["Промо-ролики", "Создаем эффективные промо-ролики, которые привлекают внимание к вашему личному бренду и вашему продукту, повышая узнаваемость в индустрии и, как следствие ваши продажи", "/case#promos"],
  ["Съемка мероприятий", "Осуществляем видеосъемку и трансляцию мероприятий различного формата, гарантируя вдумчивый подход и качественный результат. Мы снимаем мероприятия с 2009 года.", "/event"],
  ["Музыкальные клипы для кавер-групп", "Предлагаем профессиональную съемку музыкальных клипов для кавер-групп в Москве, помогая им выделиться из общей массы, повысить продажи и привлечь новую аудиторию", "/case#projects"],
  ["Документальные фильмы", "Мы беремся за сложные, крупные и вдумчивые проекты с большим удовольствием. Степень нашей увлеченности документальным фильмом зависит конечно же от необычности проекта и от бюджета", "/case#films"],
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
      <a href="/contact" onClick={() => setOpen(false)}><span>{String(navItems.length + 1).padStart(2, "0")}</span>Контакты</a>
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

function ContactMethods() {
  return <div className="contact-methods" aria-label="Способ связи"><span>Способ связи</span><span>Звонок</span><span>ВотсАп</span><span>Телеграм</span><span>Отправить</span></div>;
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
        {videos.map((video, index) => <button className={`video-choice ${index === selectedIndex ? "selected" : ""}`} type="button" aria-pressed={index === selectedIndex} data-video-url={video.href} key={`${video.title}-${video.href}`} onClick={() => setSelectedIndex(index)}>
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
    <div className="footer-links"><ContactPhones compact /><a href="https://t.me/productionmoscow" target="_blank" rel="noreferrer">Телеграм</a><a href="https://vk.com/prodmskru" target="_blank" rel="noreferrer">ВКонтакте</a><a href="http://productionmoscow.ru" target="_blank" rel="noreferrer">ProductionMoscow.ru</a><a href="/conf">Контакты</a></div>
    <div className="footer-bottom"><span>ProductionMoscow.ru</span><a href="/contact">Контакты ↗</a></div>
  </footer>;
}

function Shell({ current, children }: { current: SitePage; children: ReactNode }) {
  const pageClassName = [current === "stream" ? "stream-page" : "", current === "case" ? "case-page" : "", current === "event" ? "production-event-page" : ""].filter(Boolean).join(" ");
  return <div className="site-frame"><SiteHeader current={current} /><main id="main-content" className={pageClassName || undefined}>{children}</main><Footer /></div>;
}

type GptChatMessage = { role: "user" | "assistant"; content: string; sources?: { title: string; href?: string }[] };

function GptPage() {
  const [messages, setMessages] = useState<GptChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [error, setError] = useState("");
  const [lead, setLead] = useState({ name: "", contact: "", request: "", date: "", consent: false });
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = "auto";
    composer.style.height = `${Math.min(composer.scrollHeight, 220)}px`;
  }, [input]);

  async function requestAssistant(body: Record<string, unknown>) {
    const response = await fetch("/api/gpt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json() as { reply?: string; sources?: { title: string; href?: string }[]; suggestLead?: boolean; error?: string; leadReceived?: boolean };
    if (!response.ok) throw new Error(payload.error || "Не удалось получить ответ");
    return payload;
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;
    const nextMessages: GptChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsSending(true);
    try {
      const payload = await requestAssistant({ messages: nextMessages.map(({ role, content }) => ({ role, content })) });
      setMessages([...nextMessages, { role: "assistant", content: payload.reply || "Давайте уточним задачу — расскажите о мероприятии или формате видео.", sources: payload.sources }]);
      if (payload.suggestLead) setLeadOpen(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось получить ответ");
    } finally {
      setIsSending(false);
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    setError("");
    setIsSending(true);
    try {
      const payload = await requestAssistant({
        messages: [...messages, { role: "user", content: "Хочу обсудить проект с продюсером." }].map(({ role, content }) => ({ role, content })),
        lead,
      });
      if (payload.leadReceived) {
        setLeadSent(true);
        setLeadOpen(false);
        setMessages([...messages, { role: "assistant", content: payload.reply || "Контакты сохранены. Команда свяжется с вами.", sources: payload.sources }]);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить заявку");
    } finally {
      setIsSending(false);
    }
  }

  const promptButtons = ["Что вы снимаете?", "Как проходит трансляция?", "Покажи похожие кейсы"];

  return <Shell current="gpt">
    <section className="gpt-page reveal">
      <div className="gpt-assistant-banner">
        <div className="gpt-assistant-top"><span className="small-label">GPT / PRODUCTION MOSCOW</span><span className="gpt-status">БЕТА</span></div>
        <h1>AI-ассистент<i>*</i></h1>
        <div className="gpt-chat-shell">
          <form className="gpt-input-form gpt-input-form-hero" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="gpt-question">Ваш вопрос</label>
            <textarea ref={composerRef} id="gpt-question" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Спросите что угодно о съемках, трансляциях или нашем продакшене" maxLength={2400} rows={1} />
            <button type="submit" disabled={isSending || !input.trim()} aria-label="Отправить вопрос">↗</button>
          </form>
          <div className="gpt-messages" aria-live="polite">
            {messages.map((message, index) => <article className={`gpt-message gpt-message-${message.role}`} key={`${message.role}-${index}`}><span className="gpt-message-label">{message.role === "assistant" ? "GPT" : "ВЫ"}</span><p>{message.content}</p>{message.sources?.length ? <div className="gpt-sources"><span>Материалы</span>{message.sources.map((source) => source.href ? <a href={source.href} key={`${source.title}-${source.href}`}>{source.title}</a> : <span key={source.title}>{source.title}</span>)}</div> : null}</article>)}
            {isSending ? <div className="gpt-typing" aria-label="GPT печатает"><span /><span /><span /></div> : null}
          </div>
        </div>
      </div>
      <div className="gpt-workspace">
        <div className="gpt-workspace-head"><div><span className="small-label">01 / Диалог</span><h2>Что снимаем?</h2></div><span className="gpt-dot" aria-label="GPT доступен" /></div>
        <div className="gpt-prompts">{promptButtons.map((prompt) => <button type="button" key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div>
        {leadOpen && !leadSent ? <form className="gpt-lead-form" onSubmit={submitLead}>
          <div className="gpt-form-head"><div><span className="small-label">02 / Заявка</span><h3>Передать задачу продюсеру</h3></div><button type="button" className="gpt-form-close" onClick={() => setLeadOpen(false)} aria-label="Закрыть форму">×</button></div>
          <label>Имя<input required value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} placeholder="Как к вам обращаться?" /></label>
          <label>Телефон или другой контакт<input required value={lead.contact} onChange={(event) => setLead({ ...lead, contact: event.target.value })} placeholder="+7 900 000 00 00" /></label>
          <div className="gpt-form-grid"><label>Дата мероприятия<input type="text" value={lead.date} onChange={(event) => setLead({ ...lead, date: event.target.value })} placeholder="Если уже известна" /></label><label>Формат<input value={lead.request} onChange={(event) => setLead({ ...lead, request: event.target.value })} placeholder="Съёмка, эфир, фильм..." /></label></div>
          <label className="gpt-consent"><input type="checkbox" required checked={lead.consent} onChange={(event) => setLead({ ...lead, consent: event.target.checked })} /> <span>Согласен на обработку контактных данных. <a href="/conf">Политика конфиденциальности</a></span></label>
          <button className="gpt-submit" type="submit" disabled={isSending}>Сохранить заявку</button>
        </form> : <div className="gpt-lead-cta">{leadSent ? <p>Заявка принята. Команда свяжется с вами.</p> : <><p>Уже есть конкретная задача?</p><button type="button" onClick={() => setLeadOpen(true)}>Оставить контакты</button></>}</div>}
        {error ? <p className="gpt-error" role="alert">{error}</p> : null}
        <p className="gpt-disclaimer">GPT отвечает по материалам Production Moscow. Точные сметы и сроки подтверждает продюсер.</p>
      </div>
    </section>
  </Shell>;
}

function HomePage() {
  return <Shell current="home">
    <section className="hero-grid production-hero reveal">
      <div className="hero-copy"><p className="eyebrow">ProductionMoscow.ru</p><h1 aria-label="Надёжный видеопродакшн для мероприятий и бизнеса"><span className="hero-title-line">Надёжный</span><span className="hero-title-line">видеопродакшн</span><span className="hero-title-line">для мероприятий</span><span className="hero-title-line">и бизнеса<span className="accent">*</span></span></h1><div className="hero-credentials"><span>Форумы, конференции и корпоративные события.</span><span>Полный цикл производства: съёмка, трансляции и монтаж</span><span>Простая коммуникация и прозрачное ценообразование</span><span>Работаем с бизнесом и ивент-агентствами</span></div><div className="hero-actions"><ArrowLink href="/case">ПОРТФОЛИО</ArrowLink><ArrowLink href="/stream">ПРЯМЫЕ ТРАНСЛЯЦИИ</ArrowLink></div></div>
      <div className="hero-video"><VideoEmbed video={showreel} showMeta={false} /><div className="hero-video-foot"><h2>ПОСМОТРИТЕ НАШ ШОУРИЛ<span className="accent">*</span></h2><p>За минуту вы поймете наш стиль и уровень</p></div></div>
    </section>

    <section className="lined-section production-services reveal"><SectionHead number="02" title="Что мы можем?" emphasizeNumber>Список сервисов, которые мы предоставляем</SectionHead><div className="service-answers production-services-grid">{services.map(([title, description, href]) => <article key={title}><Link className="service-card" href={href}><h3>{title}</h3><p>{description}</p></Link></article>)}</div></section>
    <section className="lined-section production-why reveal"><SectionHead number="03" title="Почему мы?">Есть несколько отличительных особенностей,<br />за которые нас выбирают</SectionHead><div className="production-principles-grid">{principles.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="lined-section production-thanks reveal"><SectionHead number="04" title="Нам благодарны">Иногда мы просим компании прислать нам фидбэк</SectionHead><div className="production-thanks-grid"><figure><Image src="/stream/thanks-hytest.png" alt="Благодарность Production Moscow от компании Хайтест" width={1680} height={1680} loading="lazy" /><figcaption>ООО «Хайтест»</figcaption></figure><figure><Image src="/stream/thanks-sber.png" alt="Благодарность Production Moscow от Сбербанка" width={1680} height={1680} loading="lazy" /><figcaption>Сбербанк</figcaption></figure><figure><Image src="/stream/thanks-resanta.png" alt="Благодарность Production Moscow от компании Ресанта" width={1680} height={1680} loading="lazy" /><figcaption>ГК «Ресанта»</figcaption></figure></div></section>
    <section className="contact-banner reveal"><div><p className="small-label">05 / Контакты</p><h2>Мы предлагаем<br /><span>прямые трансляции, промо-видео, корпоративные фильмы и видеосъёмку мероприятий</span></h2></div><div className="contact-banner-action"><p>Работаем по всей России, базируемся в Москве.</p><p>Картинка как в кино, команда, которая знает, что делает, и продакшн, которому можно доверять.</p><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div></section>
  </Shell>;
}

function CasePage() {
  return <Shell current="case">
    <section className="page-intro reveal"><div className="intro-number">01</div><div><p className="eyebrow">ИВЕНТ-ПРОДАКШН</p><h1>Портфолио<br />видеопродакшна<br />Production Moscow</h1></div></section>
    <section id="films" className="lined-section production-portfolio-section reveal"><SectionHead number="02" title="Фильмы для показа на мероприятях" /><p className="section-lead">Мы любим снимать сложные и интересные фильмы к определенным мероприятиям - будь то День рождения компании или человека. Как правило - это большой объемный проект со сценарием, несколькими съемочными днями и обстоятельным монтажом. Это то, что мы делаем лучше всего.</p><VideoGallery videos={caseFilms} /></section>
    <section id="promos" className="lined-section production-portfolio-section reveal"><SectionHead number="03" title="Промо-ролики" /><p className="section-lead">Ведущим, агентствам, декораторам, диджеям, всем-всем-всем</p><VideoGallery videos={casePromos} /></section>
    <section id="projects" className="lined-section production-portfolio-section reveal"><SectionHead number="04" title="Проекты" /><p className="section-lead">Мы любим снимать необычные и обычные проекты - подкасты, стендапы, интервью (которые у нас лучше всего получаются), спортивные мероприятия, мастер-классы</p><VideoGallery videos={caseProjects} /></section>
    <section className="contact-banner event-contact reveal"><div><p className="small-label">05 / Контакты</p><h2>Мы предлагаем<br /><span>прямые трансляции, промо-видео, корпоративные фильмы и видеосъёмку мероприятий</span></h2></div><div className="contact-banner-action"><p>Работаем по всей России, базируемся в Москве.</p><p>Картинка как в кино, команда, которая знает, что делает, и продакшн, которому можно доверять.</p><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div></section>
  </Shell>;
}

function EventPage() {
  return <Shell current="event">
    <section className="event-hero reveal"><div className="event-hero-content"><p className="eyebrow">ПЕРВЫЙ ИВЕНТ-ПРОДАКШН</p><h1>Съёмка корпоративных мероприятий<br />под ключ в Москве | ProductionMoscow</h1><p className="event-hero-subtitle">фото // видео // трансляции</p><span className="event-hero-rule" /></div><span className="event-hero-mark" aria-hidden="true">*</span></section>
    <section className="lined-section production-event-playlist reveal"><SectionHead number="02" title="Наши видео говорят сами за себя:" /><VideoGallery videos={eventWorks} /></section>
    <section className="lined-section production-event-copy reveal"><div className="two-column-copy"><p>От подготовки технического задания для фотографов и видеографов на основании сценария мероприятия до финального монтажа и цветокоррекции</p><div><p><strong>Мы — продакшн полного цикла, специализирующийся на видеосъёмке мероприятий в Москве и по всей России.</strong></p><p>Мы работаем с корпоративными клиентами, ивент-агентствами и частными заказчиками.</p><p>В наших руках — всё: от подготовки технического задания для фотографов и видеографов на основании сценария мероприятия до финального монтажа и цветокоррекции. В каждый проект мы вкладываем визуальный язык — мягкий свет, живую динамику, красивый свет, расфокус и ту самую ламповость, которую любят наши клиенты.</p></div></div></section>
    <FaqSection number="03" title="" items={eventFaq} className="production-event-faq" />
    <section className="contact-banner event-contact reveal"><div><p className="small-label">04 / Контакты</p><h2>Мы сами можем<br /><span>с вами связаться</span></h2></div><div className="contact-banner-action"><p>Просто оставьте нам свои контакты</p><ContactMethods /><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div></section>
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
    <section className="contact-banner stream-contact event-contact reveal"><div><p className="small-label">07 / Контакты</p><h2>Вопросы по<br /><span>трансляции?</span></h2></div><div className="contact-banner-action"><p>Мы можем сами связаться с Вами</p><p>Просто заполните форму, и мы свяжемся с Вами в ближайшее время</p><ContactMethods /><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div></section>
  </Shell>;
}

function ContactPage() {
  return <Shell current="contact"><section className="contact-page reveal"><div className="intro-number">01</div><div><p className="eyebrow">ProductionMoscow.ru // Контакты</p><h1>Мы сами можем<br />с вами связаться</h1><p className="contact-description">Мы предлагаем прямые трансляции, промо-видео, корпоративные фильмы и видеосъёмку мероприятий.<br />Работаем по всей России, базируемся в Москве.<br />Картинка как в кино, команда, которая знает, что делает, и продакшн, которому можно доверять.</p><ContactMethods /><ContactPhones /><div className="contact-links"><ArrowLink href="https://t.me/productionmoscow" external>Телеграм</ArrowLink></div></div></section><section className="contact-note reveal"><span className="asterisk">*</span><p>Просто оставьте нам свои контакты</p></section></Shell>;
}

function PrivacyPage() {
  return <SourcePage current="conf" data={sourcePages["/politika"]} />;
}

function sourceVideoEmbed(url: string) {
  if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split(/[?&#]/)[0]}`;
  if (url.includes("youtube.com/watch")) return `https://www.youtube.com/embed/${new URL(url).searchParams.get("v") || ""}`;
  if (url.includes("vk.com/video-")) {
    const match = url.match(/video-(-?\d+)_([0-9]+)/);
    return match ? `https://vk.com/video_ext.php?oid=-${match[1].replace(/^-/, "")}&id=${match[2]}` : url;
  }
  return url;
}

/* eslint-disable @next/next/no-img-element */
function SourceImage({ src, index, slug }: { src: string; index: number; slug: string }) {
  return <a className="source-image" href={src} target="_blank" rel="noreferrer"><img src={src} alt={`Материал оригинальной страницы ${slug}, ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} /></a>;
}
/* eslint-enable @next/next/no-img-element */

function SourcePage({ current, data }: { current: SitePage; data: SourcePageData }) {
  const firstRecord = data.records[0] || data.title;
  const number = current === "conf" ? "05" : "01";
  return <Shell current={current}>
    <section className="source-page-hero reveal"><div className="intro-number">{number}</div><div><p className="eyebrow">ОРИГИНАЛЬНАЯ СТРАНИЦА // {data.slug}</p><h1>{firstRecord}</h1><p className="source-page-title">{data.title}</p><ArrowLink href={data.originalUrl} external>Открыть оригинал</ArrowLink></div></section>
    <section className="lined-section source-content reveal"><SectionHead number="02" title="Содержимое страницы">Текст и данные перенесены из оригинального ProductionMoscow.ru</SectionHead><div className="source-records">{data.records.map((record, index) => <article className="source-record" key={`${data.slug}-record-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{record}</p></article>)}</div>{data.tables.length ? <div className="source-tables"><h2>Таблицы и сметы</h2>{data.tables.map((table, index) => <article className="source-table" key={`${data.slug}-table-${index}`}><h3>{table.header || `Таблица ${index + 1}`}</h3><pre>{table.rows}</pre></article>)}</div> : null}</section>
    {data.videoUrls.length ? <section className="lined-section source-videos reveal"><SectionHead number="03" title="Видео из оригинала">Все видеоссылки исходной страницы</SectionHead><div className="source-video-grid">{data.videoUrls.map((url, index) => <article className="source-video-card" key={url}><div className="source-video-frame"><iframe src={sourceVideoEmbed(url)} title={`Видео оригинала ${index + 1}`} loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen /></div><a href={url} target="_blank" rel="noreferrer">{url}</a></article>)}</div></section> : null}
    {data.imageUrls.length ? <section className="lined-section source-gallery reveal"><SectionHead number={data.videoUrls.length ? "04" : "03"} title="Изображения оригинала">{data.imageUrls.length} исходных изображений со страницы</SectionHead><div className="source-image-grid">{data.imageUrls.map((src, index) => <SourceImage key={src} src={src} index={index} slug={data.slug} />)}</div></section> : null}
    <section className="lined-section source-inventory reveal"><SectionHead number={data.imageUrls.length ? "05" : "04"} title="Ссылки и исходные материалы">Сохранил адреса ссылок и медиа, которые используются оригиналом</SectionHead><div className="source-inventory-grid"><div><h3>Ссылки</h3><ul>{data.links.map((link, index) => <li key={`${link.href}-${index}`}><a href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>{link.text || link.href}</a><code>{link.href}</code></li>)}</ul></div><div><h3>Медиа-адреса</h3><details open><summary>{data.mediaUrls.length} адресов оригинала</summary><ul>{data.mediaUrls.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul></details></div></div></section>
  </Shell>;
}

const foodPage = sourcePages["/food"];
const foodMenuUrl = foodPage.mediaUrls.find((url) => url.includes("heyzine.com/flip-book")) || "https://heyzine.com/flip-book/b61cad3e63.html";

/* eslint-disable @next/next/no-img-element */
function FoodGalleryImage({ src, index, onSelect }: { src: string; index: number; onSelect: () => void }) {
  return <figure className="food-gallery-item"><button className="food-gallery-link" type="button" onClick={onSelect} aria-label={`Открыть фуд-фотографию ${index + 1}`}><img src={src} alt={`Фуд-фотография Production Moscow ${index + 1}`} loading={index < 4 ? "eager" : "lazy"} /></button></figure>;
}

function FoodGallery({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedImage = selectedIndex === null ? null : images[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft") setSelectedIndex((current) => current === null ? null : (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setSelectedIndex((current) => current === null ? null : (current + 1) % images.length);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [images.length, selectedIndex]);

  const move = (direction: -1 | 1) => setSelectedIndex((current) => current === null ? null : (current + direction + images.length) % images.length);

    const lightbox = selectedImage ? <div className="food-lightbox" role="dialog" aria-modal="true" aria-label="Галерея фуд-фотографий">
      <div className="food-lightbox-content">
        <div className="food-lightbox-top"><span>{String((selectedIndex || 0) + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span><button type="button" className="food-lightbox-close" onClick={() => setSelectedIndex(null)} aria-label="Закрыть галерею">Закрыть ×</button></div>
        <div className="food-lightbox-stage"><button type="button" className="food-lightbox-arrow food-lightbox-arrow-prev" onClick={() => move(-1)} aria-label="Предыдущее изображение">←</button><img src={selectedImage} alt={`Фуд-фотография Production Moscow ${(selectedIndex || 0) + 1}`} /><button type="button" className="food-lightbox-arrow food-lightbox-arrow-next" onClick={() => move(1)} aria-label="Следующее изображение">→</button></div>
        <div className="food-lightbox-thumbs" aria-label="Миниатюры галереи">{images.map((src, index) => <button className={index === selectedIndex ? "selected" : ""} type="button" key={src} onClick={() => setSelectedIndex(index)} aria-label={`Показать фотографию ${index + 1}`}><img src={src} alt="" /></button>)}</div>
      </div>
    </div> : null;

    return <>
      <div className="food-gallery">{images.map((src, index) => <FoodGalleryImage key={src} src={src} index={index} onSelect={() => setSelectedIndex(index)} />)}</div>
      {lightbox && typeof document !== "undefined" ? createPortal(lightbox, document.body) : null}
    </>;
}
/* eslint-enable @next/next/no-img-element */

function FoodPage() {
  const heroImage = foodPage.imageUrls[2] || foodPage.imageUrls[0];
  const galleryImages = foodPage.imageUrls.filter((_, index) => index >= 3);

  return <Shell current="food">
    <section className="food-hero reveal">
      <div className="food-hero-copy">
        <p className="eyebrow">ФУД-ФОТО // PRODUCTION MOSCOW</p>
        <h1>Фуд-фото и меню<br />под ключ в Москве<span className="accent">*</span></h1>
        <p className="food-hero-description">Полный цикл производства контента для ресторанов, кафе и сервисов доставки еды.</p>
      </div>
      <div className="food-hero-media"><img src={heroImage} alt="Фуд-фотография Production Moscow" />{/* eslint-disable-line @next/next/no-img-element */}</div>
    </section>
    <section className="lined-section food-gallery-section reveal">
      <SectionHead number="02" title="Нам есть что показать">Картинки важнее слов. Наши работы лучше всего нас продают.</SectionHead>
      <FoodGallery images={galleryImages} />
    </section>
    <section className="lined-section food-menu-section reveal">
      <SectionHead number="03" title="Меню под ключ">Полистайте пример меню, которое мы создаём для ресторанов и сервисов доставки</SectionHead>
      <div className="food-menu-layout">
        <p className="food-menu-label">productionmoscow.ru<br /><span>Меню под ключ</span></p>
        <div className="food-menu-frame"><iframe src={foodMenuUrl} title="Пример меню под ключ" loading="lazy" allow="fullscreen" /></div>
      </div>
    </section>
    <section className="lined-section food-story-section reveal">
      <SectionHead number="04" title="Фотография еды, которая продаёт">Красивый и реалистичный визуал помогает привлечь и удержать клиентов ресторана или сервиса доставки.</SectionHead>
      <div className="food-story-grid">
        <p>Рестораны и службы доставки — важные игроки в гастрономической индустрии. Одна из самых важных задач для них — привлечение и удержание клиентов. Фотографии еды — мощный инструмент для решения этой задачи.</p>
        <div><p>Фотографии еды — это первый взгляд на продукт, который покупатель видит, прежде чем сделать заказ. Они должны быть качественными, привлекательными и реалистичными.</p><p>Если фотографии выглядят вкусно и привлекательно, это повышает вероятность, что люди закажут их в вашем ресторане или службе доставки.</p></div>
      </div>
    </section>
    <section className="contact-banner event-contact reveal">
      <div><p className="small-label">05 / Контакты</p><h2>КОНТАКТЫ</h2></div>
      <div className="contact-banner-action"><ContactMethods /><ContactPhones /><ArrowLink href="/contact">Контакты</ArrowLink></div>
    </section>
  </Shell>;
}

export default function Site({ page = "home" }: { page?: SitePage }) {
  if (page === "case") return <CasePage />;
  if (page === "event") return <EventPage />;
  if (page === "stream") return <StreamPage />;
  if (page === "food") return <FoodPage />;
  if (page === "politika") return <SourcePage current="politika" data={sourcePages["/politika"]} />;
  if (page === "studio") return <SourcePage current="studio" data={sourcePages["/studio"]} />;
  if (page === "kiselev") return <SourcePage current="kiselev" data={sourcePages["/kiselev"]} />;
  if (page === "golf") return <SourcePage current="golf" data={sourcePages["/golf"]} />;
  if (page === "pokavsedoma") return <SourcePage current="pokavsedoma" data={sourcePages["/pokavsedoma"]} />;
  if (page === "vsacademy") return <SourcePage current="vsacademy" data={sourcePages["/vsacademy"]} />;
  if (page === "gnivts") return <SourcePage current="gnivts" data={sourcePages["/gnivts"]} />;
  if (page === "contact") return <ContactPage />;
  if (page === "conf") return <PrivacyPage />;
  if (page === "gpt") return <GptPage />;
  return <HomePage />;
}
