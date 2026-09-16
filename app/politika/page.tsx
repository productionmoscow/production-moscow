import type { Metadata } from "next";
import Site from "../site";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика в отношении обработки персональных данных Production Moscow.",
  alternates: { canonical: "/politika" },
};

export default function Politika() {
  return <Site page="politika" />;
}
