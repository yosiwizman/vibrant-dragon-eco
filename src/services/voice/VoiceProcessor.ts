import { transcribeAudio } from '@/services/openai-voice';
import { buildSystemPrompt, parseToolCalls, executeTool, ActionResult } from '@/services/orchestrator';
import { DEMO_MODE_SENTINEL_KEY } from '@/services/demo-mode';
import { proxyChat } from '@/services/ai-proxy';
import { normalizeSpeechInput } from '@/services/conversation-manager';
import { getMemoryContext } from '@/services/memory';
import { saveChatMessage, getChatContext } from '@/services/chat-history';
import { webLLM, isWebLLMSupported } from '@/services/web-llm';
import { voiceRateLimiter, openAIRateLimiter } from '@/services/rate-limiter';
import { trackVoiceCommand, trackError } from '@/services/analytics';
import { LocationContext } from '@/services/context';
import { ProcessingResult, VoiceConfig } from './types';

export class VoiceProcessor {
  async transcribe(audioBlob: Blob, apiKey: string): Promise<string> {
    // Lower the minimum size threshold - even short recordings might have speech
    if (audioBlob.size < 1000) {
      console.log('[VoiceProcessor] Recording very small:', audioBlob.size, 'bytes');
      throw new Error('Recording too short. Please speak for at least 1 second.');
    }

    console.log('[VoiceProcessor] Transcribing audio, size:', audioBlob.size);
    
    const result = await transcribeAudio(audioBlob, apiKey);
    const text = (result.text || '').trim();
    
    console.log('[VoiceProcessor] Transcription result:', text || '(empty)');
    
    // If transcription is empty, throw a user-friendly error
    if (!text) {
      throw new Error('No speech detected. Please speak clearly and try again. Make sure your microphone is working and you are close to it.');
    }
    
    return text;
  }

  async processCommand(
    text: string,
    userId: string,
    apiKey: string | null,
    config: VoiceConfig,
    location: LocationContext | null,
    onNavigate?: (path: string) => void
  ): Promise<ProcessingResult> {
    // Check rate limits
    const voiceCheck = voiceRateLimiter.checkLimit(userId);
    if (!voiceCheck.allowed) {
      const waitTime = Math.ceil((voiceCheck.resetAt - Date.now()) / 1000);
      throw new Error(`Too many voice commands. Please wait ${waitTime} seconds.`);
    }

    const isOnline = navigator.onLine;
    const hasApiKey = !!apiKey;
    const hasWebLLM = isWebLLMSupported();
    const useLocalAI = !isOnline || !hasApiKey;

    if (!hasApiKey && !hasWebLLM) {
      throw new Error('Please add your OpenAI API key in Settings or enable offline AI');
    }

    const normalizedText = normalizeSpeechInput(text);

    // Use local AI if offline or no API key
    if (useLocalAI && hasWebLLM) {
      return this.processWithLocalAI(normalizedText, userId, config, location);
    }

    // Check OpenAI rate limit
    if (!useLocalAI) {
      const apiCheck = openAIRateLimiter.checkLimit(userId, 0.01);
      if (!apiCheck.allowed) {
        throw new Error(apiCheck.reason || 'API rate limit exceeded');
      }
    }

    return this.processWithOpenAI(normalizedText, userId, apiKey!, config, location, onNavigate);
  }

  private async processWithLocalAI(
    text: string,
    userId: string,
    config: VoiceConfig,
    location: LocationContext | null
  ): Promise<ProcessingResult> {
    console.log('[VoiceProcessor] Using local WebLLM');

    const modelCached = await webLLM.isModelCached();
    if (!modelCached) {
      throw new Error('Offline AI not downloaded. Please download the model in Settings.');
    }

    await webLLM.initialize();

    const systemPrompt = `You are ${config.assistantName || 'Echo'}, a helpful AI assistant.
Current time: ${new Date().toLocaleString()}
Location: ${location?.city || 'Unknown'}

Parse the user's command and respond naturally.`;

    const response = await webLLM.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ]);

    const toolCalls = parseToolCalls(response);
    const toolResults: ActionResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await executeTool(userId, toolCall);
      toolResults.push(result);
    }

    const toolsUsed = toolCalls.map(tc => tc.tool);
    trackVoiceCommand(text, true, userId);

    return { response, toolResults, toolsUsed };
  }

  private async processWithOpenAI(
    text: string,
    userId: string,
    apiKey: string,
    config: VoiceConfig,
    location: LocationContext | null,
    onNavigate?: (path: string) => void
  ): Promise<ProcessingResult> {
    console.log('[VoiceProcessor] Using OpenAI');

    // Get context
    let memoryContext = '';
    if (config.enableMemory) {
      memoryContext = await getMemoryContext(userId);
    }

    let chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];
    if (config.enableChatHistory) {
      chatHistory = await getChatContext(userId, Math.min(config.chatHistoryLimit || 10, 20));
    }

    const systemPrompt = buildSystemPrompt(
      location ? { lat: location.lat, lng: location.lng, city: location.city } : undefined,
      config.assistantName,
      memoryContext
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: text },
    ];

    // Save user message
    if (config.enableChatHistory && !config.privateMode) {
      saveChatMessage(userId, 'user', text);
    }

    // Call OpenAI (direct) or Demo Mode server proxy
    let aiResponse: string;

    if (apiKey === DEMO_MODE_SENTINEL_KEY) {
      const proxyRes = await proxyChat({
        model: 'gpt-4o-mini',
        messages: messages as any,
        max_tokens: 1024,
      });
      aiResponse = proxyRes.content;
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI request failed: ${errorText}`);
      }

      const data = await response.json();
      aiResponse = data.choices[0].message.content;
    }

    // Execute tool calls
    const toolCalls = parseToolCalls(aiResponse);
    const toolResults: ActionResult[] = [];
    let navigateTo: string | undefined;

    for (const toolCall of toolCalls) {
      const result = await executeTool(userId, toolCall);
      toolResults.push(result);

      if (toolCall.tool === 'navigate_to' && result.success && result.data?.path) {
        navigateTo = result.data.path;
        onNavigate?.(result.data.path);
      }
    }

    // Get follow-up response if tools were executed
    if (toolResults.length > 0) {
      const toolResultsText = toolResults
        .map((r) => (r.data?.voiceText ? r.data.voiceText : `${r.tool}: ${r.success ? 'Success' : r.error}`))
        .join('\n');

      const followUpMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
        { role: 'assistant', content: aiResponse },
        { role: 'user', content: `Results: ${toolResultsText}\n\nGive a brief voice response.` },
      ];

      if (apiKey === DEMO_MODE_SENTINEL_KEY) {
        const follow = await proxyChat({
          model: 'gpt-4o-mini',
          messages: followUpMessages as any,
          max_tokens: 256,
        });
        aiResponse = follow.content;
      } else {
        const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: followUpMessages,
            max_tokens: 256,
          }),
        });

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          aiResponse = followUpData.choices[0].message.content;
        }
      }
    }

    // Clean response
    const cleanResponse = aiResponse
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\*\*/g, '')
      .trim();

    const voiceTextResult = toolResults.find((r) => r.data?.voiceText);
    const finalResponse = voiceTextResult?.data?.voiceText || cleanResponse;

    // Save assistant response
    if (config.enableChatHistory && !config.privateMode) {
      saveChatMessage(userId, 'assistant', finalResponse);
    }

    const toolsUsed = toolCalls.map(tc => tc.tool);
    trackVoiceCommand(text, true, userId);

    return { response: finalResponse, toolResults, toolsUsed, navigateTo };
  }
}

export const voiceProcessor = new VoiceProcessor();