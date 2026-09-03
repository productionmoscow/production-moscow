import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Съемка корпоративных мероприятий под ключ. ProductionMoscow.ru",
  description: "Фото, видео мероприятия и трансляция на экраны. Фильмы, клипы, тизеры. Все фото обработаны, фотографии с фотозоны ретушированы",
  alternates: { canonical: "/event" },
};

export default function Events() {
  return <Site page="event" />;
}
