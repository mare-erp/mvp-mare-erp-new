import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ErrorBoundary from "@/app/components/ErrorBoundary"; // Importando o ErrorBoundary

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maré ERP",
  description: "Gestão empresarial simplificada.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
