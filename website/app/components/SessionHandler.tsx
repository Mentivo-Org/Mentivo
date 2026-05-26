'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function SessionHandler() {
  const { validateSession, isSignedIn, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const hasValidated = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
    const handleAuth = async () => {
      if (hasValidated.current) return;
      
      hasValidated.current = true;
      setIsValidating(true);
      await validateSession();
      setIsValidating(false);
    };

    handleAuth();
  }, [validateSession]);

  useEffect(() => {
    // List of paths that logged-in users should not be on
    const guestPaths = ['/', '/login', '/signup', '/verify-otp'];
    
    if (isHydrated && isSignedIn && user && guestPaths.includes(pathname)) {
      if (user.role === 'mentor') {
        router.replace('/mentor/home');
      } else {
        router.replace('/student/home');
      }
    }
  }, [isSignedIn, user, pathname, router, isHydrated]);

  // Prevent flash of guest content if we are potentially redirecting
  const guestPaths = ['/', '/login', '/signup', '/verify-otp'];
  if (isHydrated && guestPaths.includes(pathname) && (isSignedIn || isValidating)) {
    return (
      <div className="fixed inset-0 bg-white z-[9999]" />
    );
  }

  return null;
}
