"use client";

/**
 * Real-time Collaboration Service
 * Enables multi-user support and real-time synchronization
 * Foundation for future collaborative features
 */

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
  cursor?: { x: number; y: number; page: string };
}

interface CollaborationEvent {
  id: string;
  type: 'join' | 'leave' | 'update' | 'cursor' | 'action' | 'message';
  userId: string;
  timestamp: number;
  data: Record<string, any>;
}

interface SharedState {
  version: number;
  lastModified: number;
  modifiedBy: string;
  data: Record<string, any>;
}

interface CollaborationRoom {
  id: string;
  name: string;
  users: Map<string, CollaborationUser>;
  state: SharedState;
  events: CollaborationEvent[];
  createdAt: number;
}

type EventCallback = (event: CollaborationEvent) => void;
type StateCallback = (state: SharedState) => void;

class RealTimeCollaborationService {
  private currentUser: CollaborationUser | null = null;
  private rooms: Map<string, CollaborationRoom> = new Map();
  private activeRoom: string | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private stateListeners: Map<string, Set<StateCallback>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  /**
   * Initialize the collaboration service
   */
  initialize(user: { id: string; name: string; email: string; avatar?: string }): void {
    this.currentUser = {
      ...user,
      status: 'online',
      lastSeen: Date.now()
    };
    
    this.startHeartbeat();
    this.isConnected = true;
    
    console.log('[real-time-collaboration] Initialized for user:', user.name);
  }

  /**
   * Start heartbeat to maintain presence
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.currentUser) {
        this.currentUser.lastSeen = Date.now();
        this.broadcastPresence();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Broadcast presence to active room
   */
  private broadcastPresence(): void {
    if (!this.activeRoom || !this.currentUser) return;
    
    this.emitEvent(this.activeRoom, {
      type: 'update',
      data: { status: this.currentUser.status, lastSeen: this.currentUser.lastSeen }
    });
  }

  /**
   * Create a new collaboration room
   */
  createRoom(name: string): CollaborationRoom {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const room: CollaborationRoom = {
      id: roomId,
      name,
      users: new Map(),
      state: {
        version: 0,
        lastModified: Date.now(),
        modifiedBy: this.currentUser?.id || 'system',
        data: {}
      },
      events: [],
      createdAt: Date.now()
    };
    
    this.rooms.set(roomId, room);
    console.log('[real-time-collaboration] Created room:', name);
    
    return room;
  }

  /**
   * Join a collaboration room
   */
  joinRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !this.currentUser) return false;
    
    // Add user to room
    room.users.set(this.currentUser.id, this.currentUser);
    this.activeRoom = roomId;
    
    // Emit join event
    this.emitEvent(roomId, {
      type: 'join',
      data: { user: this.currentUser }
    });
    
    console.log('[real-time-collaboration] Joined room:', room.name);
    return true;
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (!this.activeRoom || !this.currentUser) return;
    
    const room = this.rooms.get(this.activeRoom);
    if (room) {
      // Emit leave event
      this.emitEvent(this.activeRoom, {
        type: 'leave',
        data: { userId: this.currentUser.id }
      });
      
      // Remove user from room
      room.users.delete(this.currentUser.id);
      console.log('[real-time-collaboration] Left room:', room.name);
    }
    
    this.activeRoom = null;
  }

  /**
   * Update shared state
   */
  updateState(path: string, value: any): void {
    if (!this.activeRoom || !this.currentUser) return;
    
    const room = this.rooms.get(this.activeRoom);
    if (!room) return;
    
    // Update state
    const pathParts = path.split('.');
    let current = room.state.data;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    
    // Update metadata
    room.state.version++;
    room.state.lastModified = Date.now();
    room.state.modifiedBy = this.currentUser.id;
    
    // Emit update event
    this.emitEvent(this.activeRoom, {
      type: 'update',
      data: { path, value, version: room.state.version }
    });
    
    // Notify state listeners
    this.notifyStateListeners(this.activeRoom, room.state);
  }

  /**
   * Get shared state
   */
  getState(path?: string): any {
    if (!this.activeRoom) return null;
    
    const room = this.rooms.get(this.activeRoom);
    if (!room) return null;
    
    if (!path) return room.state.data;
    
    const pathParts = path.split('.');
    let current = room.state.data;
    
    for (const part of pathParts) {
      if (current[part] === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }

  /**
   * Update cursor position
   */
  updateCursor(x: number, y: number, page: string): void {
    if (!this.activeRoom || !this.currentUser) return;
    
    this.currentUser.cursor = { x, y, page };
    
    this.emitEvent(this.activeRoom, {
      type: 'cursor',
      data: { cursor: this.currentUser.cursor }
    });
  }

  /**
   * Send a message to the room
   */
  sendMessage(content: string): void {
    if (!this.activeRoom || !this.currentUser) return;
    
    this.emitEvent(this.activeRoom, {
      type: 'message',
      data: { content, sender: this.currentUser.name }
    });
  }

  /**
   * Emit an event to a room
   */
  private emitEvent(roomId: string, eventData: Omit<CollaborationEvent, 'id' | 'userId' | 'timestamp'>): void {
    const room = this.rooms.get(roomId);
    if (!room || !this.currentUser) return;
    
    const event: CollaborationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      timestamp: Date.now(),
      ...eventData
    };
    
    // Store event
    room.events.push(event);
    
    // Keep only last 1000 events
    if (room.events.length > 1000) {
      room.events = room.events.slice(-1000);
    }
    
    // Notify listeners
    this.notifyEventListeners(roomId, event);
  }

  /**
   * Subscribe to room events
   */
  onEvent(roomId: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(roomId)) {
      this.eventListeners.set(roomId, new Set());
    }
    
    this.eventListeners.get(roomId)!.add(callback);
    
    return () => {
      this.eventListeners.get(roomId)?.delete(callback);
    };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(roomId: string, callback: StateCallback): () => void {
    if (!this.stateListeners.has(roomId)) {
      this.stateListeners.set(roomId, new Set());
    }
    
    this.stateListeners.get(roomId)!.add(callback);
    
    return () => {
      this.stateListeners.get(roomId)?.delete(callback);
    };
  }

  /**
   * Notify event listeners
   */
  private notifyEventListeners(roomId: string, event: CollaborationEvent): void {
    this.eventListeners.get(roomId)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[real-time-collaboration] Event listener error:', error);
      }
    });
  }

  /**
   * Notify state listeners
   */
  private notifyStateListeners(roomId: string, state: SharedState): void {
    this.stateListeners.get(roomId)?.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[real-time-collaboration] State listener error:', error);
      }
    });
  }

  /**
   * Get users in a room
   */
  getRoomUsers(roomId?: string): CollaborationUser[] {
    const targetRoom = roomId || this.activeRoom;
    if (!targetRoom) return [];
    
    const room = this.rooms.get(targetRoom);
    return room ? Array.from(room.users.values()) : [];
  }

  /**
   * Get online users count
   */
  getOnlineCount(roomId?: string): number {
    const users = this.getRoomUsers(roomId);
    return users.filter(u => u.status === 'online').length;
  }

  /**
   * Set user status
   */
  setStatus(status: 'online' | 'away' | 'offline'): void {
    if (!this.currentUser) return;
    
    this.currentUser.status = status;
    this.broadcastPresence();
  }

  /**
   * Get room info
   */
  getRoomInfo(roomId?: string): CollaborationRoom | null {
    const targetRoom = roomId || this.activeRoom;
    if (!targetRoom) return null;
    
    return this.rooms.get(targetRoom) || null;
  }

  /**
   * Get all rooms
   */
  getAllRooms(): CollaborationRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get recent events
   */
  getRecentEvents(roomId?: string, limit: number = 50): CollaborationEvent[] {
    const targetRoom = roomId || this.activeRoom;
    if (!targetRoom) return [];
    
    const room = this.rooms.get(targetRoom);
    return room ? room.events.slice(-limit) : [];
  }

  /**
   * Check if connected
   */
  isActive(): boolean {
    return this.isConnected && this.currentUser !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.leaveRoom();
    this.stopHeartbeat();
    
    if (this.currentUser) {
      this.currentUser.status = 'offline';
    }
    
    this.isConnected = false;
    this.currentUser = null;
    
    console.log('[real-time-collaboration] Disconnected');
  }

  /**
   * Get collaboration stats
   */
  getStats(): {
    isConnected: boolean;
    activeRoom: string | null;
    totalRooms: number;
    totalUsers: number;
    recentEvents: number;
  } {
    let totalUsers = 0;
    let recentEvents = 0;
    
    this.rooms.forEach(room => {
      totalUsers += room.users.size;
      recentEvents += room.events.filter(e => 
        Date.now() - e.timestamp < 3600000 // Last hour
      ).length;
    });
    
    return {
      isConnected: this.isConnected,
      activeRoom: this.activeRoom,
      totalRooms: this.rooms.size,
      totalUsers,
      recentEvents
    };
  }
}

export const realTimeCollaboration = new RealTimeCollaborationService();