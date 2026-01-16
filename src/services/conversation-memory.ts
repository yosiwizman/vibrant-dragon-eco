"use client";

import { logger } from "@/utils/logger";

interface ConversationTurn {
  user: string;
  assistant: string;
  timestamp: number;
  tools?: string[];
}

interface ConversationSummary {
  summary: string;
  keyPoints: string[];
  topics: string[];
  lastUpdated: number;
}

/**
 * Conversation Memory Service
 * Maintains context across long conversations with automatic summarization
 */
class ConversationMemoryService {
  private turns: ConversationTurn[] = [];
  private summary: ConversationSummary | null = null;
  private maxTurns = 20;
  private summarizeInterval = 5; // Summarize every 5 turns

  /**
   * Add a conversation turn
   */
  async addTurn(user: string, assistant: string, tools: string[] = []): Promise<void> {
    const turn: ConversationTurn = {
      user,
      assistant,
      timestamp: Date.now(),
      tools,
    };

    this.turns.push(turn);

    // Keep only recent turns
    if (this.turns.length > this.maxTurns) {
      this.turns = this.turns.slice(-this.maxTurns);
    }

    // Summarize periodically
    if (this.turns.length % this.summarizeInterval === 0) {
      await this.updateSummary();
    }

    logger.log('ConversationMemory', `Added turn (${this.turns.length} total)`);
  }

  /**
   * Update conversation summary
   */
  private async updateSummary(): Promise<void> {
    try {
      const recentTurns = this.turns.slice(-10);
      
      // Extract key points
      const keyPoints = this.extractKeyPoints(recentTurns);
      
      // Extract topics
      const topics = this.extractTopics(recentTurns);
      
      // Generate summary
      const summary = this.generateSummary(recentTurns);

      this.summary = {
        summary,
        keyPoints,
        topics,
        lastUpdated: Date.now(),
      };

      logger.log('ConversationMemory', 'Summary updated', {
        keyPoints: keyPoints.length,
        topics: topics.length,
      });
    } catch (error) {
      logger.error('ConversationMemory', 'Failed to update summary:', error);
    }
  }

  /**
   * Extract key points from conversation
   */
  private extractKeyPoints(turns: ConversationTurn[]): string[] {
    const points: string[] = [];

    turns.forEach(turn => {
      // Extract action items
      if (turn.tools && turn.tools.length > 0) {
        turn.tools.forEach(tool => {
          if (tool.startsWith('create_')) {
            points.push(`Created ${tool.replace('create_', '')}`);
          }
        });
      }

      // Extract important statements
      const userLower = turn.user.toLowerCase();
      if (userLower.includes('remember') || userLower.includes('important')) {
        points.push(turn.user);
      }
    });

    return points.slice(-10); // Keep last 10 points
  }

  /**
   * Extract topics from conversation
   */
  private extractTopics(turns: ConversationTurn[]): string[] {
    const topicKeywords = new Set<string>();

    turns.forEach(turn => {
      const words = turn.user.toLowerCase().split(/\s+/);
      
      // Common topic indicators
      const topics = ['task', 'reminder', 'note', 'event', 'meeting', 'appointment', 'weather', 'calendar'];
      
      words.forEach(word => {
        if (topics.includes(word)) {
          topicKeywords.add(word);
        }
      });
    });

    return Array.from(topicKeywords);
  }

  /**
   * Generate conversation summary
   */
  private generateSummary(turns: ConversationTurn[]): string {
    if (turns.length === 0) return '';

    const actions = turns.filter(t => t.tools && t.tools.length > 0).length;
    const topics = this.extractTopics(turns);

    return `Discussed ${topics.join(', ')}. Performed ${actions} actions.`;
  }

  /**
   * Get context for AI prompt
   */
  getContext(): string {
    if (!this.summary && this.turns.length === 0) {
      return '';
    }

    let context = '';

    // Add summary if available
    if (this.summary) {
      context += `Conversation summary: ${this.summary.summary}\n`;
      
      if (this.summary.keyPoints.length > 0) {
        context += `Key points: ${this.summary.keyPoints.slice(-5).join('; ')}\n`;
      }
      
      if (this.summary.topics.length > 0) {
        context += `Topics discussed: ${this.summary.topics.join(', ')}\n`;
      }
    }

    // Add recent turns
    const recentTurns = this.turns.slice(-3);
    if (recentTurns.length > 0) {
      context += `\nRecent conversation:\n`;
      recentTurns.forEach((turn, i) => {
        context += `User: ${turn.user}\n`;
        context += `Assistant: ${turn.assistant}\n`;
      });
    }

    return context;
  }

  /**
   * Get recent turns
   */
  getRecentTurns(count: number = 3): ConversationTurn[] {
    return this.turns.slice(-count);
  }

  /**
   * Clear conversation memory
   */
  clear(): void {
    this.turns = [];
    this.summary = null;
    logger.log('ConversationMemory', 'Memory cleared');
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalTurns: number;
    toolsUsed: number;
    topics: string[];
    duration: number;
  } {
    const toolsUsed = this.turns.filter(t => t.tools && t.tools.length > 0).length;
    const duration = this.turns.length > 0 
      ? Date.now() - this.turns[0].timestamp 
      : 0;

    return {
      totalTurns: this.turns.length,
      toolsUsed,
      topics: this.summary?.topics || [],
      duration,
    };
  }
}

export const conversationMemory = new ConversationMemoryService();