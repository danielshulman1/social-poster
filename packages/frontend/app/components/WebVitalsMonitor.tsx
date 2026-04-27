'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

function reportWebVitals(metric: any) {
  if (typeof window === 'undefined') return;

  // Send to backend metrics endpoint
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    unit: metric.unit || 'ms',
    timestamp: new Date().toISOString(),
  });

  navigator.sendBeacon('/api/metrics', body);

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value.toFixed(2), metric.unit || 'ms');
  }
}

export default function WebVitalsMonitor() {
  useEffect(() => {
    onCLS(reportWebVitals);
    onINP(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
  }, []);

  return null;
}
