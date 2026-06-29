"use client";

import { useEffect } from "react";
import api from "@/lib/api";
import { useLoading } from "@/context/LoadingContext";

export default function ApiInterceptor({ children }: { children: React.ReactNode }) {
  const { setIsLoading } = useLoading();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      // Opt-in to loading modal if showLoading is set
      if ((config as any).showLoading) {
        setIsLoading(true);
      }
      return config;
    }, (error) => {
      setIsLoading(false);
      return Promise.reject(error);
    });

    const responseInterceptor = api.interceptors.response.use((response) => {
      if ((response.config as any).showLoading) {
        setIsLoading(false);
      }
      return response;
    }, async (error) => {
      if ((error.config as any)?.showLoading) {
        setIsLoading(false);
      }
      const originalRequest = error.config;
      const errorMessage = error.response?.data?.error || "";

      // Check for token expiration (standard 401 with specific message)
      if (
        error.response?.status === 401 && 
        errorMessage.toLowerCase().includes("token") && 
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          // Attempt to silent refresh using the httpOnly refresh cookie
          await api.post("/auth/refresh");
          // Re-run the original request
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, let the error propagate (will likely trigger login redirect)
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    });

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [setIsLoading]);

  return <>{children}</>;
}
