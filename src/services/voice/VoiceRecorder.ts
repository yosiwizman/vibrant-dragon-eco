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
  private recordingStartTime: number = 0;
  private hasDetectedSpeech: boolean = false;

  async start(callbacks: RecordingCallbacks, enableSilenceDetection = false): Promise<void> {
    // Prevent duplicate starts
    if (this.isStarting || this.isRecording) {
      console.log('[VoiceRecorder] Already recording or starting');
      return;
    }

    this.isStarting = true;
    this.hasDetectedSpeech = false;

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
      this.recordingStartTime = Date.now();
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
    this.hasDetectedSpeech = false;
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

  private startSilenceDetection(onSilenceDetected: () => void): void {
    // Configuration for hands-free conversation mode
    const SPEECH_THRESHOLD = 15; // Audio level to consider as speech
    const SILENCE_THRESHOLD = 8; // Audio level to consider as silence
    const MIN_RECORDING_TIME = 1500; // Must record at least 1.5 seconds before checking silence
    const SILENCE_DURATION_AFTER_SPEECH = 2000; // 2 seconds of silence after speech to stop
    const MAX_RECORDING_TIME = 30000; // Maximum 30 seconds recording
    const INITIAL_WAIT_TIME = 500; // Wait 500ms before starting detection
    
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
      
      const timeSinceStart = Date.now() - this.recordingStartTime;

      // Check for maximum recording time
      if (timeSinceStart > MAX_RECORDING_TIME) {
        console.log('[VoiceRecorder] Maximum recording time reached, stopping');
        onSilenceDetected();
        return;
      }

      // Don't check for silence until minimum recording time has passed
      if (timeSinceStart < MIN_RECORDING_TIME) {
        this.silenceTimeout = setTimeout(checkSilence, 100);
        return;
      }

      // Detect if user is speaking
      const isSpeaking = average > SPEECH_THRESHOLD || maxValue > 40;
      const isSilent = average < SILENCE_THRESHOLD && maxValue < 25;

      // Log audio levels occasionally for debugging
      if (Math.random() < 0.1) {
        console.log(`[VoiceRecorder] Audio level - avg: ${average.toFixed(1)}, max: ${maxValue}, time: ${(timeSinceStart/1000).toFixed(1)}s, speech: ${this.hasDetectedSpeech}`);
      }

      if (isSpeaking) {
        // User is speaking - mark that we've detected speech and reset silence timer
        if (!this.hasDetectedSpeech) {
          console.log('[VoiceRecorder] Speech detected!');
        }
        this.hasDetectedSpeech = true;
        this.silenceStart = null;
      } else if (isSilent && this.hasDetectedSpeech) {
        // User has stopped speaking - start silence timer
        if (this.silenceStart === null) {
          this.silenceStart = Date.now();
          console.log('[VoiceRecorder] Silence started after speech...');
        } else if (Date.now() - this.silenceStart > SILENCE_DURATION_AFTER_SPEECH) {
          // Enough silence after speech - stop recording
          console.log('[VoiceRecorder] Silence detected after speech, auto-stopping');
          onSilenceDetected();
          return;
        }
      } else if (!this.hasDetectedSpeech && timeSinceStart > 8000) {
        // No speech detected for 8 seconds - stop to avoid hanging
        console.log('[VoiceRecorder] No speech detected for 8 seconds, stopping');
        onSilenceDetected();
        return;
      }

      this.silenceTimeout = setTimeout(checkSilence, 100);
    };

    // Start checking after initial wait
    this.silenceTimeout = setTimeout(checkSilence, INITIAL_WAIT_TIME);
  }

  get recording(): boolean {
    return this.isRecording;
  }

  get starting(): boolean {
    return this.isStarting;
  }
}

export const voiceRecorder = new VoiceRecorder();