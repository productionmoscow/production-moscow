import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Андрей Киселев - видеограф в Серпухове, Чехове, Подольске и Москве",
  description: "Живые, настоящие и эмоциональные видео Андрея Киселева для свадеб и корпоративов.",
  alternates: { canonical: "/kiselev" },
};

export default function Kiselev() {
  return <Site page="kiselev" />;
}
