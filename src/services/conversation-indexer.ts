"use client";

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface IndexedConversation {
  id: string;
  userId: string;
  speakerName?: string;
  speakerId: string;
  segments: ConversationSegment[];
  summary: string;
  topics: string[];
  items?: string[];
  startTime: number;
  endTime: number;
  context?: string;
}

interface ConversationSegment {
  text: string;
  language: string;
  translation?: string;
  timestamp: number;
}

/**
 * Conversation Indexer
 * Indexes and makes conversations searchable
 */
class ConversationIndexerService {
  private activeConversations = new Map<string, IndexedConversation>();

  /**
   * Start new conversation
   */
  startConversation(
    userId: string,
    speakerId: string,
    speakerName?: string,
    context?: string
  ): string {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: IndexedConversation = {
      id,
      userId,
      speakerId,
      speakerName,
      segments: [],
      summary: '',
      topics: [],
      startTime: Date.now(),
      endTime: 0,
      context,
    };

    this.activeConversations.set(id, conversation);
    
    logger.log('ConversationIndexer', `Started conversation with ${speakerName || speakerId}`);
    
    return id;
  }

  /**
   * Add segment to conversation
   */
  addSegment(
    conversationId: string,
    segment: ConversationSegment
  ): void {
    const conversation = this.activeConversations.get(conversationId);
    
    if (!conversation) {
      logger.warn('ConversationIndexer', 'Conversation not found:', conversationId);
      return;
    }

    conversation.segments.push(segment);
    
    // Extract items if mentioned
    const items = this.extractItems(segment.text);
    if (items.length > 0) {
      conversation.items = [...(conversation.items || []), ...items];
    }

    // Extract topics
    const topics = this.extractTopics(segment.text);
    topics.forEach(topic => {
      if (!conversation.topics.includes(topic)) {
        conversation.topics.push(topic);
      }
    });
  }

  /**
   * End conversation and save
   */
  async endConversation(conversationId: string): Promise<void> {
    const conversation = this.activeConversations.get(conversationId);
    
    if (!conversation) return;

    conversation.endTime = Date.now();
    conversation.summary = this.generateSummary(conversation);

    // Save to database
    await this.saveConversation(conversation);

    // Remove from active
    this.activeConversations.delete(conversationId);
    
    logger.log('ConversationIndexer', `Ended conversation with ${conversation.speakerName || conversation.speakerId}`);
  }

  /**
   * Extract items from text (shopping lists, to-dos, etc.)
   */
  private extractItems(text: string): string[] {
    const items: string[] = [];
    const lower = text.toLowerCase();

    // Look for list indicators
    if (lower.includes('bring') || lower.includes('get') || lower.includes('buy')) {
      // Extract items after these keywords
      const match = text.match(/(?:bring|get|buy)\s+(.+?)(?:\.|$)/i);
      if (match) {
        const itemText = match[1];
        // Split by commas, "and", or line breaks
        const splitItems = itemText.split(/,|\sand\s|\n/);
        items.push(...splitItems.map(i => i.trim()).filter(i => i.length > 0));
      }
    }

    return items;
  }

  /**
   * Extract topics from text
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const lower = text.toLowerCase();

    const topicKeywords = [
      'party', 'meeting', 'project', 'work', 'business',
      'family', 'health', 'travel', 'food', 'shopping',
    ];

    topicKeywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        topics.push(keyword);
      }
    });

    return topics;
  }

  /**
   * Generate conversation summary
   */
  private generateSummary(conversation: IndexedConversation): string {
    const duration = Math.round((conversation.endTime - conversation.startTime) / 60000);
    const segmentCount = conversation.segments.length;
    
    let summary = `${duration} minute conversation with ${conversation.speakerName || 'someone'}. `;
    
    if (conversation.topics.length > 0) {
      summary += `Topics: ${conversation.topics.join(', ')}. `;
    }
    
    if (conversation.items && conversation.items.length > 0) {
      summary += `Mentioned ${conversation.items.length} items. `;
    }

    return summary;
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(conversation: IndexedConversation): Promise<void> {
    try {
      await supabase.from('chat_messages').insert({
        user_id: conversation.userId,
        role: 'system',
        content: JSON.stringify({
          type: 'indexed_conversation',
          speakerName: conversation.speakerName,
          speakerId: conversation.speakerId,
          summary: conversation.summary,
          topics: conversation.topics,
          items: conversation.items,
          segments: conversation.segments,
          duration: conversation.endTime - conversation.startTime,
        }),
      });

      logger.log('ConversationIndexer', 'Saved conversation to database');
    } catch (error) {
      logger.error('ConversationIndexer', 'Failed to save conversation:', error);
    }
  }

  /**
   * Search conversations
   */
  async searchConversations(
    userId: string,
    query: string
  ): Promise<IndexedConversation[]> {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'system')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!data) return [];

      return data.map(row => {
        const content = JSON.parse(row.content);
        return {
          id: row.id,
          userId: row.user_id,
          speakerId: content.speakerId,
          speakerName: content.speakerName,
          segments: content.segments || [],
          summary: content.summary || '',
          topics: content.topics || [],
          items: content.items,
          startTime: new Date(row.created_at).getTime(),
          endTime: new Date(row.created_at).getTime() + (content.duration || 0),
        };
      });
    } catch (error) {
      logger.error('ConversationIndexer', 'Search failed:', error);
      return [];
    }
  }

  /**
   * Get conversation with specific person
   */
  async getConversationsWith(
    userId: string,
    personName: string
  ): Promise<IndexedConversation[]> {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'system')
        .ilike('content', `%"speakerName":"${personName}"%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!data) return [];

      return data.map(row => {
        const content = JSON.parse(row.content);
        return {
          id: row.id,
          userId: row.user_id,
          speakerId: content.speakerId,
          speakerName: content.speakerName,
          segments: content.segments || [],
          summary: content.summary || '',
          topics: content.topics || [],
          items: content.items,
          startTime: new Date(row.created_at).getTime(),
          endTime: new Date(row.created_at).getTime() + (content.duration || 0),
        };
      });
    } catch (error) {
      logger.error('ConversationIndexer', 'Failed to get conversations:', error);
      return [];
    }
  }

  /**
   * Get items mentioned in conversation
   */
  async getItemsFrom(
    userId: string,
    personName: string,
    topic?: string
  ): Promise<string[]> {
    const conversations = await this.getConversationsWith(userId, personName);
    
    let allItems: string[] = [];
    
    conversations.forEach(conv => {
      if (topic && !conv.topics.includes(topic.toLowerCase())) {
        return;
      }
      
      if (conv.items) {
        allItems.push(...conv.items);
      }
    });

    return allItems;
  }
}

export const conversationIndexer = new ConversationIndexerService();