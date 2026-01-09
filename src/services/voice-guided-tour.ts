import { offlineVoice } from "./offline-voice";
import { webLLM } from "./web-llm";

export interface TourStep {
  id: string;
  message: string;
  action?: () => void;
  highlight?: string;
  duration?: number;
}

export const ONBOARDING_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    message: "Hello! I'm Echo, your personal AI assistant. I'm so excited to help you get started. Let me show you around!",
    duration: 4000,
  },
  {
    id: "dashboard",
    message: "This is your dashboard. You can customize it with widgets. Try saying 'add weather widget' or 'show me my tasks'.",
    highlight: "dashboard",
    duration: 6000,
  },
  {
    id: "voice-control",
    message: "See this microphone button? Click it anytime to talk to me. Or enable wake word in settings and just say 'Hey Echo'.",
    highlight: "mic-button",
    duration: 6000,
  },
  {
    id: "tasks",
    message: "I can help you stay organized. Say things like 'create a task', 'remind me in 10 minutes', or 'take a note'.",
    highlight: "tasks",
    duration: 6000,
  },
  {
    id: "widgets",
    message: "Want to see something cool? Watch this. Adding a weather widget for you.",
    action: () => {
      if ((window as any).addWidgetToDashboard) {
        (window as any).addWidgetToDashboard("weather", { w: 2, h: 2 });
      }
    },
    duration: 5000,
  },
  {
    id: "navigation",
    message: "I can also navigate for you. Try saying 'open calendar', 'show my notes', or 'go to settings'.",
    duration: 5000,
  },
  {
    id: "complete",
    message: "You're all set! I'm here whenever you need me. Just click the microphone or say 'Hey Echo' to get started. Have a wonderful day!",
    duration: 6000,
  },
];

export class VoiceGuidedTour {
  private currentStep = 0;
  private isRunning = false;
  private onComplete?: () => void;

  async start(onComplete?: () => void) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.currentStep = 0;
    this.onComplete = onComplete;

    for (const step of ONBOARDING_TOUR_STEPS) {
      if (!this.isRunning) break;

      // Execute action
      if (step.action) {
        step.action();
      }

      // Highlight element
      if (step.highlight) {
        this.highlightElement(step.highlight);
      }

      // Speak message
      await this.speak(step.message);

      // Wait for duration
      if (step.duration) {
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      this.currentStep++;
    }

    this.isRunning = false;
    if (this.onComplete) {
      this.onComplete();
    }
  }

  stop() {
    this.isRunning = false;
  }

  private async speak(text: string) {
    try {
      await offlineVoice.speak(text, {
        voice: "Google UK English Female",
        rate: 0.9,
        pitch: 1.1,
      });
    } catch (error) {
      console.error("Tour voice error:", error);
    }
  }

  private highlightElement(elementId: string) {
    const element = document.querySelector(`[data-tour="${elementId}"]`);
    if (element) {
      element.classList.add("ring-4", "ring-fuchsia-400", "ring-offset-2", "ring-offset-slate-900");
      setTimeout(() => {
        element.classList.remove("ring-4", "ring-fuchsia-400", "ring-offset-2", "ring-offset-slate-900");
      }, 3000);
    }
  }

  getCurrentStep() {
    return this.currentStep;
  }

  isActive() {
    return this.isRunning;
  }
}

export const voiceGuidedTour = new VoiceGuidedTour();