import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  verifyPassword: (password: string) => Promise<boolean>;
}

const API_BASE = 'https://website.liyifei.dpdns.org/api';

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
