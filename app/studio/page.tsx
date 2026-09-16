import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Белое на Белом - предметная фотостудия в Москве // Фото, видео, 360 для маркетплейсов по всей России",
  description: "Предметная фотостудия Белое на Белом: фото, видео, распаковка, реклама и контент для маркетплейсов.",
  alternates: { canonical: "/studio" },
};

export default function Studio() {
  return <Site page="studio" />;
}
