import type { Post } from '../types';

const DATA_URL = 'https://raw.githubusercontent.com/dvuzu/monkrus-search/refs/heads/main/scraped_data.json';

let cachedData: Post[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'monkrus_data_cache';

// Try to load from localStorage on module load
try {
  const stored = localStorage.getItem(CACHE_KEY);
  if (stored) {
    const { data, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp < CACHE_DURATION) {
      cachedData = data;
      cacheTimestamp = timestamp;
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  }
} catch (error) {
  console.warn('Failed to load cache from localStorage:', error);
}

export async function fetchMonkrus(timeout = 10000): Promise<Post[]> {
  // Return cached data if still valid
  if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedData;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(DATA_URL, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      throw new Error(`Network response not ok: ${res.status} ${res.statusText}`);
    }
    
    const json = await res.json();
    
    if (!Array.isArray(json)) {
      throw new Error('Invalid data format: expected array');
    }
    
    // Validate data structure
    const validatedData = json.filter(item => 
      item && 
      typeof item.title === 'string' && 
      typeof item.link === 'string' && 
      Array.isArray(item.links)
    );
    
    // Cache the data in memory and localStorage
    cachedData = validatedData;
    cacheTimestamp = Date.now();
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: validatedData,
        timestamp: cacheTimestamp,
      }));
    } catch (error) {
      console.warn('Failed to cache to localStorage:', error);
    }
    
    return validatedData;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

export function clearCache(): void {
  cachedData = null;
  cacheTimestamp = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear cache from localStorage:', error);
  }
}

export function refresh(): Promise<Post[]> {
  clearCache();
  return fetchMonkrus();
}