import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных | ProductionMoscow",
  description: "Политика обработки персональных данных сайта Production Moscow.",
  alternates: { canonical: "/conf" },
};

export default function Privacy() {
  return <Site page="conf" />;
}
