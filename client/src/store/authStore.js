import { create } from 'zustand';
import { setAccessToken } from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, accessToken });
  },
  clearSession: () => {
    setAccessToken(null);
    set({ user: null, accessToken: null });
  },
}));
