import { supabase } from "@/integrations/supabase/client";

export interface RAGDocument {
  id: string;
  userId: string;
  title: string;
  content: string;
  sourceType: "manual" | "pdf" | "url" | "file";
  sourceUrl?: string;
  filePath?: string;
  chunks: DocumentChunk[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  chunk: DocumentChunk;
  document: RAGDocument;
  relevanceScore: number;
}

// RAG Architecture Knowledge from the PDF
const RAG_ARCHITECTURES_KNOWLEDGE = `
# 9 RAG Architectures Every AI Developer Must Know

## 1. Simple RAG (Naive RAG)
The foundational architecture that retrieves relevant documents and passes them to an LLM.
- Components: Document Store, Retriever, LLM
- Flow: Query → Retrieve → Generate
- Best for: Simple Q&A, basic document search
- Limitations: No query refinement, single retrieval step

## 2. Simple RAG with Memory
Extends Simple RAG by maintaining conversation history.
- Adds: Conversation Memory, Context Window Management
- Benefits: Multi-turn conversations, context awareness
- Use cases: Chatbots, customer support

## 3. Branched RAG Pipeline
Uses multiple specialized retrievers for different document types.
- Components: Query Router, Multiple Retrievers, Result Merger
- Benefits: Optimized retrieval per document type
- Use cases: Multi-source knowledge bases, heterogeneous data

## 4. Adaptive RAG
Dynamically adjusts retrieval strategy based on query complexity.
- Features: Query Classifier, Strategy Selector, Fallback Mechanisms
- Benefits: Efficient resource usage, better accuracy
- Use cases: Variable complexity queries, production systems

## 5. Corrective RAG (CRAG)
Implements self-correction mechanisms for retrieved content.
- Components: Relevance Evaluator, Correction Module, Web Search Fallback
- Flow: Retrieve → Evaluate → Correct/Fallback → Generate
- Benefits: Higher accuracy, handles retrieval failures
- Use cases: High-stakes applications, factual accuracy critical

## 6. Self-RAG
The LLM critiques and refines its own outputs.
- Features: Self-Reflection, Output Scoring, Iterative Refinement
- Benefits: Improved response quality, reduced hallucinations
- Use cases: Research, complex reasoning tasks

## 7. Agentic RAG
Combines RAG with autonomous agents for complex tasks.
- Components: Planning Agent, Tool Use, Multi-step Reasoning
- Benefits: Complex task handling, dynamic tool selection
- Use cases: Research assistants, complex workflows

## 8. Graph RAG
Uses knowledge graphs for structured relationship retrieval.
- Components: Knowledge Graph, Graph Traversal, Entity Linking
- Benefits: Relationship-aware retrieval, structured knowledge
- Use cases: Entity-rich domains, relationship queries

## 9. Modular RAG
Highly customizable architecture with interchangeable components.
- Features: Plugin Architecture, Component Registry, Dynamic Assembly
- Benefits: Maximum flexibility, easy experimentation
- Use cases: Research, custom enterprise solutions

## Key Concepts

### Chunking Strategies
- Fixed-size chunks: Simple, consistent
- Semantic chunking: Meaning-preserving
- Recursive chunking: Hierarchical structure
- Sentence-based: Natural boundaries

### Embedding Models
- OpenAI text-embedding-ada-002
- Sentence Transformers
- Cohere Embed
- Custom fine-tuned models

### Vector Databases
- Pinecone: Managed, scalable
- Weaviate: Open-source, GraphQL
- Chroma: Lightweight, local
- Qdrant: High-performance
- Milvus: Enterprise-grade

### Retrieval Strategies
- Dense retrieval: Semantic similarity
- Sparse retrieval: Keyword matching (BM25)
- Hybrid: Combines both approaches
- Re-ranking: Two-stage retrieval

### Evaluation Metrics
- Retrieval: Precision, Recall, MRR, NDCG
- Generation: BLEU, ROUGE, BERTScore
- End-to-end: Answer accuracy, faithfulness

## Best Practices
1. Start simple, add complexity as needed
2. Evaluate retrieval quality separately from generation
3. Use hybrid retrieval for production systems
4. Implement caching for common queries
5. Monitor and log retrieval performance
6. Consider query expansion for better recall
7. Use metadata filtering when applicable
8. Implement fallback mechanisms
`;

/**
 * Initialize RAG knowledge base with built-in knowledge
 */
export async function initializeRAGKnowledge(userId: string): Promise<void> {
  try {
    // Check if RAG architectures knowledge already exists
    const { data: existing } = await supabase
      .from("rag_documents")
      .select("id")
      .eq("user_id", userId)
      .eq("title", "RAG Architectures Guide")
      .single();

    if (!existing) {
      // Add the RAG architectures knowledge
      await addDocument(userId, {
        title: "RAG Architectures Guide",
        content: RAG_ARCHITECTURES_KNOWLEDGE,
        sourceType: "manual",
        metadata: {
          category: "AI/ML",
          tags: ["RAG", "AI", "architecture", "retrieval", "LLM"],
        },
      });
    }
  } catch (error) {
    console.error("Failed to initialize RAG knowledge:", error);
  }
}

/**
 * Add a document to the knowledge base
 */
export async function addDocument(
  userId: string,
  doc: {
    title: string;
    content: string;
    sourceType: "manual" | "pdf" | "url" | "file";
    sourceUrl?: string;
    filePath?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; document?: RAGDocument; error?: string }> {
  try {
    // Chunk the document
    const chunks = chunkDocument(doc.content);

    const { data, error } = await supabase
      .from("rag_documents")
      .insert({
        user_id: userId,
        title: doc.title,
        content: doc.content,
        source_type: doc.sourceType,
        source_url: doc.sourceUrl,
        file_path: doc.filePath,
        chunks: chunks,
        metadata: doc.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      document: {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        content: data.content,
        sourceType: data.source_type,
        sourceUrl: data.source_url,
        filePath: data.file_path,
        chunks: data.chunks,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Search the knowledge base
 */
export async function searchKnowledge(
  userId: string,
  query: string,
  options: {
    limit?: number;
    category?: string;
    tags?: string[];
  } = {}
): Promise<SearchResult[]> {
  const { limit = 5, category, tags } = options;
  const results: SearchResult[] = [];

  try {
    let dbQuery = supabase
      .from("rag_documents")
      .select("*")
      .eq("user_id", userId);

    if (category) {
      dbQuery = dbQuery.contains("metadata", { category });
    }

    const { data: documents } = await dbQuery;

    if (!documents) return results;

    // Simple keyword-based search (in production, use vector similarity)
    const queryTerms = query.toLowerCase().split(/\s+/);

    for (const doc of documents) {
      const chunks: DocumentChunk[] = doc.chunks || [];

      for (const chunk of chunks) {
        const chunkLower = chunk.content.toLowerCase();
        let score = 0;

        // Calculate relevance score based on term matches
        for (const term of queryTerms) {
          if (chunkLower.includes(term)) {
            score += 1;
            // Bonus for exact phrase match
            if (chunkLower.includes(query.toLowerCase())) {
              score += 2;
            }
          }
        }

        if (score > 0) {
          results.push({
            chunk,
            document: {
              id: doc.id,
              userId: doc.user_id,
              title: doc.title,
              content: doc.content,
              sourceType: doc.source_type,
              sourceUrl: doc.source_url,
              filePath: doc.file_path,
              chunks: doc.chunks,
              metadata: doc.metadata,
              createdAt: new Date(doc.created_at),
            },
            relevanceScore: score / queryTerms.length,
          });
        }
      }
    }

    // Sort by relevance and limit
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results.slice(0, limit);
  } catch (error) {
    console.error("Knowledge search failed:", error);
    return [];
  }
}

/**
 * Get knowledge context for AI prompts
 */
export async function getKnowledgeContext(
  userId: string,
  query: string,
  maxTokens: number = 2000
): Promise<string> {
  const results = await searchKnowledge(userId, query, { limit: 3 });

  if (results.length === 0) {
    return "";
  }

  let context = "Relevant knowledge from your documents:\n\n";
  let tokenEstimate = 0;

  for (const result of results) {
    const chunkText = `From "${result.document.title}":\n${result.chunk.content}\n\n`;
    const chunkTokens = chunkText.length / 4; // Rough estimate

    if (tokenEstimate + chunkTokens > maxTokens) break;

    context += chunkText;
    tokenEstimate += chunkTokens;
  }

  return context;
}

/**
 * Chunk a document into smaller pieces
 */
function chunkDocument(content: string, chunkSize: number = 500, overlap: number = 50): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const paragraphs = content.split(/\n\n+/);

  let currentChunk = "";
  let startIndex = 0;
  let chunkId = 0;

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        id: `chunk-${chunkId++}`,
        content: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
      });

      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      startIndex = startIndex + currentChunk.length - overlap;
      currentChunk = overlapText;
    }

    currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: `chunk-${chunkId}`,
      content: currentChunk.trim(),
      startIndex,
      endIndex: startIndex + currentChunk.length,
    });
  }

  return chunks;
}

/**
 * Delete a document from the knowledge base
 */
export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("rag_documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * List all documents in the knowledge base
 */
export async function listDocuments(userId: string): Promise<RAGDocument[]> {
  try {
    const { data, error } = await supabase
      .from("rag_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(doc => ({
      id: doc.id,
      userId: doc.user_id,
      title: doc.title,
      content: doc.content,
      sourceType: doc.source_type,
      sourceUrl: doc.source_url,
      filePath: doc.file_path,
      chunks: doc.chunks || [],
      metadata: doc.metadata || {},
      createdAt: new Date(doc.created_at),
    }));
  } catch (error) {
    console.error("Failed to list documents:", error);
    return [];
  }
}