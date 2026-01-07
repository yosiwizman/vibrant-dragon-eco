"use client";

import { logger } from "@/utils/logger";

interface ListeningContext {
  isShortCommand: boolean;
  isLongForm: boolean;
  isDictation: boolean;
  backgroundNoise: 'low' | 'medium' | 'high';
}

interface AdaptiveConfig {
  silenceThreshold: number;
  silenceDuration: number;
  noiseGate: number;
}

/**
 * Adaptive Listening Service
 * Dynamically adjusts listening parameters based on context
 */
class AdaptiveListeningService {
  private context: ListeningContext = {
    isShortCommand: false,
    isLongForm: false,
    isDictation: false,
    backgroundNoise: 'low',
  };

  private baseConfig: AdaptiveConfig = {
    silenceThreshold: 10,
    silenceDuration: 1500,
    noiseGate: 5,
  };

  /**
   * Analyze audio and determine context
   */
  analyzeContext(audioData: Uint8Array): ListeningContext {
    const average = audioData.reduce((a, b) => a + b, 0) / audioData.length;
    const variance = this.calculateVariance(audioData, average);

    // Detect background noise level
    const backgroundNoise = average < 20 ? 'low' : average < 40 ? 'medium' : 'high';

    // Detect if short command (low variance, short duration)
    const isShortCommand = variance < 10 && audioData.length < 1000;

    // Detect if long form (high variance, long duration)
    const isLongForm = variance > 20 && audioData.length > 2000;

    // Detect if dictation (steady volume, long duration)
    const isDictation = variance < 15 && audioData.length > 3000;

    return {
      isShortCommand,
      isLongForm,
      isDictation,
      backgroundNoise,
    };
  }

  /**
   * Get adaptive configuration based on context
   */
  getAdaptiveConfig(context?: ListeningContext): AdaptiveConfig {
    const ctx = context || this.context;

    // Short commands (e.g., "yes", "no", "stop")
    if (ctx.isShortCommand) {
      return {
        silenceThreshold: 15, // Higher threshold
        silenceDuration: 800,  // Shorter wait (0.8s)
        noiseGate: 8,
      };
    }

    // Long form dictation
    if (ctx.isDictation) {
      return {
        silenceThreshold: 8,   // Lower threshold
        silenceDuration: 2500, // Longer wait (2.5s)
        noiseGate: 3,
      };
    }

    // Normal commands
    if (ctx.isLongForm) {
      return {
        silenceThreshold: 10,
        silenceDuration: 2000, // 2s
        noiseGate: 5,
      };
    }

    // Adjust for background noise
    const noiseAdjustment = {
      'low': 0,
      'medium': 5,
      'high': 10,
    }[ctx.backgroundNoise];

    return {
      silenceThreshold: this.baseConfig.silenceThreshold + noiseAdjustment,
      silenceDuration: this.baseConfig.silenceDuration,
      noiseGate: this.baseConfig.noiseGate + (noiseAdjustment / 2),
    };
  }

  /**
   * Calculate variance for audio analysis
   */
  private calculateVariance(data: Uint8Array, mean: number): number {
    const squaredDiffs = Array.from(data).map(x => Math.pow(x - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / data.length);
  }

  /**
   * Detect if user is still speaking
   */
  isSpeaking(audioData: Uint8Array, config: AdaptiveConfig): boolean {
    const average = audioData.reduce((a, b) => a + b, 0) / audioData.length;
    return average > config.silenceThreshold;
  }

  /**
   * Apply noise gate to filter background noise
   */
  applyNoiseGate(audioData: Uint8Array, config: AdaptiveConfig): Uint8Array {
    return audioData.map(value => 
      value < config.noiseGate ? 0 : value
    );
  }

  /**
   * Update context based on new audio
   */
  updateContext(audioData: Uint8Array): void {
    this.context = this.analyzeContext(audioData);
  }

  /**
   * Get current context
   */
  getContext(): ListeningContext {
    return this.context;
  }

  /**
   * Reset context
   */
  resetContext(): void {
    this.context = {
      isShortCommand: false,
      isLongForm: false,
      isDictation: false,
      backgroundNoise: 'low',
    };
  }
}

export const adaptiveListening = new AdaptiveListeningService();

/**
 * Enhanced silence detection with adaptive thresholds
 */
export class AdaptiveSilenceDetector {
  private analyser: AnalyserNode;
  private silenceStart: number | null = null;
  private config: AdaptiveConfig;
  private onSilenceDetected: () => void;
  private checkInterval: number | null = null;

  constructor(
    analyser: AnalyserNode,
    onSilenceDetected: () => void,
    initialConfig?: AdaptiveConfig
  ) {
    this.analyser = analyser;
    this.onSilenceDetected = onSilenceDetected;
    this.config = initialConfig || adaptiveListening.getAdaptiveConfig();
  }

  /**
   * Start detecting silence
   */
  start(): void {
    this.checkInterval = window.setInterval(() => {
      this.checkSilence();
    }, 100);
  }

  /**
   * Stop detecting silence
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.silenceStart = null;
  }

  /**
   * Check for silence
   */
  private checkSilence(): void {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Update context based on audio
    adaptiveListening.updateContext(dataArray);
    
    // Get updated config
    this.config = adaptiveListening.getAdaptiveConfig();

    // Apply noise gate
    const filtered = adaptiveListening.applyNoiseGate(dataArray, this.config);

    // Check if speaking
    const speaking = adaptiveListening.isSpeaking(filtered, this.config);

    if (!speaking) {
      if (this.silenceStart === null) {
        this.silenceStart = Date.now();
      } else if (Date.now() - this.silenceStart > this.config.silenceDuration) {
        logger.log('AdaptiveSilence', 'Silence detected', {
          duration: this.config.silenceDuration,
          context: adaptiveListening.getContext(),
        });
        this.onSilenceDetected();
        this.stop();
      }
    } else {
      this.silenceStart = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AdaptiveConfig>): void {
    this.config = { ...this.config, ...config };
  }
}