import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import LoadingScreen from '../components/LoadingScreen';

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

  const showLoading = useCallback((message?: string) => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);
  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, []);

  const value = useMemo(
    () => ({ showLoading, hideLoading, isLoading }),
    [showLoading, hideLoading, isLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && <LoadingScreen message={loadingMessage} />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
