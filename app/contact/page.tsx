import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Контакты Production Moscow",
  description: "Связаться с Production Moscow по вопросам видеопродакшна, съёмки мероприятий и прямых трансляций.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return <Site page="contact" />;
}
