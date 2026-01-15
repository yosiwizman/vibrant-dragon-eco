/**
 * System Health Check Service
 * Provides utilities for monitoring system health and diagnostics
 */

import { supabase } from '@/integrations/supabase/client';
import { webLLM, isWebLLMSupported } from './web-llm';

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface SystemHealthReport {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  metrics: {
    memoryUsage?: number;
    connectionCount?: number;
    cacheSize?: number;
  };
}

// Check Supabase connection
async function checkSupabase(): Promise<HealthCheckResult> {
  const start = performance.now();
  
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const latency = performance.now() - start;
    
    if (error) {
      return {
        component: 'Supabase',
        status: 'unhealthy',
        latency,
        message: error.message,
      };
    }
    
    return {
      component: 'Supabase',
      status: latency < 1000 ? 'healthy' : 'degraded',
      latency,
      message: latency < 1000 ? 'Connected' : 'Slow response',
    };
  } catch (error: any) {
    return {
      component: 'Supabase',
      status: 'unhealthy',
      latency: performance.now() - start,
      message: error.message || 'Connection failed',
    };
  }
}

// Check OpenAI API
async function checkOpenAI(apiKey?: string): Promise<HealthCheckResult> {
  if (!apiKey) {
    return {
      component: 'OpenAI',
      status: 'degraded',
      message: 'API key not configured',
    };
  }
  
  const start = performance.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    const latency = performance.now() - start;
    
    if (!response.ok) {
      return {
        component: 'OpenAI',
        status: 'unhealthy',
        latency,
        message: `API error: ${response.status}`,
      };
    }
    
    return {
      component: 'OpenAI',
      status: latency < 2000 ? 'healthy' : 'degraded',
      latency,
      message: 'Connected',
    };
  } catch (error: any) {
    return {
      component: 'OpenAI',
      status: 'unhealthy',
      latency: performance.now() - start,
      message: error.message || 'Connection failed',
    };
  }
}

// Check WebLLM (offline AI)
async function checkWebLLM(): Promise<HealthCheckResult> {
  if (!isWebLLMSupported()) {
    return {
      component: 'WebLLM',
      status: 'degraded',
      message: 'WebGPU not supported',
    };
  }
  
  try {
    const cached = await webLLM.isModelCached();
    const status = webLLM.getStatus();
    
    return {
      component: 'WebLLM',
      status: cached ? 'healthy' : 'degraded',
      message: cached ? 'Model cached and ready' : 'Model not downloaded',
      details: {
        modelId: status.modelId,
        isInitialized: status.isInitialized,
      },
    };
  } catch (error: any) {
    return {
      component: 'WebLLM',
      status: 'unhealthy',
      message: error.message || 'Check failed',
    };
  }
}

// Check browser capabilities
function checkBrowserCapabilities(): HealthCheckResult {
  const capabilities = {
    webGPU: 'gpu' in navigator,
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    webSpeech: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    mediaRecorder: 'MediaRecorder' in window,
    geolocation: 'geolocation' in navigator,
  };
  
  const supported = Object.values(capabilities).filter(Boolean).length;
  const total = Object.keys(capabilities).length;
  
  return {
    component: 'Browser',
    status: supported >= total - 1 ? 'healthy' : supported >= total - 2 ? 'degraded' : 'unhealthy',
    message: `${supported}/${total} capabilities supported`,
    details: capabilities,
  };
}

// Check network status
function checkNetwork(): HealthCheckResult {
  const online = navigator.onLine;
  const connection = (navigator as any).connection;
  
  const details: Record<string, any> = {
    online,
  };
  
  if (connection) {
    details.effectiveType = connection.effectiveType;
    details.downlink = connection.downlink;
    details.rtt = connection.rtt;
  }
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let message = 'Online';
  
  if (!online) {
    status = 'degraded';
    message = 'Offline mode';
  } else if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
    status = 'degraded';
    message = 'Slow connection';
  }
  
  return {
    component: 'Network',
    status,
    message,
    details,
  };
}

// Check memory usage
function checkMemory(): HealthCheckResult {
  const memory = (performance as any).memory;
  
  if (!memory) {
    return {
      component: 'Memory',
      status: 'healthy',
      message: 'Memory API not available',
    };
  }
  
  const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
  const totalMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
  const usagePercent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (usagePercent > 80) status = 'unhealthy';
  else if (usagePercent > 60) status = 'degraded';
  
  return {
    component: 'Memory',
    status,
    message: `${usedMB}MB / ${totalMB}MB (${usagePercent}%)`,
    details: {
      usedMB,
      totalMB,
      usagePercent,
    },
  };
}

// Check voice system
function checkVoiceSystem(): HealthCheckResult {
  const hasMediaRecorder = 'MediaRecorder' in window;
  const hasAudioContext = 'AudioContext' in window || 'webkitAudioContext' in window;
  const hasSpeechSynthesis = 'speechSynthesis' in window;
  
  const allSupported = hasMediaRecorder && hasAudioContext && hasSpeechSynthesis;
  
  return {
    component: 'Voice',
    status: allSupported ? 'healthy' : 'degraded',
    message: allSupported ? 'All voice features supported' : 'Some features unavailable',
    details: {
      mediaRecorder: hasMediaRecorder,
      audioContext: hasAudioContext,
      speechSynthesis: hasSpeechSynthesis,
    },
  };
}

// Run full health check
export async function runHealthCheck(openaiApiKey?: string): Promise<SystemHealthReport> {
  const checks: HealthCheckResult[] = [];
  
  // Run all checks
  checks.push(checkNetwork());
  checks.push(checkBrowserCapabilities());
  checks.push(checkMemory());
  checks.push(checkVoiceSystem());
  checks.push(await checkSupabase());
  checks.push(await checkWebLLM());
  
  // Only check OpenAI if key provided
  if (openaiApiKey) {
    checks.push(await checkOpenAI(openaiApiKey));
  }
  
  // Determine overall status
  const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
  const degradedCount = checks.filter(c => c.status === 'degraded').length;
  
  let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (unhealthyCount > 0) overall = 'unhealthy';
  else if (degradedCount > 1) overall = 'degraded';
  
  // Gather metrics
  const memory = (performance as any).memory;
  const metrics: SystemHealthReport['metrics'] = {};
  
  if (memory) {
    metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
  }
  
  return {
    timestamp: new Date().toISOString(),
    overall,
    checks,
    metrics,
  };
}

// Quick health check (synchronous, no network calls)
export function quickHealthCheck(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!navigator.onLine) {
    issues.push('Offline');
  }
  
  if (!('MediaRecorder' in window)) {
    issues.push('Voice recording unavailable');
  }
  
  if (!('gpu' in navigator)) {
    issues.push('Offline AI unavailable');
  }
  
  const memory = (performance as any).memory;
  if (memory && memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
    issues.push('High memory usage');
  }
  
  return {
    status: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy',
    issues,
  };
}

// Log health report to console
export function logHealthReport(report: SystemHealthReport): void {
  console.group(`[Health Check] ${report.overall.toUpperCase()} - ${report.timestamp}`);
  
  report.checks.forEach(check => {
    const icon = check.status === 'healthy' ? '✅' : check.status === 'degraded' ? '⚠️' : '❌';
    console.log(`${icon} ${check.component}: ${check.message}${check.latency ? ` (${check.latency.toFixed(0)}ms)` : ''}`);
  });
  
  if (Object.keys(report.metrics).length > 0) {
    console.log('Metrics:', report.metrics);
  }
  
  console.groupEnd();
}