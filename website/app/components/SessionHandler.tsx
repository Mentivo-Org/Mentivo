'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function SessionHandler() {
  const { validateSession, isSignedIn, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const hasValidated = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (hasValidated.current) return;
      
      hasValidated.current = true;
      await validateSession();
    };

    handleAuth();
  }, [validateSession]);

  useEffect(() => {
    // List of paths that logged-in users should not be on
    const guestPaths = ['/', '/login', '/signup', '/verify-otp'];
    
    if (isSignedIn && user && guestPaths.includes(pathname)) {
      if (user.role === 'mentor') {
        router.replace('/mentor/home');
      } else {
        router.replace('/student/home');
      }
    }
  }, [isSignedIn, user, pathname, router]);

  return null;
}
