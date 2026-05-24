import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SessionHandler from "./components/SessionHandler";
import { LoadingProvider } from "@/context/LoadingContext";
import LoadingModal from "./components/LoadingModal";
import ApiInterceptor from "./components/ApiInterceptor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mentivo | Learn from IITians",
  description: "Unlock your potential with personalized mentorship from the prestigious IIT community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMaintenanceMode = process.env.PRODUCTION_MODE === 'true';

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900 antialiased`}>
        <LoadingProvider>
          <ApiInterceptor>
            <SessionHandler />
            {!isMaintenanceMode && <Navbar />}
            <main className={isMaintenanceMode ? "" : "min-h-screen pt-16"}>
              {children}
            </main>
            {!isMaintenanceMode && <Footer />}
            <LoadingModal />
          </ApiInterceptor>
        </LoadingProvider>
      </body>
    </html>
  );
}
