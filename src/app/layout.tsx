import WelcomeToast from "@/components/WelcomeToast";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/Footer";
import { LoaderProvider } from "@/components/LoaderContext";
import { GlobalLoader } from "@/components/GlobalLoader";
import { ToastProvider } from "@/components/ToastContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agro Gestión - Sistema de Gestión Administrativa",
  description: "Sistema de gestión contable y administrativa para empresas agropecuarias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head></head>
      <body className="min-h-full flex flex-col font-sans bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
        <LoaderProvider>
          <ToastProvider>
            <ThemeProvider>
              <GlobalLoader show={false} />
              <div className="flex flex-col min-h-screen">
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              {/* Splash overlay, fuera del flujo principal */}
              <WelcomeToast />
            </ThemeProvider>
          </ToastProvider>
        </LoaderProvider>
      </body>
    </html>
  );
}
