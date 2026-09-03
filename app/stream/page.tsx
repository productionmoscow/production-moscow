import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Видео-производство Антона Чернова - продакшн полного цикла в Москве",
  description: "Организация онлайн-трансляций под ключ. Проведение мероприятий онлайн всех возможных форматов. Оборудование для проведения трансляций в аренду. Полное техническое обеспечение и сопровождение трансляции",
  alternates: { canonical: "/stream" },
};

export default function Stream() {
  return <Site page="stream" />;
}
