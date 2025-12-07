<template>
  <div class="w-screen h-screen overflow-hidden flex">
    <div class="w-1/2 h-full bg-orange-100 flex items-center justify-center">
      <CatSVG :is-error="hasError" :cover-eyes="showCatPaw" />
    </div>
    <div class="w-1/2 h-full bg-white flex items-center justify-center">
      <div class="w-full max-w-md px-8">
        <h1 class="text-2xl font-semibold mb-6 text-gray-900">Welcome Back!</h1>
        <div v-if="apiError" class="mb-4 text-red-600">{{ apiError }}</div>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Email or Username</label>
            <input type="text" v-model.trim="email" @blur="validateEmail" autocomplete="off-typo" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <div v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Password</label>
            <div class="relative">
              <input 
                ref="passwordField"
                :type="showPassword ? 'text' : 'password'" 
                v-model="password" 
                @blur="validatePassword" 
                @focus="onPasswordFocus"
                @blur.capture="onPasswordBlur"
                :class="['w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400', password.length > 0 ? 'pr-10' : '']" 
              />
              <button v-if="password.length > 0" type="button" @click="showPassword = !showPassword" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10">
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
            </div>
            <div v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</div>
          </div>
          <button :disabled="!canSubmit || loading" class="w-full py-2 rounded text-white bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 flex items-center justify-center gap-2">
            <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
          </button>
        </form>
        <div class="mt-4 text-sm text-gray-600">
          Don't have an account? <router-link to="/register" class="text-orange-600 hover:underline">Sign up</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import CatSVG from '../components/svg/CatSVG.vue'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const showCatPaw = ref(false)
const passwordField = ref(null)
const emailError = ref('')
const passwordError = ref('')
const apiError = ref('')
const loading = ref(false)

const hasError = computed(() => !!apiError.value)

function onPasswordFocus() {
  showCatPaw.value = true
}

function onPasswordBlur() {
  setTimeout(() => {
    showCatPaw.value = false
    validatePassword()
  }, 200)
}

function validateEmail() {
  emailError.value = email.value ? '' : 'Please enter your email or username.'
}

function validatePassword() {
  passwordError.value = password.value ? '' : 'Please enter your password.'
}

const canSubmit = computed(() => !!email.value && !!password.value && !emailError.value && !passwordError.value)

async function onSubmit() {
  validateEmail(); validatePassword()
  if (!canSubmit.value) return
  apiError.value = ''
  loading.value = true
  try {
    await auth.login({ identifier: email.value, password: password.value })
    router.push('/')
  } catch (e) {
    if (e && e.status === 401) apiError.value = 'Invalid email or password.'
    else apiError.value = 'Login failed. Please try again later.'
  } finally {
    loading.value = false
  }
}
</script>
