"use client";

// Session Recording Service
// Records user sessions for debugging and UX analysis

interface SessionEvent {
  type: 'click' | 'input' | 'scroll' | 'navigation' | 'error' | 'voice' | 'custom';
  timestamp: number;
  data: Record<string, any>;
}

interface SessionRecording {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  events: SessionEvent[];
  metadata: {
    userAgent: string;
    screenSize: { width: number; height: number };
    url: string;
    referrer: string;
  };
}

interface RecordingConfig {
  captureClicks: boolean;
  captureInputs: boolean;
  captureScrolls: boolean;
  captureNavigation: boolean;
  captureErrors: boolean;
  captureVoice: boolean;
  maxEvents: number;
  sampleRate: number; // 0-100, percentage of sessions to record
}

class SessionRecordingService {
  private currentRecording: SessionRecording | null = null;
  private config: RecordingConfig = {
    captureClicks: true,
    captureInputs: true,
    captureScrolls: true,
    captureNavigation: true,
    captureErrors: true,
    captureVoice: true,
    maxEvents: 10000,
    sampleRate: 100
  };
  
  private recordings: SessionRecording[] = [];
  private isRecording = false;
  private eventListeners: (() => void)[] = [];

  initialize(userId: string): void {
    // Check if this session should be recorded based on sample rate
    if (Math.random() * 100 > this.config.sampleRate) {
      console.log('[session-recording] Session not sampled for recording');
      return;
    }
    
    this.startRecording(userId);
  }

  private startRecording(userId: string): void {
    if (this.isRecording) return;
    
    this.currentRecording = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startTime: Date.now(),
      events: [],
      metadata: {
        userAgent: navigator.userAgent,
        screenSize: { width: window.innerWidth, height: window.innerHeight },
        url: window.location.href,
        referrer: document.referrer
      }
    };
    
    this.isRecording = true;
    this.attachEventListeners();
    
    console.log('[session-recording] Recording started:', this.currentRecording.id);
  }

  stopRecording(): SessionRecording | null {
    if (!this.isRecording || !this.currentRecording) return null;
    
    this.currentRecording.endTime = Date.now();
    this.detachEventListeners();
    
    const recording = this.currentRecording;
    this.recordings.push(recording);
    
    // Save to localStorage (in production, send to server)
    this.saveRecording(recording);
    
    console.log('[session-recording] Recording stopped:', recording.id, 'Events:', recording.events.length);
    
    this.currentRecording = null;
    this.isRecording = false;
    
    return recording;
  }

  private attachEventListeners(): void {
    // Click events
    if (this.config.captureClicks) {
      const clickHandler = (e: MouseEvent) => this.recordClick(e);
      document.addEventListener('click', clickHandler, true);
      this.eventListeners.push(() => document.removeEventListener('click', clickHandler, true));
    }
    
    // Input events
    if (this.config.captureInputs) {
      const inputHandler = (e: Event) => this.recordInput(e);
      document.addEventListener('input', inputHandler, true);
      this.eventListeners.push(() => document.removeEventListener('input', inputHandler, true));
    }
    
    // Scroll events (throttled)
    if (this.config.captureScrolls) {
      let scrollTimeout: NodeJS.Timeout;
      const scrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => this.recordScroll(), 100);
      };
      window.addEventListener('scroll', scrollHandler, true);
      this.eventListeners.push(() => window.removeEventListener('scroll', scrollHandler, true));
    }
    
    // Navigation events
    if (this.config.captureNavigation) {
      const popstateHandler = () => this.recordNavigation();
      window.addEventListener('popstate', popstateHandler);
      this.eventListeners.push(() => window.removeEventListener('popstate', popstateHandler));
    }
    
    // Error events
    if (this.config.captureErrors) {
      const errorHandler = (e: ErrorEvent) => this.recordError(e);
      window.addEventListener('error', errorHandler);
      this.eventListeners.push(() => window.removeEventListener('error', errorHandler));
    }
    
    // Visibility change (for session end)
    const visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.stopRecording();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    this.eventListeners.push(() => document.removeEventListener('visibilitychange', visibilityHandler));
  }

  private detachEventListeners(): void {
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners = [];
  }

  private addEvent(event: SessionEvent): void {
    if (!this.currentRecording) return;
    
    if (this.currentRecording.events.length >= this.config.maxEvents) {
      console.log('[session-recording] Max events reached, stopping recording');
      this.stopRecording();
      return;
    }
    
    this.currentRecording.events.push(event);
  }

  private recordClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    
    this.addEvent({
      type: 'click',
      timestamp: Date.now(),
      data: {
        x: e.clientX,
        y: e.clientY,
        target: {
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          text: target.textContent?.substring(0, 50)
        }
      }
    });
  }

  private recordInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    
    // Don't record sensitive input values
    const sensitiveTypes = ['password', 'email', 'tel', 'credit-card'];
    const isSensitive = sensitiveTypes.includes(target.type) || 
                        target.name?.toLowerCase().includes('password') ||
                        target.name?.toLowerCase().includes('credit');
    
    this.addEvent({
      type: 'input',
      timestamp: Date.now(),
      data: {
        target: {
          tagName: target.tagName,
          id: target.id,
          name: target.name,
          type: target.type
        },
        value: isSensitive ? '[REDACTED]' : target.value?.substring(0, 100),
        valueLength: target.value?.length || 0
      }
    });
  }

  private recordScroll(): void {
    this.addEvent({
      type: 'scroll',
      timestamp: Date.now(),
      data: {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight
      }
    });
  }

  private recordNavigation(): void {
    this.addEvent({
      type: 'navigation',
      timestamp: Date.now(),
      data: {
        url: window.location.href,
        pathname: window.location.pathname
      }
    });
  }

  private recordError(e: ErrorEvent): void {
    this.addEvent({
      type: 'error',
      timestamp: Date.now(),
      data: {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      }
    });
  }

  // Public method to record voice events
  recordVoiceEvent(action: string, data: Record<string, any> = {}): void {
    if (!this.config.captureVoice) return;
    
    this.addEvent({
      type: 'voice',
      timestamp: Date.now(),
      data: {
        action,
        ...data
      }
    });
  }

  // Public method to record custom events
  recordCustomEvent(name: string, data: Record<string, any> = {}): void {
    this.addEvent({
      type: 'custom',
      timestamp: Date.now(),
      data: {
        name,
        ...data
      }
    });
  }

  private saveRecording(recording: SessionRecording): void {
    try {
      // In production, send to server instead
      const key = `session_recording_${recording.id}`;
      const compressed = this.compressRecording(recording);
      localStorage.setItem(key, JSON.stringify(compressed));
      
      // Keep only last 10 recordings
      this.cleanupOldRecordings();
    } catch (error) {
      console.error('[session-recording] Failed to save recording:', error);
    }
  }

  private compressRecording(recording: SessionRecording): SessionRecording {
    // Remove duplicate consecutive scroll events
    const compressedEvents: SessionEvent[] = [];
    let lastScrollTime = 0;
    
    recording.events.forEach(event => {
      if (event.type === 'scroll') {
        if (event.timestamp - lastScrollTime > 500) {
          compressedEvents.push(event);
          lastScrollTime = event.timestamp;
        }
      } else {
        compressedEvents.push(event);
      }
    });
    
    return {
      ...recording,
      events: compressedEvents
    };
  }

  private cleanupOldRecordings(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('session_recording_'));
    if (keys.length > 10) {
      keys.sort().slice(0, keys.length - 10).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }

  getRecordings(): SessionRecording[] {
    return this.recordings;
  }

  getRecordingById(id: string): SessionRecording | undefined {
    return this.recordings.find(r => r.id === id);
  }

  getCurrentRecording(): SessionRecording | null {
    return this.currentRecording;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  updateConfig(config: Partial<RecordingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[session-recording] Config updated:', this.config);
  }

  // Generate session summary
  generateSessionSummary(recording: SessionRecording): {
    duration: number;
    eventCounts: Record<string, number>;
    topInteractions: string[];
    errorCount: number;
    voiceUsage: number;
  } {
    const duration = (recording.endTime || Date.now()) - recording.startTime;
    
    const eventCounts: Record<string, number> = {};
    const interactions: Map<string, number> = new Map();
    let errorCount = 0;
    let voiceUsage = 0;
    
    recording.events.forEach(event => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      
      if (event.type === 'click' && event.data.target) {
        const key = `${event.data.target.tagName}#${event.data.target.id || event.data.target.className}`;
        interactions.set(key, (interactions.get(key) || 0) + 1);
      }
      
      if (event.type === 'error') errorCount++;
      if (event.type === 'voice') voiceUsage++;
    });
    
    const topInteractions = Array.from(interactions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => key);
    
    return {
      duration,
      eventCounts,
      topInteractions,
      errorCount,
      voiceUsage
    };
  }
}

export const sessionRecording = new SessionRecordingService();