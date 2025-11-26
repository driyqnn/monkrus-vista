import { useState } from 'react';

export interface MirrorTestResult {
  url: string;
  online: boolean;
  time: number | null;
  status: 'fast' | 'normal' | 'slow' | 'offline';
}

export function useMirrorTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Map<string, MirrorTestResult>>(new Map());

  const testMirror = async (url: string, timeout = 5000): Promise<MirrorTestResult> => {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors',
      });

      clearTimeout(timeoutId);

      const endTime = performance.now();
      const time = Math.round(endTime - startTime);

      return {
        url,
        online: true,
        time,
        status: time < 1000 ? 'fast' : time < 3000 ? 'normal' : 'slow',
      };
    } catch (error) {
      return {
        url,
        online: false,
        time: null,
        status: 'offline',
      };
    }
  };

  const testMultipleMirrors = async (urls: string[]) => {
    setTesting(true);
    
    const testPromises = urls.map(url => testMirror(url));
    const testResults = await Promise.all(testPromises);
    
    const newResults = new Map(results);
    testResults.forEach(result => {
      newResults.set(result.url, result);
    });
    
    setResults(newResults);
    setTesting(false);
    
    return newResults;
  };

  const getResult = (url: string) => results.get(url);

  return {
    testing,
    results,
    testMirror,
    testMultipleMirrors,
    getResult,
  };
}
