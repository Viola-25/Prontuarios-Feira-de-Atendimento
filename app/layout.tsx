import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LogoutButton } from "@/components/logout-button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Feira de Saúde - São Camilo",
  description: "Sistema de prontuários da Feira de Atendimento São Camilo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="bg-teal-700 text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
            <h1 className="text-xl font-semibold">
              Feira de Saúde - São Camilo
            </h1>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-gray-100 text-gray-600">
          <div className="mx-auto max-w-5xl px-4 py-4 text-center text-sm">
            © {new Date().getFullYear()} Feira de Saúde - São Camilo
          </div>
        </footer>
      </body>
    </html>
  );
}
