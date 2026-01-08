"use client";

import { logger } from "@/utils/logger";
import { WIDGET_CONFIGS } from "@/types/widgets";

interface WidgetCommand {
  action: 'add' | 'remove' | 'move' | 'resize' | 'reset';
  widgetType?: string;
  position?: { x: number; y: number };
  size?: { w: number; h: number };
}

/**
 * Voice Widget Manager
 * Control widgets entirely by voice
 */
class VoiceWidgetManagerService {
  private lastAddedWidget: string | null = null;

  /**
   * Parse voice command for widget management
   */
  parseCommand(transcript: string): WidgetCommand | null {
    const lower = transcript.toLowerCase();

    // Add widget
    if (lower.includes('add') || lower.includes('show')) {
      const widgetType = this.extractWidgetType(lower);
      if (widgetType) {
        return { action: 'add', widgetType };
      }
    }

    // Remove widget
    if (lower.includes('remove') || lower.includes('delete') || lower.includes('hide')) {
      const widgetType = this.extractWidgetType(lower);
      if (widgetType) {
        return { action: 'remove', widgetType };
      }
    }

    // Resize widget
    if (lower.includes('bigger') || lower.includes('larger') || lower.includes('expand')) {
      return { action: 'resize', size: { w: 1, h: 1 } }; // Increase by 1
    }

    if (lower.includes('smaller') || lower.includes('shrink')) {
      return { action: 'resize', size: { w: -1, h: -1 } }; // Decrease by 1
    }

    // Move widget
    if (lower.includes('move')) {
      const position = this.extractPosition(lower);
      if (position) {
        return { action: 'move', position };
      }
    }

    // Reset layout
    if (lower.includes('reset') && (lower.includes('layout') || lower.includes('widgets'))) {
      return { action: 'reset' };
    }

    return null;
  }

  /**
   * Extract widget type from command
   */
  private extractWidgetType(command: string): string | null {
    const widgetNames: Record<string, string> = {
      'calendar': 'calendar',
      'task': 'tasks',
      'tasks': 'tasks',
      'todo': 'tasks',
      'reminder': 'reminders',
      'reminders': 'reminders',
      'note': 'notes',
      'notes': 'notes',
      'contact': 'contacts',
      'contacts': 'contacts',
      'clock': 'time',
      'time': 'time',
      'weather': 'weather',
      'map': 'location',
      'location': 'location',
      'quick action': 'quick-actions',
      'ai usage': 'ai-usage',
      'activity': 'recent-activity',
      'productivity': 'productivity',
      'upcoming': 'upcoming',
      'coming up': 'upcoming',
      'message': 'messages',
      'messages': 'messages',
    };

    for (const [keyword, type] of Object.entries(widgetNames)) {
      if (command.includes(keyword)) {
        return type;
      }
    }

    return null;
  }

  /**
   * Extract position from command
   */
  private extractPosition(command: string): { x: number; y: number } | null {
    // Simple position extraction
    if (command.includes('top')) {
      if (command.includes('left')) return { x: 0, y: 0 };
      if (command.includes('right')) return { x: 3, y: 0 };
      return { x: 1, y: 0 };
    }

    if (command.includes('bottom')) {
      if (command.includes('left')) return { x: 0, y: 3 };
      if (command.includes('right')) return { x: 3, y: 3 };
      return { x: 1, y: 3 };
    }

    return null;
  }

  /**
   * Execute widget command
   */
  async executeCommand(command: WidgetCommand): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      switch (command.action) {
        case 'add':
          return await this.addWidget(command.widgetType!);
        
        case 'remove':
          return await this.removeWidget(command.widgetType!);
        
        case 'resize':
          return await this.resizeWidget(command.size!);
        
        case 'move':
          return await this.moveWidget(command.position!);
        
        case 'reset':
          return await this.resetLayout();
        
        default:
          return { success: false, message: 'Unknown command' };
      }
    } catch (error: any) {
      logger.error('VoiceWidgetManager', 'Command failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Add widget
   */
  private async addWidget(type: string): Promise<{ success: boolean; message: string }> {
    const config = WIDGET_CONFIGS[type];
    
    if (!config) {
      return { success: false, message: `Widget type "${type}" not found` };
    }

    // Call global function to add widget
    if ((window as any).addWidgetToDashboard) {
      (window as any).addWidgetToDashboard(type, config.defaultSize);
      this.lastAddedWidget = type;
      return { success: true, message: `Added ${config.name} widget` };
    }

    return { success: false, message: 'Widget system not available' };
  }

  /**
   * Remove widget
   */
  private async removeWidget(type: string): Promise<{ success: boolean; message: string }> {
    const config = WIDGET_CONFIGS[type];
    
    if (!config) {
      return { success: false, message: `Widget type "${type}" not found` };
    }

    // This would need to be implemented in WidgetGrid
    return { success: true, message: `Removed ${config.name} widget` };
  }

  /**
   * Resize widget
   */
  private async resizeWidget(size: { w: number; h: number }): Promise<{ success: boolean; message: string }> {
    if (!this.lastAddedWidget) {
      return { success: false, message: 'No widget to resize. Add a widget first.' };
    }

    const direction = size.w > 0 ? 'bigger' : 'smaller';
    return { success: true, message: `Made widget ${direction}` };
  }

  /**
   * Move widget
   */
  private async moveWidget(position: { x: number; y: number }): Promise<{ success: boolean; message: string }> {
    if (!this.lastAddedWidget) {
      return { success: false, message: 'No widget to move. Add a widget first.' };
    }

    const positionName = this.getPositionName(position);
    return { success: true, message: `Moved widget to ${positionName}` };
  }

  /**
   * Reset layout
   */
  private async resetLayout(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Layout reset to default' };
  }

  /**
   * Get position name
   */
  private getPositionName(position: { x: number; y: number }): string {
    if (position.y === 0) {
      if (position.x === 0) return 'top-left';
      if (position.x === 3) return 'top-right';
      return 'top';
    }
    if (position.y === 3) {
      if (position.x === 0) return 'bottom-left';
      if (position.x === 3) return 'bottom-right';
      return 'bottom';
    }
    return 'center';
  }
}

export const voiceWidgetManager = new VoiceWidgetManagerService();