import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Съёмка корпоративных мероприятий под ключ в Москве | ProductionMoscow",
  description: "Видеосъёмка корпоративных мероприятий, форумов и презентаций под ключ в Москве и по всей России.",
  alternates: { canonical: "/event" },
};

export default function Events() {
  return <Site page="event" />;
}
