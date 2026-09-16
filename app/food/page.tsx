import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Фотосъемка Еды",
  description: "Фуд-фото и меню под ключ в Москве. Полный цикл производства контента для ресторанов, кафе и сервисов доставки еды.",
  alternates: { canonical: "/food" },
};

export default function Food() {
  return <Site page="food" />;
}
