import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventRun Pro",
  description: "Gestão de eventos esportivos com foco em corridas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
