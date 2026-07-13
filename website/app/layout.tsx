import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/context/LoadingContext";
import ApiInterceptor from "./components/ApiInterceptor";
import AppWrapper from "./components/AppWrapper";
import GoogleAuthProviderWrapper from "./components/GoogleAuthProviderWrapper";
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["300", "500", "600"], variable: "--font-fraunces" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

export async function generateMetadata(): Promise<Metadata> {
  const isMaintenanceMode = process.env.PRODUCTION_MODE === 'true';
  
  if (isMaintenanceMode) {
    return {
      title: "Mentivo | Coming Soon",
      description: "Something great is in the works. We are building a platform to connect the next generation of engineers with expert mentors from the IIT community.",
      icons: {
        icon: "/logo.svg",
      },
      openGraph: {
        siteName: "Mentivo",
      },
    };
  }

  return {
    title: "Mentivo | Learn from IITians",
    description: "Unlock your potential with personalized mentorship from the prestigious IIT community.",
    icons: {
      icon: "/logo.svg",
    },
    openGraph: {
      siteName: "Mentivo",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMaintenanceMode = process.env.PRODUCTION_MODE === 'true';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Mentivo",
    "url": "https://mentivo.in"
  };

  return (
    <html lang="en" className="scroll-smooth bg-[#f8fafc]" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} ${jetBrainsMono.variable} font-sans bg-[#f8fafc] text-slate-900 antialiased`}>
        <LoadingProvider>
          <ApiInterceptor>
            <GoogleAuthProviderWrapper>
              <AppWrapper isMaintenanceMode={isMaintenanceMode}>
                {children}
              </AppWrapper>
            </GoogleAuthProviderWrapper>
          </ApiInterceptor>
        </LoadingProvider>
        <Analytics />
      </body>
    </html>
  );
}
