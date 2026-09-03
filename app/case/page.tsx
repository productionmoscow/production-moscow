import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Портфолио видеопродакшна Production Moscow",
  description: "Фильмы для мероприятий, промо-ролики и проекты Production Moscow.",
  alternates: { canonical: "/case" },
};

export default function Case() {
  return <Site page="case" />;
}
