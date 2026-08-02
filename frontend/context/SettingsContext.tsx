import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { storage, StorageKey } from '../services/storage';
import api from '../services/api';
import { ConfigEndpoint } from '../constants/endpoint';

const SETTINGS_CACHE_KEY: StorageKey = 'cachedSettings';
const SETTINGS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface SettingsContextType {
  settings: Record<string, any>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({ settings: {}, refreshSettings: async () => {} });

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, any>>({});

  const fetchAndCache = useCallback(async () => {
    try {
      const res = await api.get(ConfigEndpoint.settings);
      if (res.status === 200) {
        setSettings(res.data);
        await storage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
          data: res.data,
          fetchedAt: Date.now(),
        }));
      }
    } catch (e) {
      console.error('[SettingsContext] Failed to fetch settings:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // Serve from cache immediately if fresh
      const cached = await storage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        const { data, fetchedAt } = JSON.parse(cached);
        if (Date.now() - fetchedAt < SETTINGS_CACHE_TTL_MS) {
          setSettings(data);
          return; // Skip network call
        }
      }
      await fetchAndCache();
    };
    init();
  }, [fetchAndCache]);

  const value = useMemo(
    () => ({ settings, refreshSettings: fetchAndCache }),
    [settings, fetchAndCache]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
