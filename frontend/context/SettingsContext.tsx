import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { ConfigEndpoint } from '../constants/endpoint';

const SETTINGS_CACHE_KEY = 'cachedSettings';
const SETTINGS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface SettingsContextType {
  settings: Record<string, any>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({ settings: {}, refreshSettings: async () => {} });

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, any>>({});

  const fetchAndCache = async () => {
    try {
      const res = await api.get(ConfigEndpoint.settings);
      if (res.status === 200) {
        setSettings(res.data);
        await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
          data: res.data,
          fetchedAt: Date.now(),
        }));
      }
    } catch (e) {
      console.error('[SettingsContext] Failed to fetch settings:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Serve from cache immediately if fresh
      const cached = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
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
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchAndCache }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
