"use client";

/**
 * Voice Biometrics Service
 * Speaker identification and voice authentication
 * Uses voice characteristics for user identification
 */

interface VoiceProfile {
  id: string;
  userId: string;
  name: string;
  features: VoiceFeatures;
  samples: number;
  createdAt: number;
  updatedAt: number;
  confidence: number;
}

interface VoiceFeatures {
  pitchMean: number;
  pitchVariance: number;
  energyMean: number;
  energyVariance: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  mfcc: number[]; // Mel-frequency cepstral coefficients
}

interface IdentificationResult {
  identified: boolean;
  userId?: string;
  userName?: string;
  confidence: number;
  alternatives: { userId: string; confidence: number }[];
}

interface EnrollmentResult {
  success: boolean;
  profileId?: string;
  samplesCollected: number;
  requiredSamples: number;
  message: string;
}

class VoiceBiometricsService {
  private profiles: Map<string, VoiceProfile> = new Map();
  private enrollmentBuffer: Map<string, VoiceFeatures[]> = new Map();
  private readonly REQUIRED_SAMPLES = 5;
  private readonly CONFIDENCE_THRESHOLD = 0.75;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.loadProfiles();
  }

  /**
   * Initialize audio context
   */
  private async initAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Load profiles from storage
   */
  private loadProfiles(): void {
    try {
      const stored = localStorage.getItem('voice_biometric_profiles');
      if (stored) {
        const profiles = JSON.parse(stored);
        profiles.forEach((p: VoiceProfile) => this.profiles.set(p.id, p));
      }
    } catch (error) {
      console.error('[voice-biometrics] Failed to load profiles:', error);
    }
  }

  /**
   * Save profiles to storage
   */
  private saveProfiles(): void {
    try {
      const profiles = Array.from(this.profiles.values());
      localStorage.setItem('voice_biometric_profiles', JSON.stringify(profiles));
    } catch (error) {
      console.error('[voice-biometrics] Failed to save profiles:', error);
    }
  }

  /**
   * Extract voice features from audio data
   */
  async extractFeatures(audioData: Float32Array): Promise<VoiceFeatures> {
    await this.initAudioContext();
    
    // Calculate pitch (fundamental frequency estimation)
    const pitch = this.estimatePitch(audioData);
    
    // Calculate energy
    const energy = this.calculateEnergy(audioData);
    
    // Calculate spectral centroid
    const spectralCentroid = this.calculateSpectralCentroid(audioData);
    
    // Calculate zero crossing rate
    const zeroCrossingRate = this.calculateZeroCrossingRate(audioData);
    
    // Calculate MFCC (simplified)
    const mfcc = this.calculateMFCC(audioData);
    
    return {
      pitchMean: pitch.mean,
      pitchVariance: pitch.variance,
      energyMean: energy.mean,
      energyVariance: energy.variance,
      spectralCentroid,
      zeroCrossingRate,
      mfcc
    };
  }

  /**
   * Estimate pitch using autocorrelation
   */
  private estimatePitch(audioData: Float32Array): { mean: number; variance: number } {
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const minPeriod = Math.floor(sampleRate / 500); // Max 500 Hz
    const maxPeriod = Math.floor(sampleRate / 50);  // Min 50 Hz
    
    let bestCorrelation = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    const pitch = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
    
    return {
      mean: pitch,
      variance: pitch * 0.1 // Simplified variance
    };
  }

  /**
   * Calculate energy of audio signal
   */
  private calculateEnergy(audioData: Float32Array): { mean: number; variance: number } {
    let sum = 0;
    let sumSquared = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      const energy = audioData[i] * audioData[i];
      sum += energy;
      sumSquared += energy * energy;
    }
    
    const mean = sum / audioData.length;
    const variance = (sumSquared / audioData.length) - (mean * mean);
    
    return { mean, variance: Math.max(0, variance) };
  }

  /**
   * Calculate spectral centroid
   */
  private calculateSpectralCentroid(audioData: Float32Array): number {
    // Simplified spectral centroid calculation
    let weightedSum = 0;
    let sum = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      const magnitude = Math.abs(audioData[i]);
      weightedSum += i * magnitude;
      sum += magnitude;
    }
    
    return sum > 0 ? weightedSum / sum : 0;
  }

  /**
   * Calculate zero crossing rate
   */
  private calculateZeroCrossingRate(audioData: Float32Array): number {
    let crossings = 0;
    
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0 && audioData[i - 1] < 0) ||
          (audioData[i] < 0 && audioData[i - 1] >= 0)) {
        crossings++;
      }
    }
    
    return crossings / audioData.length;
  }

  /**
   * Calculate simplified MFCC
   */
  private calculateMFCC(audioData: Float32Array): number[] {
    // Simplified MFCC - in production, use a proper DSP library
    const numCoefficients = 13;
    const mfcc: number[] = [];
    
    const frameSize = Math.floor(audioData.length / numCoefficients);
    
    for (let i = 0; i < numCoefficients; i++) {
      let sum = 0;
      const start = i * frameSize;
      const end = Math.min(start + frameSize, audioData.length);
      
      for (let j = start; j < end; j++) {
        sum += Math.abs(audioData[j]);
      }
      
      mfcc.push(sum / (end - start));
    }
    
    return mfcc;
  }

  /**
   * Start enrollment for a user
   */
  startEnrollment(userId: string): void {
    this.enrollmentBuffer.set(userId, []);
    console.log('[voice-biometrics] Started enrollment for user:', userId);
  }

  /**
   * Add enrollment sample
   */
  async addEnrollmentSample(userId: string, audioData: Float32Array): Promise<EnrollmentResult> {
    const buffer = this.enrollmentBuffer.get(userId);
    if (!buffer) {
      return {
        success: false,
        samplesCollected: 0,
        requiredSamples: this.REQUIRED_SAMPLES,
        message: 'Enrollment not started. Call startEnrollment first.'
      };
    }
    
    const features = await this.extractFeatures(audioData);
    buffer.push(features);
    
    if (buffer.length >= this.REQUIRED_SAMPLES) {
      // Complete enrollment
      const profile = this.createProfile(userId, buffer);
      this.enrollmentBuffer.delete(userId);
      
      return {
        success: true,
        profileId: profile.id,
        samplesCollected: buffer.length,
        requiredSamples: this.REQUIRED_SAMPLES,
        message: 'Enrollment complete!'
      };
    }
    
    return {
      success: false,
      samplesCollected: buffer.length,
      requiredSamples: this.REQUIRED_SAMPLES,
      message: `Sample ${buffer.length}/${this.REQUIRED_SAMPLES} collected. Keep speaking.`
    };
  }

  /**
   * Create voice profile from samples
   */
  private createProfile(userId: string, samples: VoiceFeatures[]): VoiceProfile {
    // Average the features
    const avgFeatures: VoiceFeatures = {
      pitchMean: 0,
      pitchVariance: 0,
      energyMean: 0,
      energyVariance: 0,
      spectralCentroid: 0,
      zeroCrossingRate: 0,
      mfcc: new Array(13).fill(0)
    };
    
    samples.forEach(sample => {
      avgFeatures.pitchMean += sample.pitchMean;
      avgFeatures.pitchVariance += sample.pitchVariance;
      avgFeatures.energyMean += sample.energyMean;
      avgFeatures.energyVariance += sample.energyVariance;
      avgFeatures.spectralCentroid += sample.spectralCentroid;
      avgFeatures.zeroCrossingRate += sample.zeroCrossingRate;
      sample.mfcc.forEach((val, i) => {
        avgFeatures.mfcc[i] += val;
      });
    });
    
    const n = samples.length;
    avgFeatures.pitchMean /= n;
    avgFeatures.pitchVariance /= n;
    avgFeatures.energyMean /= n;
    avgFeatures.energyVariance /= n;
    avgFeatures.spectralCentroid /= n;
    avgFeatures.zeroCrossingRate /= n;
    avgFeatures.mfcc = avgFeatures.mfcc.map(v => v / n);
    
    const profile: VoiceProfile = {
      id: `profile_${Date.now()}`,
      userId,
      name: `User ${userId}`,
      features: avgFeatures,
      samples: n,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      confidence: 0.8 // Initial confidence
    };
    
    this.profiles.set(profile.id, profile);
    this.saveProfiles();
    
    console.log('[voice-biometrics] Created profile:', profile.id);
    return profile;
  }

  /**
   * Identify speaker from audio
   */
  async identify(audioData: Float32Array): Promise<IdentificationResult> {
    if (this.profiles.size === 0) {
      return {
        identified: false,
        confidence: 0,
        alternatives: []
      };
    }
    
    const features = await this.extractFeatures(audioData);
    const scores: { profileId: string; userId: string; score: number }[] = [];
    
    this.profiles.forEach(profile => {
      const score = this.calculateSimilarity(features, profile.features);
      scores.push({
        profileId: profile.id,
        userId: profile.userId,
        score
      });
    });
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    const best = scores[0];
    const identified = best.score >= this.CONFIDENCE_THRESHOLD;
    
    const profile = this.profiles.get(best.profileId);
    
    return {
      identified,
      userId: identified ? best.userId : undefined,
      userName: identified ? profile?.name : undefined,
      confidence: best.score,
      alternatives: scores.slice(1, 4).map(s => ({
        userId: s.userId,
        confidence: s.score
      }))
    };
  }

  /**
   * Calculate similarity between two feature sets
   */
  private calculateSimilarity(a: VoiceFeatures, b: VoiceFeatures): number {
    // Weighted Euclidean distance converted to similarity
    const weights = {
      pitch: 0.2,
      energy: 0.15,
      spectral: 0.15,
      zcr: 0.1,
      mfcc: 0.4
    };
    
    let distance = 0;
    
    // Pitch distance
    distance += weights.pitch * Math.pow((a.pitchMean - b.pitchMean) / (b.pitchMean || 1), 2);
    
    // Energy distance
    distance += weights.energy * Math.pow((a.energyMean - b.energyMean) / (b.energyMean || 1), 2);
    
    // Spectral centroid distance
    distance += weights.spectral * Math.pow((a.spectralCentroid - b.spectralCentroid) / (b.spectralCentroid || 1), 2);
    
    // Zero crossing rate distance
    distance += weights.zcr * Math.pow((a.zeroCrossingRate - b.zeroCrossingRate) / (b.zeroCrossingRate || 1), 2);
    
    // MFCC distance
    let mfccDistance = 0;
    for (let i = 0; i < a.mfcc.length; i++) {
      mfccDistance += Math.pow((a.mfcc[i] - b.mfcc[i]) / (b.mfcc[i] || 1), 2);
    }
    distance += weights.mfcc * (mfccDistance / a.mfcc.length);
    
    // Convert distance to similarity (0-1)
    const similarity = 1 / (1 + Math.sqrt(distance));
    
    return similarity;
  }

  /**
   * Verify if audio matches a specific user
   */
  async verify(userId: string, audioData: Float32Array): Promise<{ verified: boolean; confidence: number }> {
    const profile = Array.from(this.profiles.values()).find(p => p.userId === userId);
    
    if (!profile) {
      return { verified: false, confidence: 0 };
    }
    
    const features = await this.extractFeatures(audioData);
    const similarity = this.calculateSimilarity(features, profile.features);
    
    return {
      verified: similarity >= this.CONFIDENCE_THRESHOLD,
      confidence: similarity
    };
  }

  /**
   * Update profile with new sample
   */
  async updateProfile(profileId: string, audioData: Float32Array): Promise<boolean> {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;
    
    const newFeatures = await this.extractFeatures(audioData);
    
    // Weighted average with existing features
    const weight = 0.1; // New sample weight
    
    profile.features.pitchMean = profile.features.pitchMean * (1 - weight) + newFeatures.pitchMean * weight;
    profile.features.energyMean = profile.features.energyMean * (1 - weight) + newFeatures.energyMean * weight;
    profile.features.spectralCentroid = profile.features.spectralCentroid * (1 - weight) + newFeatures.spectralCentroid * weight;
    profile.features.zeroCrossingRate = profile.features.zeroCrossingRate * (1 - weight) + newFeatures.zeroCrossingRate * weight;
    
    profile.features.mfcc = profile.features.mfcc.map((val, i) => 
      val * (1 - weight) + newFeatures.mfcc[i] * weight
    );
    
    profile.samples++;
    profile.updatedAt = Date.now();
    
    this.saveProfiles();
    
    console.log('[voice-biometrics] Updated profile:', profileId);
    return true;
  }

  /**
   * Delete a profile
   */
  deleteProfile(profileId: string): boolean {
    const deleted = this.profiles.delete(profileId);
    if (deleted) {
      this.saveProfiles();
      console.log('[voice-biometrics] Deleted profile:', profileId);
    }
    return deleted;
  }

  /**
   * Get all profiles
   */
  getProfiles(): VoiceProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get profile by user ID
   */
  getProfileByUserId(userId: string): VoiceProfile | undefined {
    return Array.from(this.profiles.values()).find(p => p.userId === userId);
  }

  /**
   * Get service stats
   */
  getStats(): {
    totalProfiles: number;
    enrollmentsInProgress: number;
    averageConfidence: number;
  } {
    const profiles = Array.from(this.profiles.values());
    const avgConfidence = profiles.length > 0
      ? profiles.reduce((sum, p) => sum + p.confidence, 0) / profiles.length
      : 0;
    
    return {
      totalProfiles: this.profiles.size,
      enrollmentsInProgress: this.enrollmentBuffer.size,
      averageConfidence: avgConfidence
    };
  }
}

export const voiceBiometrics = new VoiceBiometricsService();