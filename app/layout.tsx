import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HeartPulse } from "lucide-react";
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
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
            <h1 className="flex items-center gap-3 text-lg font-bold tracking-tight text-slate-900">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm shadow-teal-600/30">
                <HeartPulse className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                Feira de Saúde
                <span className="block text-xs font-medium text-slate-500">
                  São Camilo
                </span>
              </span>
            </h1>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200/60 bg-white/50">
          <div className="mx-auto max-w-5xl px-4 py-5 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Feira de Saúde - São Camilo
          </div>
        </footer>
      </body>
    </html>
  );
}
