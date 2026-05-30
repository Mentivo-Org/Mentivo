'use client';

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminAuthHandler({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Logged in
      if (pathname === "/login" || pathname === "/") {
        router.replace("/dashboard");
      }
    } else {
      // Not logged in
      if (pathname !== "/login") {
        router.replace("/login");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;

  return <>{children}</>;
}
