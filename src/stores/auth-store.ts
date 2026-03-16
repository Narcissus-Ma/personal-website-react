import { create } from 'zustand';
import { API_BASE } from '@/config/api-base';

interface AuthState {
  isAuthenticated: boolean;
  verifyPassword: (password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  verifyPassword: async (password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
        set({ isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('验证失败:', error);
      return false;
    }
  },
}));
