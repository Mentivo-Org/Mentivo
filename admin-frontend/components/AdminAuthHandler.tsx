'use client';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

export default function AdminAuthHandler({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/me");
        // Logged in
        if (pathname === "/login" || pathname === "/") {
          router.replace("/dashboard");
        } else {
          setIsReady(true);
        }
      } catch (err) {
        // Not logged in
        if (pathname !== "/login") {
          router.replace("/login");
        } else {
          setIsReady(true);
        }
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (!isReady) return null;

  return <>{children}</>;
}
