"use client";

import { useEffect } from "react";
import api from "@/lib/api";
import { useLoading } from "@/context/LoadingContext";

export default function ApiInterceptor({ children }: { children: React.ReactNode }) {
  const { setIsLoading } = useLoading();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      // @ts-ignore - custom property
      if (!config.skipLoader) {
        setIsLoading(true);
      }
      return config;
    }, (error) => {
      setIsLoading(false);
      return Promise.reject(error);
    });

    const responseInterceptor = api.interceptors.response.use((response) => {
      // @ts-ignore - custom property
      if (!response.config.skipLoader) {
        setIsLoading(false);
      }
      return response;
    }, (error) => {
      setIsLoading(false);
      return Promise.reject(error);
    });

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [setIsLoading]);

  return <>{children}</>;
}
