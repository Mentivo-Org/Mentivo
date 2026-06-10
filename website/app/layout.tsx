import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/context/LoadingContext";
import ApiInterceptor from "./components/ApiInterceptor";
import AppWrapper from "./components/AppWrapper";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const isMaintenanceMode = process.env.PRODUCTION_MODE === 'true';
  
  if (isMaintenanceMode) {
    return {
      title: "Mentivo | Coming Soon",
      description: "Something great is in the works. We are building a platform to connect the next generation of engineers with expert mentors from the IIT community.",
      icons: {
        icon: "/logo.svg",
      },
    };
  }

  return {
    title: "Mentivo | Learn from IITians",
    description: "Unlock your potential with personalized mentorship from the prestigious IIT community.",
    icons: {
      icon: "/logo.svg",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMaintenanceMode = process.env.PRODUCTION_MODE === 'true';

  return (
    <html lang="en" className="scroll-smooth bg-[#f8fafc]" data-scroll-behavior="smooth">
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900 antialiased`}>
        <LoadingProvider>
          <ApiInterceptor>
            <AppWrapper isMaintenanceMode={isMaintenanceMode}>
              {children}
            </AppWrapper>
          </ApiInterceptor>
        </LoadingProvider>
      </body>
    </html>
  );
}
