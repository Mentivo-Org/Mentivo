import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { LoadingProvider } from "@/context/LoadingContext";
import LoadingModal from "@/components/LoadingModal";
import ApiInterceptor from "@/components/ApiInterceptor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mentivo Admin Dashboard",
  description: "Secure management for Mentivo platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LoadingProvider>
          <ApiInterceptor>
            {children}
            <LoadingModal />
          </ApiInterceptor>
        </LoadingProvider>
      </body>
    </html>
  );
}