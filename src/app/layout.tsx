import type { Metadata } from "next";
import { Sora, Oswald } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventRun Pro",
  description: "Gestao de eventos esportivos com foco em corridas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${oswald.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
