import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'
import pinia from './store'
import { useAuthStore } from './store/auth'

const app = createApp(App)
app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia)
if (auth.token && !auth.user) {
  auth.fetchUser().finally(() => {
    app.mount('#app')
  })
} else {
  app.mount('#app')
}
