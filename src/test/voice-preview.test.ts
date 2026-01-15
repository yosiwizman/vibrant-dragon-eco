import { describe, it, expect, vi } from 'vitest';
import { synthesizeSpeech, playAudioBlob } from '@/services/openai-voice';

// Mock fetch
global.fetch = vi.fn();

describe('Voice Preview', () => {
  it('should use OpenAI TTS for voice preview', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    });

    const result = await synthesizeSpeech('Hello', 'test-key', 'nova');
    
    expect(result).toBeInstanceOf(Blob);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/audio/speech'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
        }),
        body: expect.stringContaining('"voice":"nova"'),
      })
    );
  });

  it('should use standard model for faster response', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/mp3' });
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    });

    await synthesizeSpeech('Hello', 'test-key', 'alloy');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining('"model":"tts-1"'),
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('API Error'),
    });

    await expect(synthesizeSpeech('Hello', 'bad-key', 'nova')).rejects.toThrow('Speech synthesis failed');
  });
});

describe('Audio Playback', () => {
  it('should play audio blob', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mp3' });
    
    // Mock Audio API
    global.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
    })) as any;

    await expect(playAudioBlob(mockBlob)).resolves.not.toThrow();
  });
});