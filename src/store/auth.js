import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem('user') || 'null'),
    token: sessionStorage.getItem('authToken'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    username: (state) => (state.user && state.user.username) ? state.user.username : 'Guest',
    fullUser: (state) => state.user,
  },
  actions: {
    async register(payload) {
      await api.post('/register', payload)
    },
    async login(payload) {
      const res = await api.post('/login', payload)
      this.user = res.user
      this.token = res.token
      sessionStorage.setItem('authToken', res.token)
      sessionStorage.setItem('user', JSON.stringify(res.user))
    },
    async fetchUser() {
      if (this.token && !this.user) {
        try {
          const user = await api.get('/me', { headers: { Authorization: `Bearer ${this.token}` } })
          this.user = user
          sessionStorage.setItem('user', JSON.stringify(user))
        } catch (e) {
          this.logout()
        }
      }
    },
    async deleteAccount() {
      try {
        await api.post('/delete-account', {}, { headers: { Authorization: `Bearer ${this.token}` } })
      } finally {
        this.logout()
      }
    },
    logout() {
      this.user = null
      this.token = null
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('user')
    },
  },
})
