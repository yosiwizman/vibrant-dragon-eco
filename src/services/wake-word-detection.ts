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
  start(): void;
  stop(): void;
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

// Check if wake word detection is supported
export function isWakeWordSupported(): boolean {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

// Start wake word detection
export function startWakeWordDetection(wakeWordConfig: WakeWordConfig): boolean {
  if (!isWakeWordSupported()) {
    wakeWordConfig.onError?.("Wake word detection not supported in this browser");
    return false;
  }

  if (isListening) {
    return true;
  }

  config = wakeWordConfig;

  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognitionConstructor();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const results = event.results;
    
    for (let i = event.resultIndex; i < results.length; i++) {
      // Only process final results to avoid false triggers
      if (!results[i].isFinal) continue;
      
      const transcript = results[i][0].transcript.toLowerCase().trim();
      const wakeWord = config?.wakeWord.toLowerCase() || "echo";
      
      console.log('[WakeWord] Heard:', transcript);
      
      // More flexible wake word matching
      const wakePatterns = [
        wakeWord,
        `hey ${wakeWord}`,
        `ok ${wakeWord}`,
        `okay ${wakeWord}`,
        `hi ${wakeWord}`,
        `hello ${wakeWord}`,
      ];
      
      const detected = wakePatterns.some(pattern => {
        // Check if transcript starts with or contains the pattern
        return transcript.startsWith(pattern) ||
               transcript.includes(` ${pattern} `) ||
               transcript.endsWith(` ${pattern}`);
      });
      
      if (detected) {
        console.log('[WakeWord] Wake word detected!');
        
        // Stop listening temporarily to avoid double triggers
        stopWakeWordDetection();
        
        // Trigger callback
        config?.onWakeWordDetected();
        
        // Restart after conversation ends (longer delay)
        setTimeout(() => {
          if (config && !isListening) {
            console.log('[WakeWord] Restarting wake word detection');
            startWakeWordDetection(config);
          }
        }, 10000); // 10 seconds
        
        return;
      }
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "no-speech") {
      // This is normal, just restart
      return;
    }
    
    if (event.error === "aborted") {
      return;
    }
    
    config?.onError?.(`Wake word error: ${event.error}`);
  };

  recognition.onend = () => {
    // Restart if still supposed to be listening
    if (isListening && recognition) {
      try {
        recognition.start();
      } catch (e) {
        // Already started, ignore
      }
    }
  };

  try {
    recognition.start();
    isListening = true;
    return true;
  } catch (error) {
    config?.onError?.("Failed to start wake word detection");
    return false;
  }
}

// Stop wake word detection
export function stopWakeWordDetection(): void {
  isListening = false;
  
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // Already stopped, ignore
    }
    recognition = null;
  }
}

// Check if wake word detection is active
export function isWakeWordActive(): boolean {
  return isListening;
}

// Update wake word
export function updateWakeWord(newWakeWord: string): void {
  if (config) {
    config.wakeWord = newWakeWord;
  }
}