<template>
  <div class="w-screen h-screen overflow-hidden flex">
    <div class="w-1/2 h-full bg-gray-800 flex items-center justify-center">
      <GreyWolf :cover="coverEyes" />
    </div>
    <div class="w-1/2 h-full bg-white flex items-center justify-center">
      <div class="w-full max-w-md px-8">
        <h1 class="text-2xl font-semibold mb-6 text-gray-900">Create your Account</h1>
        <div v-if="apiError" class="mb-4 text-red-600">{{ apiError }}</div>
        <div v-if="successMessage" class="mb-4 text-green-600">{{ successMessage }}</div>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Username</label>
            <input type="text" v-model.trim="username" @blur="validateUsername" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-700" />
            <div v-if="usernameError" class="mt-1 text-sm text-red-600">{{ usernameError }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Email</label>
            <div class="flex gap-2">
              <input type="email" v-model.trim="email" @blur="validateEmail" class="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-700" />
              <button type="button"
                      @click="onSendCode"
                      :disabled="sendLoading || !!emailError || !email || cooldown > 0"
                      class="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 min-w-[120px]">
                <span v-if="sendLoading" class="w-4 h-4 inline-block align-[-2px] border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span v-else>{{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Code' }}</span>
              </button>
            </div>
            <div v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</div>
            <div v-if="sendSuccess" class="mt-1 text-sm text-green-600">Verification code sent.</div>
            <div v-if="sendError" class="mt-1 text-sm text-red-600">{{ sendError }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Verification Code</label>
            <input type="text" v-model.trim="code" @input="validateCode" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-700" />
            <div v-if="codeError" class="mt-1 text-sm text-red-600">{{ codeError }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Password</label>
            <div class="relative">
              <input :type="showPassword ? 'text' : 'password'" v-model="password" @input="validatePassword" @focus="onPassFocus" @blur="onPassBlur" :class="['w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-700', password.length > 0 ? 'pr-10' : '']" />
              <button v-if="password.length > 0" type="button" @click="showPassword = !showPassword" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
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
          <div>
            <label class="block text-sm text-gray-700 mb-1">Confirm Password</label>
            <div class="relative">
              <input :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" @input="validateConfirm" @focus="onPassFocus" @blur="onPassBlur" :class="['w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-700', confirmPassword.length > 0 ? 'pr-10' : '']" />
              <button v-if="confirmPassword.length > 0" type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
            </div>
            <div v-if="confirmError" class="mt-1 text-sm text-red-600">{{ confirmError }}</div>
          </div>
          <button :disabled="!canSubmit || loading" class="w-full py-2 rounded text-white bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 flex items-center justify-center gap-2">
            <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ loading ? 'Creating...' : 'Create Account' }}</span>
          </button>
        </form>
        <div class="mt-4 text-sm text-gray-600">
          Already have an account? <router-link to="/login" class="text-gray-800 hover:underline">Sign in</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import GreyWolf from '../components/svg/GreyWolf.vue'
import api from '../services/api'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const code = ref('')

const usernameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const confirmError = ref('')
const codeError = ref('')
const apiError = ref('')
const successMessage = ref('')
const loading = ref(false)
const sendLoading = ref(false)
const sendSuccess = ref(false)
const sendError = ref('')
const cooldown = ref(0)
let cooldownTimer = null

function validateUsername() {
  usernameError.value = username.value ? '' : 'Username cannot be empty.'
}

function validateEmail() {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  emailError.value = email.value && re.test(email.value) ? '' : 'Please enter a valid email address.'
}

function validatePassword() {
  const v = password.value
  const strong = v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[!@#$%^&*]/.test(v)
  passwordError.value = strong ? '' : 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
  validateConfirm()
}

function validateConfirm() {
  confirmError.value = confirmPassword.value && confirmPassword.value === password.value ? '' : 'Passwords do not match.'
}

function validateCode() {
  const re = /^\d{6}$/
  codeError.value = code.value && re.test(code.value) ? '' : 'Please enter the 6-digit verification code.'
}

const canSubmit = computed(() => !usernameError.value && !emailError.value && !passwordError.value && !confirmError.value && !codeError.value && username.value && email.value && password.value && confirmPassword.value && code.value)

const focusing = ref(0)
const coverEyes = computed(() => focusing.value > 0)
function onPassFocus() { focusing.value++ }
function onPassBlur() { focusing.value = Math.max(0, focusing.value - 1) }

async function onSubmit() {
  validateUsername(); validateEmail(); validatePassword(); validateConfirm(); validateCode()
  if (!canSubmit.value) return
  apiError.value = ''
  loading.value = true
  try {
    await auth.register({ username: username.value, email: email.value, password: password.value, code: code.value })
    username.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    code.value = ''
    usernameError.value = ''
    emailError.value = ''
    passwordError.value = ''
    confirmError.value = ''
    codeError.value = ''
    successMessage.value = 'Account created successfully! Please sign in.'
    setTimeout(() => router.push('/login'), 1000)
  } catch (e) {
    if (e && e.status === 409) apiError.value = 'Email already exists.'
    else if (e && e.status === 400) {
      const msg = String(e.message || '').toLowerCase()
      apiError.value = msg.includes('expired') ? 'Verification code expired.' : 'Invalid verification code.'
    }
    else apiError.value = 'Registration failed. Please try again later.'
  } finally {
    loading.value = false
  }
}

async function onSendCode() {
  validateEmail()
  if (emailError.value) return
  sendLoading.value = true
  sendSuccess.value = false
  sendError.value = ''
  try {
    await api.post('/send-code', { email: email.value })
    sendSuccess.value = true
    startCooldown(60)
  } catch (e) {
    if (e && e.status === 400) sendError.value = 'Please enter a valid email address.'
    else if (e && e.status === 429) {
      const sec = Number(e.retryAfter || 60)
      sendError.value = `Please wait ${sec}s before requesting a new code.`
      startCooldown(sec)
    }
    else sendError.value = 'Failed to send code. Please try again later.'
  } finally {
    sendLoading.value = false
  }
}

function startCooldown(sec) {
  clearInterval(cooldownTimer)
  cooldown.value = Math.max(0, Math.floor(sec))
  if (cooldown.value > 0) {
    cooldownTimer = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
      }
    }, 1000)
  }
}

onBeforeUnmount(() => {
  clearInterval(cooldownTimer)
})
</script>
