import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Прямые трансляции мероприятий под ключ | ProductionMoscow",
  description: "Прямые трансляции мероприятий любого формата с многокамерной съёмкой, графикой, техническим обеспечением и стабильным подключением.",
  alternates: { canonical: "/stream" },
};

export default function Stream() {
  return <Site page="stream" />;
}
