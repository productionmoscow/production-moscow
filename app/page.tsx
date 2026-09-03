import type { Metadata } from "next";
import Site from "./site";

export const metadata: Metadata = {
  title: "Production Moscow: Видеопродакшн полного цикла в Москве",
  description: "Надёжный видеопродакшн для мероприятий и бизнеса: съёмка, трансляции и монтаж в Москве и по всей России.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Site />;
}
