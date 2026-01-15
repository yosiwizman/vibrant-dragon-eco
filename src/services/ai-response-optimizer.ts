/**
 * AI Response Optimizer
 * Optimizes AI responses for voice delivery and user preferences
 */

import { logger } from '@/utils/logger';

interface ResponseOptimization {
  originalLength: number;
  optimizedLength: number;
  readingTime: number; // seconds
  complexity: 'simple' | 'moderate' | 'complex';
}

class AIResponseOptimizerService {
  private maxVoiceLength = 150; // words
  private targetReadingSpeed = 150; // words per minute

  /**
   * Optimize response for voice delivery
   */
  optimizeForVoice(response: string): { text: string; optimization: ResponseOptimization } {
    const originalLength = this.countWords(response);
    
    // Remove markdown formatting
    let optimized = this.removeMarkdown(response);
    
    // Remove code blocks
    optimized = this.removeCodeBlocks(optimized);
    
    // Simplify lists
    optimized = this.simplifyLists(optimized);
    
    // Truncate if too long
    if (this.countWords(optimized) > this.maxVoiceLength) {
      optimized = this.truncateWithSummary(optimized);
    }
    
    // Add natural pauses
    optimized = this.addNaturalPauses(optimized);
    
    // Clean up
    optimized = this.cleanupText(optimized);
    
    const optimizedLength = this.countWords(optimized);
    const readingTime = (optimizedLength / this.targetReadingSpeed) * 60;
    
    return {
      text: optimized,
      optimization: {
        originalLength,
        optimizedLength,
        readingTime,
        complexity: this.assessComplexity(optimized),
      },
    };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Remove markdown formatting
   */
  private removeMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      .replace(/\*(.+?)\*/g, '$1') // Italic
      .replace(/__(.+?)__/g, '$1') // Bold
      .replace(/_(.+?)_/g, '$1') // Italic
      .replace(/~~(.+?)~~/g, '$1') // Strikethrough
      .replace(/`(.+?)`/g, '$1') // Inline code
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
      .replace(/!\[.+?\]\(.+?\)/g, '') // Images
      .replace(/>\s+/g, ''); // Blockquotes
  }

  /**
   * Remove code blocks
   */
  private removeCodeBlocks(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, 'I have some code for that.')
      .replace(/`[^`]+`/g, '');
  }

  /**
   * Simplify lists for voice
   */
  private simplifyLists(text: string): string {
    // Convert bullet points to natural speech
    const lines = text.split('\n');
    const simplified: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    for (const line of lines) {
      const isBullet = /^[\s]*[-*•]\s+/.test(line);
      const isNumbered = /^[\s]*\d+\.\s+/.test(line);

      if (isBullet || isNumbered) {
        inList = true;
        const item = line.replace(/^[\s]*[-*•\d.]+\s+/, '').trim();
        listItems.push(item);
      } else {
        if (inList && listItems.length > 0) {
          // Convert list to natural speech
          if (listItems.length === 1) {
            simplified.push(listItems[0]);
          } else if (listItems.length === 2) {
            simplified.push(`${listItems[0]} and ${listItems[1]}`);
          } else {
            const last = listItems.pop();
            simplified.push(`${listItems.join(', ')}, and ${last}`);
          }
          listItems = [];
          inList = false;
        }
        if (line.trim()) {
          simplified.push(line);
        }
      }
    }

    // Handle remaining list items
    if (listItems.length > 0) {
      if (listItems.length === 1) {
        simplified.push(listItems[0]);
      } else if (listItems.length === 2) {
        simplified.push(`${listItems[0]} and ${listItems[1]}`);
      } else {
        const last = listItems.pop();
        simplified.push(`${listItems.join(', ')}, and ${last}`);
      }
    }

    return simplified.join(' ');
  }

  /**
   * Truncate with summary
   */
  private truncateWithSummary(text: string): string {
    const words = text.split(/\s+/);
    const truncated = words.slice(0, this.maxVoiceLength - 10).join(' ');
    
    // Find a good breaking point
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclaim = truncated.lastIndexOf('!');
    
    const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclaim);
    
    if (breakPoint > truncated.length * 0.5) {
      return truncated.substring(0, breakPoint + 1) + ' There\'s more if you\'d like to hear it.';
    }
    
    return truncated + '... Would you like me to continue?';
  }

  /**
   * Add natural pauses
   */
  private addNaturalPauses(text: string): string {
    return text
      .replace(/\.\s+/g, '. ') // Pause after periods
      .replace(/,\s+/g, ', ') // Brief pause after commas
      .replace(/:\s+/g, ': ') // Pause after colons
      .replace(/;\s+/g, '; '); // Pause after semicolons
  }

  /**
   * Clean up text
   */
  private cleanupText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces
      .replace(/\n+/g, ' ') // Newlines
      .replace(/\s+([.,!?;:])/g, '$1') // Space before punctuation
      .trim();
  }

  /**
   * Assess complexity
   */
  private assessComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const sentenceCount = (text.match(/[.!?]+/g) || []).length;
    const avgSentenceLength = words.length / Math.max(sentenceCount, 1);

    if (avgWordLength < 5 && avgSentenceLength < 15) {
      return 'simple';
    }
    
    if (avgWordLength > 7 || avgSentenceLength > 25) {
      return 'complex';
    }
    
    return 'moderate';
  }

  /**
   * Generate voice-friendly summary
   */
  generateSummary(text: string, maxSentences: number = 2): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length <= maxSentences) {
      return text;
    }

    // Take first and last sentence for context
    const summary = [
      sentences[0].trim(),
      sentences[sentences.length - 1].trim(),
    ].join(' ');

    return summary;
  }

  /**
   * Convert numbers to spoken form
   */
  convertNumbersToWords(text: string): string {
    const numberWords: Record<number, string> = {
      0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
      5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
      10: 'ten', 11: 'eleven', 12: 'twelve',
    };

    return text.replace(/\b(\d+)\b/g, (match, num) => {
      const n = parseInt(num);
      if (n in numberWords) {
        return numberWords[n];
      }
      return match;
    });
  }

  /**
   * Add emphasis markers for TTS
   */
  addEmphasis(text: string, emphasisWords: string[]): string {
    let result = text;
    
    for (const word of emphasisWords) {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      result = result.replace(regex, '<emphasis>$1</emphasis>');
    }
    
    return result;
  }
}

export const aiResponseOptimizer = new AIResponseOptimizerService();