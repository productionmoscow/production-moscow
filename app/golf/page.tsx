import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Смета на проведение прямой трансляции OLIMPBET по гольфу",
  description: "Расчет технического обеспечения и продакшена прямой трансляции турнира по гольфу.",
  alternates: { canonical: "/golf" },
};

export default function Golf() {
  return <Site page="golf" />;
}
