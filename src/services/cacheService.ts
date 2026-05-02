
import { DeviceCategory, DiagnosisResult } from "../types";

const CACHE_KEY_PREFIX = 'titan_neural_cache_';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

interface CacheEntry {
  timestamp: number;
  result: DiagnosisResult;
}

export const cacheService = {
  /**
   * Normalizes symptom descriptions to facilitate clustering.
   * "My screen is broken" -> "broken screen"
   */
  normalizeSymptoms(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2) // Remove short stop words
      .sort()
      .join(' ')
      .trim();
  },

  /**
   * Generates a simple hash from the first image base64 string
   */
  generateImageHash(images: string[]): string {
    if (!images || images.length === 0) return 'no_image';
    // Use the first image (usually the main one)
    // Take a substring from the middle to check for uniqueness without hashing the whole megabyte
    const snippet = images[0].substring(images[0].length / 2, (images[0].length / 2) + 100);
    let hash = 0;
    for (let i = 0; i < snippet.length; i++) {
      const char = snippet.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  },

  /**
   * Generates a unique key based on device category, symptoms, coarse location, AND image hash.
   * Coarse location ensures local specialist accuracy (approx 11km radius).
   */
  generateKey(category: DeviceCategory, symptoms: string, images: string[], lat?: number, lng?: number): string {
    const normalized = this.normalizeSymptoms(symptoms);
    const imgHash = this.generateImageHash(images);
    // Round to 1 decimal place (~11km precision) to preserve specialist relevance
    const locKey = lat && lng ? `_${lat.toFixed(1)}_${lng.toFixed(1)}` : '_global';
    return `${CACHE_KEY_PREFIX}${category}_${normalized}_${imgHash}${locKey}`;
  },

  get(category: DeviceCategory, symptoms: string, images: string[], lat?: number, lng?: number): DiagnosisResult | null {
    const key = this.generateKey(category, symptoms, images, lat, lng);
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;

    try {
      const entry: CacheEntry = JSON.parse(stored);
      const isExpired = Date.now() - entry.timestamp > CACHE_EXPIRY_MS;
      
      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }
      
      return entry.result;
    } catch (e) {
      console.error("CACHE_READ_FAILURE", e);
      return null;
    }
  },

  set(category: DeviceCategory, symptoms: string, images: string[], result: DiagnosisResult, lat?: number, lng?: number): void {
    const key = this.generateKey(category, symptoms, images, lat, lng);
    const entry: CacheEntry = {
      timestamp: Date.now(),
      result
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Storage full or unavailable
    }
  },

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_KEY_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
};
