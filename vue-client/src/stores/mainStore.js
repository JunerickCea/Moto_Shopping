import { defineStore } from 'pinia';
import api from '../services/api';

// What to do once the login pop-up succeeds (e.g. add the clicked bike to the cart).
// Kept outside the reactive state because it is a function.
let pendingAction = null;

export const useMainStore = defineStore('store', {
  state: () => ({
    user: null,
    ready: false,
    loginDialog: false,
  }),
  getters: {
    isLoggedIn: (state) => state.user !== null,
    isAdmin: (state) => state.user?.role === 'Admin',
  },
  actions: {
    async fetchMe() {
      try {
        const { data } = await api.get('/auth/me');
        this.user = data.user;
      } catch {
        this.user = null;
      } finally {
        this.ready = true;
      }
    },
    setUser(user) {
      this.user = user;
      this.ready = true;
    },
    // Runs `action` now if logged in; otherwise opens the login pop-up and runs it after login.
    requireLogin(action) {
      if (this.user) return action?.();
      pendingAction = action || null;
      this.loginDialog = true;
    },
    completeLogin(user) {
      this.setUser(user);
      this.loginDialog = false;
      const action = pendingAction;
      pendingAction = null;
      action?.();
    },
    cancelLogin() {
      this.loginDialog = false;
      pendingAction = null;
    },
    async logout() {
      try {
        await api.post('/auth/logout');
      } finally {
        this.user = null;
        try {
          localStorage.removeItem('cart');
        } catch {
          // storage unavailable; nothing to clear
        }
      }
    },
  },
});
