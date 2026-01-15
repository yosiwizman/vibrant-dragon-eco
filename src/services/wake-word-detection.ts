// Wake word detection service
// Uses Web Speech API for continuous listening

// Type declarations for Web Speech API (not included in standard TypeScript lib)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface WakeWordConfig {
  wakeWord: string;
  onWakeWordDetected: () => void;
  onError?: (error: string) => void;
}

let recognition: SpeechRecognition | null = null;
let isListening = false;
let config: WakeWordConfig | null = null;
let restartTimeout: ReturnType<typeof setTimeout> | null = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

// Check if wake word detection is supported
export function isWakeWordSupported(): boolean {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

// Start wake word detection
export function startWakeWordDetection(wakeWordConfig: WakeWordConfig): boolean {
  console.log('[WakeWord] startWakeWordDetection called with:', wakeWordConfig.wakeWord);
  
  if (!isWakeWordSupported()) {
    console.error('[WakeWord] Not supported in this browser');
    wakeWordConfig.onError?.("Wake word detection not supported in this browser");
    return false;
  }

  // Clear any pending restart
  if (restartTimeout) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }

  // If already listening with same config, just return true
  if (isListening && recognition && config?.wakeWord === wakeWordConfig.wakeWord) {
    console.log('[WakeWord] Already listening for same wake word');
    return true;
  }

  // Stop existing recognition if any
  if (recognition) {
    console.log('[WakeWord] Stopping existing recognition before starting new one');
    try {
      recognition.abort();
    } catch (e) {
      // Ignore
    }
    recognition = null;
  }

  config = wakeWordConfig;
  consecutiveErrors = 0;

  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognitionConstructor();

  recognition.continuous = true;
  recognition.interimResults = false; // Only final results to reduce noise
  recognition.lang = "en-US";

  recognition.onstart = () => {
    console.log('[WakeWord] Recognition started - listening for:', config?.wakeWord);
    isListening = true;
    consecutiveErrors = 0;
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const results = event.results;
    
    for (let i = event.resultIndex; i < results.length; i++) {
      const transcript = results[i][0].transcript.toLowerCase().trim();
      const confidence = results[i][0].confidence;
      const wakeWord = config?.wakeWord.toLowerCase() || "echo";
      
      console.log('[WakeWord] Heard:', transcript, '(confidence:', confidence?.toFixed(2) || 'N/A', ')');
      
      // More flexible wake word matching - check for the wake word anywhere in the transcript
      const wakePatterns = [
        wakeWord,
        `hey ${wakeWord}`,
        `ok ${wakeWord}`,
        `okay ${wakeWord}`,
        `hi ${wakeWord}`,
        `hello ${wakeWord}`,
      ];
      
      // Also check for common misheard variations
      const variations = [
        wakeWord,
        wakeWord.replace(/o$/, 'oh'), // echo -> echoh
        wakeWord.replace(/^e/, 'a'),  // echo -> acho
      ];
      
      const allPatterns = [...new Set([...wakePatterns, ...variations])];
      
      const detected = allPatterns.some(pattern => {
        // Check if transcript contains the pattern
        const patternLower = pattern.toLowerCase();
        return transcript === patternLower ||
               transcript.startsWith(patternLower + ' ') ||
               transcript.startsWith(patternLower + ',') ||
               transcript.startsWith(patternLower + '.') ||
               transcript.includes(' ' + patternLower + ' ') ||
               transcript.includes(' ' + patternLower + ',') ||
               transcript.includes(' ' + patternLower + '.') ||
               transcript.endsWith(' ' + patternLower) ||
               transcript.endsWith(',' + patternLower) ||
               transcript.endsWith('.' + patternLower);
      });
      
      if (detected) {
        console.log('[WakeWord] ✓ Wake word detected in:', transcript);
        
        // Stop listening to avoid double triggers
        isListening = false;
        
        try {
          recognition?.abort();
        } catch (e) {
          // Ignore
        }
        
        // Trigger callback
        config?.onWakeWordDetected();
        
        return;
      }
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.log('[WakeWord] Error:', event.error);
    
    if (event.error === "no-speech") {
      // This is normal when there's silence, don't count as error
      return;
    }
    
    if (event.error === "aborted") {
      // Intentionally stopped
      return;
    }

    if (event.error === "not-allowed") {
      console.error('[WakeWord] Microphone permission denied');
      config?.onError?.("Microphone permission denied. Please allow microphone access.");
      isListening = false;
      return;
    }

    consecutiveErrors++;
    
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error('[WakeWord] Too many consecutive errors, stopping');
      config?.onError?.(`Wake word detection stopped due to repeated errors: ${event.error}`);
      isListening = false;
      return;
    }
  };

  recognition.onend = () => {
    console.log('[WakeWord] Recognition ended, isListening:', isListening);
    
    // Restart if still supposed to be listening
    if (isListening && recognition && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
      console.log('[WakeWord] Restarting recognition...');
      
      // Small delay before restart to avoid rapid restart loops
      restartTimeout = setTimeout(() => {
        if (isListening && recognition) {
          try {
            recognition.start();
          } catch (e: any) {
            console.error('[WakeWord] Failed to restart:', e.message);
            // Try to recreate recognition
            if (config) {
              setTimeout(() => {
                if (isListening && config) {
                  startWakeWordDetection(config);
                }
              }, 1000);
            }
          }
        }
      }, 100);
    }
  };

  try {
    recognition.start();
    console.log('[WakeWord] Recognition.start() called');
    return true;
  } catch (error: any) {
    console.error('[WakeWord] Failed to start:', error.message);
    config?.onError?.("Failed to start wake word detection: " + error.message);
    isListening = false;
    return false;
  }
}

// Stop wake word detection
export function stopWakeWordDetection(): void {
  console.log('[WakeWord] stopWakeWordDetection called');
  
  isListening = false;
  
  if (restartTimeout) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }
  
  if (recognition) {
    try {
      recognition.abort();
    } catch (e) {
      // Already stopped, ignore
    }
    recognition = null;
  }
  
  config = null;
  consecutiveErrors = 0;
}

// Check if wake word detection is active
export function isWakeWordActive(): boolean {
  return isListening;
}

// Update wake word
export function updateWakeWord(newWakeWord: string): void {
  console.log('[WakeWord] Updating wake word to:', newWakeWord);
  if (config) {
    config.wakeWord = newWakeWord;
  }
}