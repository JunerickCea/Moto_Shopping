import { defineStore } from 'pinia';
import api from '../services/api';

export const useMainStore = defineStore('store', {
  state: () => ({
    user: null,
    ready: false,
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
