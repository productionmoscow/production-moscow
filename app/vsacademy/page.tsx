import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Смета для VS academy",
  description: "Расчет сметы на создание фотозоны и профессиональной системы освещения в VS academy.",
  alternates: { canonical: "/vsacademy" },
};

export default function VsAcademy() {
  return <Site page="vsacademy" />;
}
