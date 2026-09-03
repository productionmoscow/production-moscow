import type { Metadata } from "next";
import Site from "./site";

export const metadata: Metadata = {
  title: "Production Moscow: Видеопродакшн полного цикла в Москве",
  description: "Production Moscow - продакшн студия полного цикла в Москве. Видеосъемка мероприятий, прямые трансляции, промо-ролики, музыкальные клипы и фуд-фотография. Узнайте больше!",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Site />;
}
