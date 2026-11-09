import { prisma } from '../db/prisma.js';

let cachedSettings = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export const SettingsService = {
  /**
   * Load all settings into memory.
   * @returns {Promise<Record<string, { bn: string, en: string, type: string, group: string }>>}
   */
  async loadAll() {
    const now = Date.now();
    if (cachedSettings && now - lastCacheTime < CACHE_TTL_MS) {
      return cachedSettings;
    }

    try {
      const rows = await prisma.siteSetting.findMany();
      const map = {};
      for (const row of rows) {
        map[row.key] = {
          bn: row.valueBn || '',
          en: row.valueEn || '',
          type: row.type || 'text',
          group: row.group || 'general',
        };
      }
      cachedSettings = map;
      lastCacheTime = now;
      return cachedSettings;
    } catch (err) {
      console.warn('Error loading site settings:', err.message);
      return cachedSettings || {};
    }
  },

  /**
   * Get setting value with locale fallback
   * @param {string} key
   * @param {any} [defaultValue='']
   * @param {'bn'|'en'} [locale='bn']
   * @returns {Promise<any>}
   */
  async getValue(key, defaultValue = '', locale = null) {
    const all = await this.loadAll();
    const entry = all[key];
    if (!entry) {
      return defaultValue;
    }

    if (!locale) {
      return entry.bn || entry.en || defaultValue;
    }

    const primary = locale === 'en' ? entry.en : entry.bn;
    const fallback = locale === 'en' ? entry.bn : entry.en;

    if (primary !== null && primary !== undefined && primary !== '') {
      return primary;
    }
    if (fallback !== null && fallback !== undefined && fallback !== '') {
      return fallback;
    }

    return defaultValue;
  },

  /**
   * Return full map of all settings for API response
   * @returns {Promise<Record<string, any>>}
   */
  async getAll() {
    return this.loadAll();
  },

  /**
   * Save an admin-edited setting
   */
  async setValue(key, valueBn, valueEn = null, type = 'text', group = 'general') {
    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: {
        valueBn: valueBn !== undefined ? String(valueBn) : null,
        valueEn: valueEn !== undefined ? String(valueEn || valueBn) : null,
        type,
        group,
      },
      create: {
        key,
        valueBn: valueBn !== undefined ? String(valueBn) : null,
        valueEn: valueEn !== undefined ? String(valueEn || valueBn) : null,
        type,
        group,
      },
    });

    this.clearCache();
    return setting;
  },

  /**
   * Non-destructive insert: only insert if key does NOT exist
   */
  async seedDefault(key, valueBn, valueEn = null, type = 'text', group = 'general') {
    const existing = await prisma.siteSetting.findUnique({ where: { key } });
    if (existing) {
      return existing;
    }

    const created = await prisma.siteSetting.create({
      data: {
        key,
        valueBn: valueBn !== undefined ? String(valueBn) : null,
        valueEn: valueEn !== undefined ? String(valueEn || valueBn) : null,
        type,
        group,
      },
    });

    this.clearCache();
    return created;
  },

  clearCache() {
    cachedSettings = null;
    lastCacheTime = 0;
  },
};

