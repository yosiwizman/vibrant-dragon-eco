import { RecordingCallbacks } from './types';

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;
  private isStarting = false;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private silenceStart: number | null = null;
  private mimeType = 'audio/webm';

  async start(callbacks: RecordingCallbacks, enableSilenceDetection = false): Promise<void> {
    // Prevent duplicate starts
    if (this.isStarting || this.isRecording) {
      console.log('[VoiceRecorder] Already recording or starting');
      return;
    }

    this.isStarting = true;

    try {
      // Clean up any existing recording
      await this.cleanup();

      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio context for silence detection
      if (enableSilenceDetection) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        source.connect(this.analyser);
        this.silenceStart = null;
      }

      // Determine best audio format for OpenAI Whisper
      this.mimeType = this.getBestMimeType();
      console.log(`[VoiceRecorder] Using format: ${this.mimeType}`);

      // Create MediaRecorder
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 128000,
      };
      
      if (this.mimeType !== 'audio/webm') {
        recorderOptions.mimeType = this.mimeType;
      }

      this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType });
        console.log(`[VoiceRecorder] Recording stopped. Blob size: ${blob.size}`);
        callbacks.onData(blob);
        callbacks.onStop();
        this.isRecording = false;
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('[VoiceRecorder] Error:', event.error);
        callbacks.onError(event.error || new Error('Recording failed'));
        this.isRecording = false;
      };

      // Start recording
      this.mediaRecorder.start(1000);
      this.isRecording = true;
      this.isStarting = false;
      callbacks.onStart();

      console.log('[VoiceRecorder] Recording started');

      // Start silence detection if enabled
      if (enableSilenceDetection && callbacks.onSilenceDetected) {
        this.startSilenceDetection(callbacks.onSilenceDetected);
      }
    } catch (error: any) {
      console.error('[VoiceRecorder] Failed to start:', error);
      this.isStarting = false;
      this.isRecording = false;
      callbacks.onError(error);
    }
  }

  stop(): void {
    console.log('[VoiceRecorder] Stopping...');
    
    this.isStarting = false;
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('[VoiceRecorder] Error stopping MediaRecorder:', e);
      }
    }

    this.cleanup();
  }

  private async cleanup(): Promise<void> {
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (e) {
        console.warn('[VoiceRecorder] Error closing AudioContext:', e);
      }
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[VoiceRecorder] Error stopping track:', e);
        }
      });
      this.stream = null;
    }

    this.analyser = null;
    this.silenceStart = null;
  }

  private getBestMimeType(): string {
    // WebM with Opus is best for OpenAI Whisper
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        return format;
      }
    }

    return 'audio/webm';
  }

  private recordingStartTime: number = 0;

  private startSilenceDetection(onSilenceDetected: () => void): void {
    // Track when recording started
    this.recordingStartTime = Date.now();
    
    const checkSilence = () => {
      if (!this.analyser || !this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        return;
      }

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);

      // Calculate average volume level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      
      // Also check the max value to detect any speech
      const maxValue = Math.max(...dataArray);
      
      // FIXED: Much more lenient settings
      const silenceThreshold = 5; // Very low threshold - only trigger on true silence
      const silenceDuration = 3000; // 3 seconds of silence required
      const minimumRecordingTime = 3000; // Must record for at least 3 seconds before checking silence

      // Don't check for silence until minimum recording time has passed
      const timeSinceStart = Date.now() - this.recordingStartTime;
      if (timeSinceStart < minimumRecordingTime) {
        this.silenceTimeout = setTimeout(checkSilence, 100);
        return;
      }

      // Log audio levels for debugging (only occasionally to avoid spam)
      if (Math.random() < 0.1) {
        console.log(`[VoiceRecorder] Audio level - avg: ${average.toFixed(1)}, max: ${maxValue}, time: ${(timeSinceStart/1000).toFixed(1)}s`);
      }

      // Consider it silence only if BOTH average AND max are very low
      const isSilent = average < silenceThreshold && maxValue < 15;

      if (isSilent) {
        if (this.silenceStart === null) {
          this.silenceStart = Date.now();
          console.log('[VoiceRecorder] Silence started...');
        } else if (Date.now() - this.silenceStart > silenceDuration) {
          console.log('[VoiceRecorder] Silence detected after', ((Date.now() - this.silenceStart) / 1000).toFixed(1), 'seconds');
          onSilenceDetected();
          return;
        }
      } else {
        // Reset silence timer when sound is detected
        if (this.silenceStart !== null) {
          console.log('[VoiceRecorder] Sound detected, resetting silence timer');
        }
        this.silenceStart = null;
      }

      this.silenceTimeout = setTimeout(checkSilence, 100);
    };

    // Start checking after 2 seconds to give user time to start speaking
    this.silenceTimeout = setTimeout(checkSilence, 2000);
  }

  get recording(): boolean {
    return this.isRecording;
  }

  get starting(): boolean {
    return this.isStarting;
  }
}

export const voiceRecorder = new VoiceRecorder();