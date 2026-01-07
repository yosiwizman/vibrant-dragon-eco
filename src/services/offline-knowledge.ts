"use client";

import { offlineManager } from "./offline-manager";

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  embedding?: number[];
  timestamp: number;
}

class OfflineKnowledge {
  private documents: Map<string, KnowledgeDocument> = new Map();
  private initialized = false;

  /**
   * Initialize offline knowledge base
   */
  async initialize(userId: string) {
    if (this.initialized) return;

    try {
      // Load cached knowledge documents
      const cached = await offlineManager.getCachedData(`knowledge-${userId}`);
      
      if (cached && Array.isArray(cached)) {
        cached.forEach((doc: KnowledgeDocument) => {
          this.documents.set(doc.id, doc);
        });
        console.log(`[Offline Knowledge] Loaded ${cached.length} documents`);
      }

      this.initialized = true;
    } catch (error) {
      console.error('[Offline Knowledge] Initialization failed:', error);
    }
  }

  /**
   * Cache knowledge documents for offline use
   */
  async cacheDocuments(userId: string, documents: any[]) {
    try {
      const knowledgeDocs: KnowledgeDocument[] = documents.map(doc => ({
        id: doc.id,
        title: doc.title || '',
        content: doc.content || '',
        category: doc.category || 'general',
        timestamp: Date.now(),
      }));

      await offlineManager.cacheData(`knowledge-${userId}`, knowledgeDocs);

      // Update in-memory cache
      knowledgeDocs.forEach(doc => {
        this.documents.set(doc.id, doc);
      });

      console.log(`[Offline Knowledge] Cached ${knowledgeDocs.length} documents`);
    } catch (error) {
      console.error('[Offline Knowledge] Caching failed:', error);
    }
  }

  /**
   * Search knowledge base offline (simple text search)
   */
  searchOffline(query: string, limit: number = 5): KnowledgeDocument[] {
    const queryLower = query.toLowerCase();
    const results: Array<{ doc: KnowledgeDocument; score: number }> = [];

    this.documents.forEach(doc => {
      let score = 0;

      // Title match (higher weight)
      if (doc.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Content match
      if (doc.content.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // Category match
      if (doc.category.toLowerCase().includes(queryLower)) {
        score += 3;
      }

      if (score > 0) {
        results.push({ doc, score });
      }
    });

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.doc);
  }

  /**
   * Get all documents
   */
  getAllDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): KnowledgeDocument | null {
    return this.documents.get(id) || null;
  }

  /**
   * Get documents by category
   */
  getByCategory(category: string): KnowledgeDocument[] {
    return Array.from(this.documents.values()).filter(
      doc => doc.category === category
    );
  }

  /**
   * Get knowledge context for AI (offline)
   */
  getContext(query: string): string {
    const relevant = this.searchOffline(query, 3);
    
    if (relevant.length === 0) {
      return '';
    }

    return `Relevant knowledge:\n${relevant.map(doc => 
      `- ${doc.title}: ${doc.content.substring(0, 200)}`
    ).join('\n')}`;
  }
}

export const offlineKnowledge = new OfflineKnowledge();