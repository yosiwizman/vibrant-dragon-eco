"use client";

import { logger } from "@/utils/logger";

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: number;
}

interface LanguageDetection {
  language: string;
  confidence: number;
  script?: string;
}

/**
 * Real-Time Translation Service
 * Detects languages and provides instant translations
 */
class TranslationService {
  private cache = new Map<string, TranslationResult>();
  private supportedLanguages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  ];

  /**
   * Detect language from text
   */
  detectLanguage(text: string): LanguageDetection {
    // Character-based detection patterns
    const patterns: { pattern: RegExp; language: string; script: string }[] = [
      { pattern: /[\u4e00-\u9fa5]/, language: 'zh', script: 'Han' },
      { pattern: /[\u3040-\u309f\u30a0-\u30ff]/, language: 'ja', script: 'Japanese' },
      { pattern: /[\uac00-\ud7af]/, language: 'ko', script: 'Hangul' },
      { pattern: /[\u0600-\u06ff]/, language: 'ar', script: 'Arabic' },
      { pattern: /[\u0400-\u04ff]/, language: 'ru', script: 'Cyrillic' },
      { pattern: /[\u0900-\u097f]/, language: 'hi', script: 'Devanagari' },
    ];

    for (const { pattern, language, script } of patterns) {
      if (pattern.test(text)) {
        return { language, confidence: 0.95, script };
      }
    }

    // Word-based detection for Latin scripts
    const spanishWords = /\b(el|la|los|las|de|que|en|es|un|una|por|con|para|como|más|pero|sus|le|ya|o|este|sí|porque|esta|entre|cuando|muy|sin|sobre|también|me|hasta|hay|donde|quien|desde|todo|nos|durante|todos|uno|les|ni|contra|otros|ese|eso|ante|ellos|e|esto|mí|antes|algunos|qué|unos|yo|otro|otras|otra|él|tanto|esa|estos|mucho|quienes|nada|muchos|cual|poco|ella|estar|estas|algunas|algo|nosotros)\b/gi;
    const frenchWords = /\b(le|la|les|de|du|des|un|une|et|est|en|que|qui|dans|ce|il|ne|sur|se|pas|plus|par|je|avec|tout|faire|son|mais|nous|comme|ou|si|leur|y|bien|où|elle|été|avoir|aux|cela|entre|sans|sous|être|fait|peut|tous|après|donc|même|nos|aussi|peu|ces|lui|dont|ici|car|mes|tes|ses|nos|vos|leurs)\b/gi;
    const germanWords = /\b(der|die|das|und|in|zu|den|ist|von|nicht|mit|ein|eine|auf|für|sich|dem|es|als|auch|an|er|so|aus|bei|war|noch|wie|nach|am|nur|oder|aber|vor|zur|bis|mehr|durch|über|sehr|kann|schon|wenn|sein|unter|wir|diese|ihr|dann|sie|sind|wird|haben|hat|worden|dessen|denen|deren|welche|solche|jede|jeder|jedes|alle|allem|allen|aller|alles)\b/gi;

    const spanishMatches = (text.match(spanishWords) || []).length;
    const frenchMatches = (text.match(frenchWords) || []).length;
    const germanMatches = (text.match(germanWords) || []).length;

    const wordCount = text.split(/\s+/).length;
    const threshold = wordCount * 0.15;

    if (spanishMatches > threshold && spanishMatches > frenchMatches && spanishMatches > germanMatches) {
      return { language: 'es', confidence: Math.min(0.9, spanishMatches / wordCount) };
    }
    if (frenchMatches > threshold && frenchMatches > germanMatches) {
      return { language: 'fr', confidence: Math.min(0.9, frenchMatches / wordCount) };
    }
    if (germanMatches > threshold) {
      return { language: 'de', confidence: Math.min(0.9, germanMatches / wordCount) };
    }

    // Default to English
    return { language: 'en', confidence: 0.7 };
  }

  /**
   * Translate text
   */
  async translate(
    text: string,
    targetLanguage: string = 'en',
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    // Check cache
    const cacheKey = `${text}-${targetLanguage}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Detect source language if not provided
    const detected = sourceLanguage 
      ? { language: sourceLanguage, confidence: 1 }
      : this.detectLanguage(text);

    // If same language, return original
    if (detected.language === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: detected.language,
        targetLanguage,
        confidence: 1,
        timestamp: Date.now(),
      };
    }

    try {
      // Use browser's built-in translation if available, otherwise use fallback
      const translatedText = await this.performTranslation(text, detected.language, targetLanguage);

      const result: TranslationResult = {
        originalText: text,
        translatedText,
        sourceLanguage: detected.language,
        targetLanguage,
        confidence: detected.confidence,
        timestamp: Date.now(),
      };

      // Cache result
      this.cache.set(cacheKey, result);

      logger.log('Translation', `Translated from ${detected.language} to ${targetLanguage}`);
      return result;
    } catch (error) {
      logger.error('Translation', 'Translation failed:', error);
      
      // Return original with error indication
      return {
        originalText: text,
        translatedText: `[Translation unavailable] ${text}`,
        sourceLanguage: detected.language,
        targetLanguage,
        confidence: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Perform actual translation
   */
  private async performTranslation(
    text: string,
    from: string,
    to: string
  ): Promise<string> {
    // For demo purposes, use a simple placeholder
    // In production, integrate with Google Translate, DeepL, or similar API
    
    // Simple phrase translations for demo
    const commonPhrases: Record<string, Record<string, string>> = {
      'zh': {
        '你好': 'Hello',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '请问': 'Excuse me',
        '多少钱': 'How much?',
        '在哪里': 'Where is',
        '公园在哪里': 'Where is the park?',
      },
      'es': {
        'hola': 'Hello',
        'gracias': 'Thank you',
        'adiós': 'Goodbye',
        'por favor': 'Please',
        'cuánto cuesta': 'How much does it cost?',
        'dónde está': 'Where is',
      },
      'fr': {
        'bonjour': 'Hello',
        'merci': 'Thank you',
        'au revoir': 'Goodbye',
        's\'il vous plaît': 'Please',
        'combien': 'How much?',
        'où est': 'Where is',
      },
    };

    // Check for known phrases
    const phrases = commonPhrases[from];
    if (phrases) {
      const lowerText = text.toLowerCase();
      for (const [phrase, translation] of Object.entries(phrases)) {
        if (lowerText.includes(phrase.toLowerCase())) {
          return text.replace(new RegExp(phrase, 'gi'), translation);
        }
      }
    }

    // Return formatted placeholder for unknown text
    const langName = this.getLanguageName(from);
    return `[${langName}] ${text}`;
  }

  /**
   * Get language name from code
   */
  getLanguageName(code: string): string {
    const lang = this.supportedLanguages.find(l => l.code === code);
    return lang?.name || code.toUpperCase();
  }

  /**
   * Get native language name
   */
  getNativeLanguageName(code: string): string {
    const lang = this.supportedLanguages.find(l => l.code === code);
    return lang?.native || code.toUpperCase();
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.log('Translation', 'Cache cleared');
  }
}

export const translationService = new TranslationService();