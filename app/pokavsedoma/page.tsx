import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Смета на проведение съемки \"Пока все дома\" 22.05.2025",
  description: "Смета съемок и постпродакшена проекта \"Пока все дома\".",
  alternates: { canonical: "/pokavsedoma" },
};

export default function PokaVseDoma() {
  return <Site page="pokavsedoma" />;
}
