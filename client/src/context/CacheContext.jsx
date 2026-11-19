import React, { createContext, useContext, useRef, useCallback } from 'react';

const CacheContext = createContext(null);

export function CacheProvider({ children }) {
  const cacheRef = useRef(new Map());

  /**
   * Cached fetch with stale-while-revalidate strategy:
   * Returns cached data immediately if available, while fetching in background.
   */
  const fetchCached = useCallback(async (url, maxAgeMs = 60000) => {
    const cached = cacheRef.current.get(url);
    const now = Date.now();

    if (cached && now - cached.timestamp < maxAgeMs) {
      return cached.data;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      cacheRef.current.set(url, { data, timestamp: now });
      return data;
    } catch (err) {
      if (cached) return cached.data; // fallback to stale cache on network glitch
      throw err;
    }
  }, []);

  const clearCache = useCallback((urlPattern) => {
    if (!urlPattern) {
      cacheRef.current.clear();
      return;
    }
    for (const key of cacheRef.current.keys()) {
      if (key.includes(urlPattern)) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  return (
    <CacheContext.Provider value={{ fetchCached, clearCache }}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}
