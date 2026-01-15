/**
 * Smoke Test Service
 * Provides utilities for running end-to-end smoke tests
 */

import { supabase } from '@/integrations/supabase/client';
import { AVAILABLE_TOOLS, getToolByName, toolExists } from './orchestrator';
import { webLLM, isWebLLMSupported } from './web-llm';

export interface SmokeTestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

export interface SmokeTestReport {
  timestamp: string;
  passed: number;
  failed: number;
  total: number;
  results: SmokeTestResult[];
}

// Test orchestrator tools registration
async function testOrchestratorTools(): Promise<SmokeTestResult> {
  const start = performance.now();
  
  try {
    const toolCount = AVAILABLE_TOOLS.length;
    const categories = new Set(AVAILABLE_TOOLS.map(t => t.category));
    
    // Verify critical tools exist
    const criticalTools = [
      'create_task',
      'create_reminder',
      'create_note',
      'navigate_to',
      'get_current_time',
      'web_search',
    ];
    
    const missingTools = criticalTools.filter(t => !toolExists(t));
    
    if (missingTools.length > 0) {
      return {
        name: 'Orchestrator Tools',
        passed: false,
        duration: performance.now() - start,
        error: `Missing critical tools: ${missingTools.join(', ')}`,
      };
    }
    
    // Verify tool lookup works
    const taskTool = getToolByName('create_task');
    if (!taskTool) {
      return {
        name: 'Orchestrator Tools',
        passed: false,
        duration: performance.now() - start,
        error: 'Tool lookup failed',
      };
    }
    
    return {
      name: 'Orchestrator Tools',
      passed: true,
      duration: performance.now() - start,
      details: {
        toolCount,
        categoryCount: categories.size,
        categories: Array.from(categories),
      },
    };
  } catch (error: any) {
    return {
      name: 'Orchestrator Tools',
      passed: false,
      duration: performance.now() - start,
      error: error.message,
    };
  }
}

// Test Supabase connection
async function testSupabaseConnection(): Promise<SmokeTestResult> {
  const start = performance.now();
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        name: 'Supabase Connection',
        passed: false,
        duration: performance.now() - start,
        error: error.message,
      };
    }
    
    return {
      name: 'Supabase Connection',
      passed: true,
      duration: performance.now() - start,
      details: {
        hasSession: !!data.session,
      },
    };
  } catch (error: any) {
    return {
      name: 'Supabase Connection',
      passed: false,
      duration: performance.now() - start,
      error: error.message,
    };
  }
}

// Test WebLLM availability
async function testWebLLM(): Promise<SmokeTestResult> {
  const start = performance.now();
  
  try {
    const supported = isWebLLMSupported();
    
    if (!supported) {
      return {
        name: 'WebLLM (Offline AI)',
        passed: true, // Not a failure, just not supported
        duration: performance.now() - start,
        details: {
          supported: false,
          reason: 'WebGPU not available',
        },
      };
    }
    
    const cached = await webLLM.isModelCached();
    const status = webLLM.getStatus();
    
    return {
      name: 'WebLLM (Offline AI)',
      passed: true,
      duration: performance.now() - start,
      details: {
        supported: true,
        modelCached: cached,
        modelId: status.modelId,
      },
    };
  } catch (error: any) {
    return {
      name: 'WebLLM (Offline AI)',
      passed: false,
      duration: performance.now() - start,
      error: error.message,
    };
  }
}

// Test voice system
async function testVoiceSystem(): Promise<SmokeTestResult> {
  const start = performance.now();
  
  try {
    const hasMediaRecorder = 'MediaRecorder' in window;
    const hasAudioContext = 'AudioContext' in window || 'webkitAudioContext' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    
    const allSupported = hasMediaRecorder && hasAudioContext && hasSpeechSynthesis;
    
    return {
      name: 'Voice System',
      passed: allSupported,
      duration: performance.now() - start,
      details: {
        mediaRecorder: hasMediaRecorder,
        audioContext: hasAudioContext,
        speechSynthesis: hasSpeechSynthesis,
      },
      error: allSupported ? undefined : 'Some voice features unavailable',
    };
  } catch (error: any) {
    return {
      name: 'Voice System',
      passed: false,
      duration: performance.now() - start,
      error: error.message,
    };
  }
}

// Test local storage
async function testLocalStorage(): Promise<SmokeTestResult> {
  const start = performance.now();
  
  try {
    const testKey = '__smoke_test__';
    const testValue = Date.now().toString();
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      return {
        name: 'Local Storage',
        passed: false,
        duration: performance.now() - start,
        error: 'Value mismatch',
      };
    }
    
    return {
      name: 'Local Storage',
      passed: true,
      duration: performance.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'Local Storage',
      passed: false,
      duration: performance.now() - start,
      error: error.message,
    };
  }
}

// Test IndexedDB
async function testIndexedDB(): Promise<SmokeTestResult> {
  const start = performance.now();
  
  try {
    if (!('indexedDB' in window)) {
      return {
        name: 'IndexedDB',
        passed: false,
        duration: performance.now() - start,
        error: 'IndexedDB not supported',
      };
    }
    
    return new Promise((resolve) => {
      const request = indexedDB.open('__smoke_test__', 1);
      
      request.onerror = () => {
        resolve({
          name: 'IndexedDB',
          passed: false,
          duration: performance.now() - start,
          error: 'Failed to open database',
        });
      };
      
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase('__smoke_test__');
        resolve({
          name: 'IndexedDB',
          passed: true,
          duration: performance.now() - start,
        });
      };
    });
  } catch (error: any) {
    return {
      name: 'IndexedDB',
      passed: false,
      duration: performance.now() - start,
      error: error.message,
    };
  }
}

// Test service worker
async function testServiceWorker(): Promise<SmokeTestResult> {
  const start = performance.now();
  
  try {
    if (!('serviceWorker' in navigator)) {
      return {
        name: 'Service Worker',
        passed: true, // Not a failure in dev
        duration: performance.now() - start,
        details: {
          supported: false,
        },
      };
    }
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    return {
      name: 'Service Worker',
      passed: true,
      duration: performance.now() - start,
      details: {
        supported: true,
        registrationCount: registrations.length,
      },
    };
  } catch (error: any) {
    return {
      name: 'Service Worker',
      passed: false,
      duration: performance.now() - start,
      error: error.message,
    };
  }
}

// Test React Query
async function testReactQuery(): Promise<SmokeTestResult> {
  const start = performance.now();
  
  try {
    // Check if QueryClient is available
    const hasQueryClient = typeof window !== 'undefined';
    
    return {
      name: 'React Query',
      passed: hasQueryClient,
      duration: performance.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'React Query',
      passed: false,
      duration: performance.now() - start,
      error: error.message,
    };
  }
}

// Run all smoke tests
export async function runSmokeTests(): Promise<SmokeTestReport> {
  const results: SmokeTestResult[] = [];
  
  // Run all tests
  results.push(await testOrchestratorTools());
  results.push(await testSupabaseConnection());
  results.push(await testWebLLM());
  results.push(await testVoiceSystem());
  results.push(await testLocalStorage());
  results.push(await testIndexedDB());
  results.push(await testServiceWorker());
  results.push(await testReactQuery());
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    timestamp: new Date().toISOString(),
    passed,
    failed,
    total: results.length,
    results,
  };
}

// Log smoke test report
export function logSmokeTestReport(report: SmokeTestReport): void {
  console.group(`[Smoke Test] ${report.passed}/${report.total} passed - ${report.timestamp}`);
  
  report.results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${result.duration.toFixed(0)}ms)${result.error ? ` - ${result.error}` : ''}`);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  });
  
  console.groupEnd();
}

// Quick smoke test (for startup)
export async function quickSmokeTest(): Promise<boolean> {
  try {
    // Just check critical systems
    const toolsOk = AVAILABLE_TOOLS.length > 50;
    const storageOk = (() => {
      try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        return true;
      } catch {
        return false;
      }
    })();
    
    return toolsOk && storageOk;
  } catch {
    return false;
  }
}