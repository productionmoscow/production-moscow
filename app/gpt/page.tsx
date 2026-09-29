import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "AI-ассистент Production Moscow — обсудить задачу",
  description: "AI-ассистент Production Moscow: ответы об услугах, кейсах и помощь с заявкой на видеопродакшн.",
  alternates: { canonical: "/gpt" },
};

export default function Gpt() {
  return <Site page="gpt" />;
}
