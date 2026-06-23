import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { LoadingProvider } from "@/context/LoadingContext";
import { AuthProvider } from "@/context/AuthContext";
import ApiInterceptor from "@/components/ApiInterceptor";
import AdminAuthHandler from "@/components/AdminAuthHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mentivo Admin Dashboard",
  description: "Secure management for Mentivo platform",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LoadingProvider>
            <ApiInterceptor>
              <AdminAuthHandler>
                {children}
              </AdminAuthHandler>
            </ApiInterceptor>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
