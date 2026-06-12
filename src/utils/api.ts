// src/utils/api.ts - Centralized backend API URL mapper with automatic static host detection
export function getApiUrl(endpoint: string): string {
  // 1. Check for explicit environment variable override (e.g. your Render backend URL)
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}${endpoint}`;
  }

  // 2. Auto-detect static hosting like Vercel, GitHub Pages, or Netlify, and point to the Render backend automatically
  const hostname = typeof window !== 'undefined' ? window.location?.hostname : '';
  const isVercelOrStatic = 
    hostname.includes('vercel.app') || 
    hostname.includes('netlify.app') || 
    hostname.includes('github.io') || 
    hostname.includes('surge.sh') ||
    hostname === 'mentor-assessment.vercel.app';

  if (isVercelOrStatic) {
    return `https://mentor-assessment.onrender.com${endpoint}`;
  }

  // 3. Fallback to relative path (perfect for unified hosting or when custom proxies apply inside our AI Studio environment)
  return endpoint;
}
