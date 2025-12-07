import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { pinia } from '../store'

const LoginPage = () => import('../views/LoginPage.vue')
const RegisterPage = () => import('../views/RegisterPage.vue')
const HomePage = () => import('../views/HomePage.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: LoginPage },
    { path: '/register', name: 'Register', component: RegisterPage },
    { path: '/', name: 'Home', component: HomePage, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore(pinia)
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' }
  }
  if ((to.path === '/login' || to.path === '/register') && auth.isAuthenticated) {
    return { path: '/' }
  }
  return true
})

export default router
