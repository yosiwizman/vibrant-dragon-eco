/**
 * Accessibility Utilities
 * Provides helpers for ARIA labels, keyboard navigation, and screen reader support
 */

export const ARIA_LABELS = {
  // Navigation
  mainNav: "Main navigation",
  userMenu: "User account menu",
  settingsMenu: "Settings menu",
  
  // Voice Controls
  micButton: "Start voice conversation",
  stopListening: "Stop listening",
  stopSpeaking: "Stop speaking",
  voiceStatus: "Voice assistant status",
  
  // Widgets
  widgetGrid: "Customizable widget dashboard",
  addWidget: "Add new widget",
  removeWidget: "Remove widget",
  editWidgets: "Edit widget layout",
  doneEditing: "Finish editing widgets",
  
  // Forms
  emailInput: "Email address",
  passwordInput: "Password",
  searchInput: "Search",
  
  // Actions
  save: "Save changes",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  close: "Close",
  
  // Status
  loading: "Loading content",
  error: "Error occurred",
  success: "Action successful",
};

export const getAriaLabel = (key: keyof typeof ARIA_LABELS): string => {
  return ARIA_LABELS[key] || key;
};

export const getAriaLive = (type: 'polite' | 'assertive' | 'off' = 'polite'): string => {
  return type;
};

export const getAriaDescribedBy = (id: string): string => {
  return `${id}-description`;
};

export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }
) => {
  switch (event.key) {
    case 'Enter':
      handlers.onEnter?.();
      break;
    case 'Escape':
      handlers.onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      handlers.onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      handlers.onArrowDown?.();
      break;
    case 'ArrowLeft':
      handlers.onArrowLeft?.();
      break;
    case 'ArrowRight':
      handlers.onArrowRight?.();
      break;
  }
};

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector));
};

export const trapFocus = (container: HTMLElement) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};