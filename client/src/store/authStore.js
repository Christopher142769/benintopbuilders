import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { setAccessToken, setSessionHandler } from '../lib/api';

export const useAuthStore = create(
  persist(
    (set) => ({
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
    }),
    {
      name: 'btb-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        setAccessToken(state?.accessToken || null);
      },
    }
  )
);

setSessionHandler((user, token) => {
  if (user && token) {
    useAuthStore.getState().setSession(user, token);
  } else {
    useAuthStore.getState().clearSession();
  }
});
