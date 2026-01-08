"use client";

import { logger } from "@/utils/logger";
import { searchWeb } from "./search";

interface FactCheck {
  claim: string;
  verdict: 'reasonable' | 'unreasonable' | 'unclear';
  confidence: number;
  evidence: string[];
  suggestion?: string;
}

/**
 * Real-Time Fact Checker
 * Analyzes conversations and provides instant fact-checking
 */
class RealTimeFactCheckerService {
  private isActive = false;
  private checkQueue: string[] = [];
  private processing = false;

  /**
   * Start fact checking
   */
  start(): void {
    this.isActive = true;
    logger.log('FactChecker', 'Started');
  }

  /**
   * Stop fact checking
   */
  stop(): void {
    this.isActive = false;
    this.checkQueue = [];
    logger.log('FactChecker', 'Stopped');
  }

  /**
   * Analyze statement for fact-checking
   */
  async analyze(statement: string): Promise<FactCheck | null> {
    if (!this.isActive) return null;

    // Detect if statement needs fact-checking
    if (!this.needsFactCheck(statement)) {
      return null;
    }

    // Extract claim
    const claim = this.extractClaim(statement);
    if (!claim) return null;

    // Check facts
    return await this.checkFact(claim);
  }

  /**
   * Check if statement needs fact-checking
   */
  private needsFactCheck(statement: string): boolean {
    const lower = statement.toLowerCase();

    // Price claims
    if (/\$\d+/.test(statement)) return true;
    
    // Quantity claims
    if (/\d+\s*(percent|%|times|years|months)/.test(lower)) return true;

    // Factual claims
    const factualKeywords = [
      'cost', 'price', 'worth', 'value',
      'average', 'typical', 'normal',
      'market', 'industry', 'standard',
    ];

    return factualKeywords.some(keyword => lower.includes(keyword));
  }

  /**
   * Extract claim from statement
   */
  private extractClaim(statement: string): string | null {
    // Extract price claims
    const priceMatch = statement.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch) {
      return `Price: ${priceMatch[0]}`;
    }

    // Extract percentage claims
    const percentMatch = statement.match(/(\d+)\s*(?:percent|%)/);
    if (percentMatch) {
      return `Percentage: ${percentMatch[0]}`;
    }

    return statement;
  }

  /**
   * Check fact against web sources
   */
  private async checkFact(claim: string): Promise<FactCheck> {
    try {
      // Search for verification
      const query = `${claim} market price average`;
      const results = await searchWeb(query);

      // Analyze results (simplified)
      const evidence = results.slice(0, 3).map(r => r.snippet || '');

      // Simple verdict logic (can be enhanced with AI)
      const verdict = this.determineVerdict(claim, evidence);

      return {
        claim,
        verdict,
        confidence: 0.7,
        evidence,
        suggestion: this.generateSuggestion(verdict, claim),
      };
    } catch (error) {
      logger.error('FactChecker', 'Fact check failed:', error);
      return {
        claim,
        verdict: 'unclear',
        confidence: 0,
        evidence: [],
      };
    }
  }

  /**
   * Determine verdict
   */
  private determineVerdict(claim: string, evidence: string[]): 'reasonable' | 'unreasonable' | 'unclear' {
    // Extract price from claim
    const priceMatch = claim.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (!priceMatch) return 'unclear';

    const claimedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));

    // Extract prices from evidence
    const evidencePrices: number[] = [];
    evidence.forEach(text => {
      const matches = text.matchAll(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
      for (const match of matches) {
        evidencePrices.push(parseFloat(match[1].replace(/,/g, '')));
      }
    });

    if (evidencePrices.length === 0) return 'unclear';

    // Calculate average market price
    const avgPrice = evidencePrices.reduce((a, b) => a + b, 0) / evidencePrices.length;

    // Determine if reasonable (within 20% of average)
    const difference = Math.abs(claimedPrice - avgPrice) / avgPrice;

    if (difference < 0.2) return 'reasonable';
    if (difference > 0.5) return 'unreasonable';
    return 'unclear';
  }

  /**
   * Generate suggestion
   */
  private generateSuggestion(verdict: string, claim: string): string | undefined {
    if (verdict === 'unreasonable') {
      return "This price seems high compared to market rates. Consider negotiating.";
    }
    if (verdict === 'reasonable') {
      return "This price is in line with market rates.";
    }
    return undefined;
  }

  /**
   * Queue fact check
   */
  queueCheck(statement: string): void {
    if (this.isActive) {
      this.checkQueue.push(statement);
      this.processQueue();
    }
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.checkQueue.length === 0) return;

    this.processing = true;

    while (this.checkQueue.length > 0) {
      const statement = this.checkQueue.shift()!;
      const result = await this.analyze(statement);
      
      if (result && result.suggestion) {
        // Whisper suggestion to user
        await this.whisper(result.suggestion);
      }
    }

    this.processing = false;
  }

  /**
   * Whisper to user (quiet notification)
   */
  private async whisper(text: string): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 0.3; // Very quiet
    utterance.rate = 1.3;   // Faster
    window.speechSynthesis.speak(utterance);
  }
}

export const factChecker = new RealTimeFactCheckerService();