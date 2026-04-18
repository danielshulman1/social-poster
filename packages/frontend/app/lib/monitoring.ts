import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.location.hostname === 'socialposter.easy-ai.co.uk') {
    const body = JSON.stringify(metric);
    navigator.sendBeacon('/api/metrics', body);
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }
}

export function initializeWebVitals() {
  onCLS(reportWebVitals);
  onFID(reportWebVitals);
  onFCP(reportWebVitals);
  onLCP(reportWebVitals);
  onTTFB(reportWebVitals);
}
