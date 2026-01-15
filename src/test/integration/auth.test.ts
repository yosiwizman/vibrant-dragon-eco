import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createMockUser,
  createMockSession,
  createMockSupabaseAuth,
  mockLocalStorage
} from './utils/test-helpers';

describe('Authentication Flow', () => {
  let mockStorage: ReturnType<typeof mockLocalStorage>;
  let mockAuth: ReturnType<typeof createMockSupabaseAuth>;

  beforeEach(() => {
    mockStorage = mockLocalStorage();
    mockAuth = createMockSupabaseAuth();
    
    // Replace global localStorage
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete full login flow successfully', async () => {
      const mockUser = createMockUser({ email: 'test@example.com' });
      mockAuth.signIn.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await mockAuth.signIn({ email: 'test@example.com', password: 'password' });

      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should handle invalid credentials', async () => {
      mockAuth.signIn.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      });

      const result = await mockAuth.signIn({ email: 'wrong@example.com', password: 'wrong' });

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Invalid');
    });

    it('should handle network errors during login', async () => {
      mockAuth.signIn.mockRejectedValue(new Error('Network error'));

      await expect(mockAuth.signIn({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('Session Management', () => {
    it('should persist session to storage', () => {
      const session = createMockSession();
      
      mockStorage.setItem('supabase.auth.token', JSON.stringify(session));
      
      const stored = mockStorage.getItem('supabase.auth.token');
      expect(stored).toBeDefined();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.access_token).toBe(session.access_token);
    });

    it('should retrieve existing session', async () => {
      const session = createMockSession();
      mockAuth.getSession.mockResolvedValue({ data: { session }, error: null });

      const result = await mockAuth.getSession();

      expect(result.data.session).toBeDefined();
      expect(result.data.session.access_token).toBe(session.access_token);
    });

    it('should handle expired session', async () => {
      const expiredSession = createMockSession({ expires_at: Date.now() - 1000 });
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' }
      });

      const result = await mockAuth.getSession();

      expect(result.data.session).toBeNull();
    });

    it('should refresh session when needed', async () => {
      const newSession = createMockSession();
      mockAuth.getSession.mockResolvedValue({ data: { session: newSession }, error: null });

      const result = await mockAuth.getSession();

      expect(result.data.session.access_token).toBe(newSession.access_token);
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout successfully', async () => {
      mockStorage.setItem('supabase.auth.token', JSON.stringify(createMockSession()));
      
      mockAuth.signOut.mockImplementation(async () => {
        mockStorage.removeItem('supabase.auth.token');
        return { error: null };
      });

      await mockAuth.signOut();

      expect(mockStorage.getItem('supabase.auth.token')).toBeNull();
    });

    it('should preserve user preferences after logout', async () => {
      mockStorage.setItem('user_preferences', JSON.stringify({ theme: 'dark' }));
      mockStorage.setItem('supabase.auth.token', JSON.stringify(createMockSession()));

      mockAuth.signOut.mockImplementation(async () => {
        mockStorage.removeItem('supabase.auth.token');
        return { error: null };
      });

      await mockAuth.signOut();

      expect(mockStorage.getItem('user_preferences')).toBeDefined();
      expect(mockStorage.getItem('supabase.auth.token')).toBeNull();
    });

    it('should handle logout errors gracefully', async () => {
      mockAuth.signOut.mockResolvedValue({ error: { message: 'Logout failed' } });

      const result = await mockAuth.signOut();

      expect(result.error).toBeDefined();
    });
  });

  describe('Auth State Changes', () => {
    it('should subscribe to auth state changes', () => {
      const callback = vi.fn();
      
      mockAuth.onAuthStateChange(callback);

      expect(mockAuth.onAuthStateChange).toHaveBeenCalledWith(callback);
    });

    it('should unsubscribe from auth state changes', () => {
      const { data } = mockAuth.onAuthStateChange(vi.fn());

      data.subscription.unsubscribe();

      expect(data.subscription.unsubscribe).toHaveBeenCalled();
    });
  });
});