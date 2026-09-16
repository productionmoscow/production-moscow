import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Коммерческое предложение для компании \"ГНИВЦ\" по созданию Инхаус-медиа",
  description: "Предложение по созданию in-house продакшн-студии и корпоративного медиаканала для ГНИВЦ.",
  alternates: { canonical: "/gnivts" },
};

export default function Gnivts() {
  return <Site page="gnivts" />;
}
