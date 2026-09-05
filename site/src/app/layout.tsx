import type { Metadata } from "next";
import { Unbounded, Roboto_Mono } from "next/font/google";
import "./globals.css";

const exo = Unbounded({
  variable: "--font-exo",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Química de les aromes — Georgijs Topolevs",
  description:
    "Интерактивная презентация исследовательского проекта: сравнение классической гидродистилляции и UAHD для извлечения эфирных масел.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${exo.variable} ${robotoMono.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
