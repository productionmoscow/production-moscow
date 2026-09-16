import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Видное — чек-лист съёмки",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true, nosnippet: true },
  },
};

export default function TwoCamTrans() {
  return (
    <main style={{ minHeight: "100vh", background: "#f3f1ec" }}>
      <iframe
        title="Видное — чек-лист двухкамерной съёмки"
        src="/2camtrans/index.html"
        style={{ display: "block", width: "100%", minHeight: "100vh", border: 0 }}
      />
    </main>
  );
}
