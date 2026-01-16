"use client";

import { logger } from "@/utils/logger";

interface Speaker {
  id: string;
  name?: string;
  voiceCharacteristics: VoiceCharacteristics;
  language?: string;
  firstSeen: number;
  lastSeen: number;
  conversationCount: number;
  totalSpeakingTime: number;
}

interface VoiceCharacteristics {
  pitchRange: [number, number];
  averagePitch: number;
  speakingRate: number;
  volumeLevel: number;
}

interface SpeakerMatch {
  speaker: Speaker;
  confidence: number;
  isNewSpeaker: boolean;
}

/**
 * Speaker Identification Service
 * Identifies and tracks different speakers in conversations
 */
class SpeakerIdentificationService {
  private speakers = new Map<string, Speaker>();
  private currentSpeaker: Speaker | null = null;
  private speakerTimeout = 5000; // 5 seconds of silence = new speaker segment

  /**
   * Identify speaker from audio characteristics
   */
  identifySpeaker(characteristics: Partial<VoiceCharacteristics>): SpeakerMatch {
    const now = Date.now();

    // Check if current speaker is still speaking (within timeout)
    if (this.currentSpeaker && now - this.currentSpeaker.lastSeen < this.speakerTimeout) {
      this.currentSpeaker.lastSeen = now;
      return {
        speaker: this.currentSpeaker,
        confidence: 0.9,
        isNewSpeaker: false,
      };
    }

    // Try to match with known speakers
    const match = this.findMatchingSpeaker(characteristics);
    
    if (match) {
      match.speaker.lastSeen = now;
      match.speaker.conversationCount++;
      this.currentSpeaker = match.speaker;
      return match;
    }

    // Create new speaker
    const newSpeaker = this.createSpeaker(characteristics);
    this.currentSpeaker = newSpeaker;
    
    return {
      speaker: newSpeaker,
      confidence: 1,
      isNewSpeaker: true,
    };
  }

  /**
   * Find matching speaker based on voice characteristics
   */
  private findMatchingSpeaker(characteristics: Partial<VoiceCharacteristics>): SpeakerMatch | null {
    let bestMatch: Speaker | null = null;
    let bestConfidence = 0;

    for (const speaker of this.speakers.values()) {
      const confidence = this.calculateSimilarity(speaker.voiceCharacteristics, characteristics);
      
      if (confidence > 0.7 && confidence > bestConfidence) {
        bestMatch = speaker;
        bestConfidence = confidence;
      }
    }

    if (bestMatch) {
      return {
        speaker: bestMatch,
        confidence: bestConfidence,
        isNewSpeaker: false,
      };
    }

    return null;
  }

  /**
   * Calculate similarity between voice characteristics
   */
  private calculateSimilarity(
    known: VoiceCharacteristics,
    unknown: Partial<VoiceCharacteristics>
  ): number {
    let totalScore = 0;
    let factors = 0;

    // Compare pitch
    if (unknown.averagePitch !== undefined) {
      const pitchDiff = Math.abs(known.averagePitch - unknown.averagePitch);
      const pitchScore = Math.max(0, 1 - pitchDiff / 100);
      totalScore += pitchScore;
      factors++;
    }

    // Compare speaking rate
    if (unknown.speakingRate !== undefined) {
      const rateDiff = Math.abs(known.speakingRate - unknown.speakingRate);
      const rateScore = Math.max(0, 1 - rateDiff / 50);
      totalScore += rateScore;
      factors++;
    }

    // Compare volume
    if (unknown.volumeLevel !== undefined) {
      const volumeDiff = Math.abs(known.volumeLevel - unknown.volumeLevel);
      const volumeScore = Math.max(0, 1 - volumeDiff / 30);
      totalScore += volumeScore;
      factors++;
    }

    return factors > 0 ? totalScore / factors : 0;
  }

  /**
   * Create new speaker profile
   */
  private createSpeaker(characteristics: Partial<VoiceCharacteristics>): Speaker {
    const id = `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = Date.now();

    const speaker: Speaker = {
      id,
      voiceCharacteristics: {
        pitchRange: [characteristics.averagePitch || 150, characteristics.averagePitch || 150],
        averagePitch: characteristics.averagePitch || 150,
        speakingRate: characteristics.speakingRate || 150,
        volumeLevel: characteristics.volumeLevel || 50,
      },
      firstSeen: now,
      lastSeen: now,
      conversationCount: 1,
      totalSpeakingTime: 0,
    };

    this.speakers.set(id, speaker);
    logger.log('SpeakerID', `New speaker detected: ${id}`);

    return speaker;
  }

  /**
   * Name a speaker
   */
  nameSpeaker(speakerId: string, name: string): boolean {
    const speaker = this.speakers.get(speakerId);
    if (speaker) {
      speaker.name = name;
      logger.log('SpeakerID', `Named speaker ${speakerId} as "${name}"`);
      return true;
    }
    return false;
  }

  /**
   * Get speaker by name
   */
  getSpeakerByName(name: string): Speaker | undefined {
    for (const speaker of this.speakers.values()) {
      if (speaker.name?.toLowerCase() === name.toLowerCase()) {
        return speaker;
      }
    }
    return undefined;
  }

  /**
   * Get all speakers
   */
  getAllSpeakers(): Speaker[] {
    return Array.from(this.speakers.values());
  }

  /**
   * Get recent speakers (active in last hour)
   */
  getRecentSpeakers(): Speaker[] {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return this.getAllSpeakers().filter(s => s.lastSeen > oneHourAgo);
  }

  /**
   * Update speaker's speaking time
   */
  updateSpeakingTime(speakerId: string, duration: number): void {
    const speaker = this.speakers.get(speakerId);
    if (speaker) {
      speaker.totalSpeakingTime += duration;
    }
  }

  /**
   * Set speaker's language
   */
  setSpeakerLanguage(speakerId: string, language: string): void {
    const speaker = this.speakers.get(speakerId);
    if (speaker) {
      speaker.language = language;
    }
  }

  /**
   * Get current speaker
   */
  getCurrentSpeaker(): Speaker | null {
    return this.currentSpeaker;
  }

  /**
   * Clear all speakers
   */
  clearSpeakers(): void {
    this.speakers.clear();
    this.currentSpeaker = null;
    logger.log('SpeakerID', 'All speakers cleared');
  }

  /**
   * Get speaker statistics
   */
  getStatistics(): {
    totalSpeakers: number;
    namedSpeakers: number;
    recentSpeakers: number;
    totalConversations: number;
  } {
    const speakers = this.getAllSpeakers();
    const recent = this.getRecentSpeakers();

    return {
      totalSpeakers: speakers.length,
      namedSpeakers: speakers.filter(s => s.name).length,
      recentSpeakers: recent.length,
      totalConversations: speakers.reduce((sum, s) => sum + s.conversationCount, 0),
    };
  }
}

export const speakerIdentification = new SpeakerIdentificationService();