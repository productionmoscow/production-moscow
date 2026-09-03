import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Портфолио Production Moscow: Видеосъемка мероприятий, промо-ролики, клипы",
  description: "Ознакомьтесь с портфолио Production Moscow! Наши работы: фильмы для мероприятий, прямые трансляции, музыкальные клипы, промо-видео и фуд-фотография в Москве. Оцените качество!",
  alternates: { canonical: "/case" },
};

export default function Case() {
  return <Site page="case" />;
}
