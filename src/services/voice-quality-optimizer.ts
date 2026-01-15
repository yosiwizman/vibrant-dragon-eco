/**
 * Voice Quality Optimizer
 * Automatically adjusts voice settings based on environment and device
 */

import { logger } from '@/utils/logger';

interface AudioEnvironment {
  noiseLevel: 'quiet' | 'moderate' | 'noisy';
  deviceType: 'mobile' | 'desktop' | 'tablet';
  connectionQuality: 'excellent' | 'good' | 'poor';
  batteryLevel?: number;
}

interface VoiceQualitySettings {
  sampleRate: number;
  bitRate: number;
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  voiceSpeed: number;
  voiceVolume: number;
}

class VoiceQualityOptimizerService {
  private currentEnvironment: AudioEnvironment | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseHistory: number[] = [];

  /**
   * Initialize audio analysis
   */
  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      logger.log('VoiceQualityOptimizer', 'Initialized');
    } catch (error) {
      logger.error('VoiceQualityOptimizer', 'Failed to initialize:', error);
    }
  }

  /**
   * Analyze current environment
   */
  async analyzeEnvironment(): Promise<AudioEnvironment> {
    const deviceType = this.detectDeviceType();
    const connectionQuality = await this.measureConnectionQuality();
    const noiseLevel = await this.measureNoiseLevel();
    const batteryLevel = await this.getBatteryLevel();

    this.currentEnvironment = {
      noiseLevel,
      deviceType,
      connectionQuality,
      batteryLevel,
    };

    logger.log('VoiceQualityOptimizer', 'Environment analyzed:', this.currentEnvironment);
    
    return this.currentEnvironment;
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const ua = navigator.userAgent.toLowerCase();
    
    if (/ipad|tablet|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  /**
   * Measure connection quality
   */
  private async measureConnectionQuality(): Promise<'excellent' | 'good' | 'poor'> {
    const connection = (navigator as any).connection;
    
    if (!connection) {
      return 'good'; // Default assumption
    }

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;

    if (effectiveType === '4g' && downlink > 5) {
      return 'excellent';
    }
    
    if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1)) {
      return 'good';
    }
    
    return 'poor';
  }

  /**
   * Measure ambient noise level
   */
  private async measureNoiseLevel(): Promise<'quiet' | 'moderate' | 'noisy'> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!this.audioContext || !this.analyser) {
        await this.initialize();
      }

      const source = this.audioContext!.createMediaStreamSource(stream);
      source.connect(this.analyser!);

      const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
      
      // Sample for 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.analyser!.getByteFrequencyData(dataArray);
      
      // Calculate average amplitude
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      
      // Stop stream
      stream.getTracks().forEach(track => track.stop());
      source.disconnect();

      // Store in history
      this.noiseHistory.push(average);
      if (this.noiseHistory.length > 10) {
        this.noiseHistory.shift();
      }

      // Determine noise level
      if (average < 30) return 'quiet';
      if (average < 60) return 'moderate';
      return 'noisy';
    } catch (error) {
      logger.warn('VoiceQualityOptimizer', 'Could not measure noise level');
      return 'moderate';
    }
  }

  /**
   * Get battery level
   */
  private async getBatteryLevel(): Promise<number | undefined> {
    try {
      const battery = await (navigator as any).getBattery?.();
      return battery?.level ? Math.round(battery.level * 100) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get optimized voice settings
   */
  getOptimizedSettings(): VoiceQualitySettings {
    const env = this.currentEnvironment || {
      noiseLevel: 'moderate',
      deviceType: 'desktop',
      connectionQuality: 'good',
    };

    const settings: VoiceQualitySettings = {
      sampleRate: 16000,
      bitRate: 128000,
      noiseReduction: true,
      echoCancellation: true,
      autoGainControl: true,
      voiceSpeed: 1.0,
      voiceVolume: 0.8,
    };

    // Adjust based on noise level
    if (env.noiseLevel === 'noisy') {
      settings.noiseReduction = true;
      settings.autoGainControl = true;
      settings.voiceVolume = 1.0; // Louder in noisy environments
      settings.voiceSpeed = 0.9; // Slightly slower for clarity
    } else if (env.noiseLevel === 'quiet') {
      settings.voiceVolume = 0.6; // Quieter in quiet environments
    }

    // Adjust based on device type
    if (env.deviceType === 'mobile') {
      settings.sampleRate = 16000; // Lower for mobile
      settings.bitRate = 64000;
    }

    // Adjust based on connection quality
    if (env.connectionQuality === 'poor') {
      settings.sampleRate = 8000;
      settings.bitRate = 32000;
    } else if (env.connectionQuality === 'excellent') {
      settings.sampleRate = 24000;
      settings.bitRate = 192000;
    }

    // Adjust for low battery
    if (env.batteryLevel !== undefined && env.batteryLevel < 20) {
      settings.sampleRate = Math.min(settings.sampleRate, 16000);
      settings.bitRate = Math.min(settings.bitRate, 64000);
    }

    return settings;
  }

  /**
   * Get MediaRecorder constraints
   */
  getRecorderConstraints(): MediaTrackConstraints {
    const settings = this.getOptimizedSettings();
    
    return {
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseReduction,
      autoGainControl: settings.autoGainControl,
      sampleRate: settings.sampleRate,
    };
  }

  /**
   * Get speech synthesis settings
   */
  getSpeechSettings(): { rate: number; volume: number; pitch: number } {
    const settings = this.getOptimizedSettings();
    
    return {
      rate: settings.voiceSpeed,
      volume: settings.voiceVolume,
      pitch: 1.0,
    };
  }

  /**
   * Get current environment
   */
  getEnvironment(): AudioEnvironment | null {
    return this.currentEnvironment;
  }

  /**
   * Get noise trend
   */
  getNoiseTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.noiseHistory.length < 3) return 'stable';
    
    const recent = this.noiseHistory.slice(-3);
    const trend = recent[2] - recent[0];
    
    if (trend > 10) return 'increasing';
    if (trend < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.noiseHistory = [];
  }
}

export const voiceQualityOptimizer = new VoiceQualityOptimizerService();