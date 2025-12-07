<template>
  <div class="w-screen h-screen flex flex-col animated-bg" :style="bgVars">
    <div class="relative z-10 flex flex-col flex-1">
      <AppHeader />
      <main class="relative flex-1 overflow-hidden">
        <div class="absolute left-1/2 -translate-x-1/2" style="bottom: 40%;">
          <SpeechBubble :user="user" />
        </div>
        <div class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-4" style="bottom: 15%;">
          <GenerativeAvatar v-if="user" :seed="user.id" :size="160" />
          <button 
            @click="onDeleteAccount"
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="deleting" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            {{ deleting ? 'Deleting...' : 'Delete Account' }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import AppHeader from '../components/layout/AppHeader.vue'
import SpeechBubble from '../components/ui/SpeechBubble.vue'
import GenerativeAvatar from '../components/avatar/GenerativeAvatar.vue'

const auth = useAuthStore()
const router = useRouter()
const user = computed(() => auth.fullUser)
const deleting = ref(false)

onMounted(() => {
  if (auth.token && !auth.user) auth.fetchUser()
})

async function onDeleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
  
  deleting.value = true
  try {
    await auth.deleteAccount()
  } catch (error) {
    alert('Failed to delete account: ' + (error.message || 'Unknown error'))
  } finally {
    deleting.value = false
    router.replace('/login')
  }
}

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function hslToRgb(h, s, l) {
  h = h % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (0 <= h && h < 60) { r = c; g = x; b = 0 }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0 }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const R = Math.round((r + m) * 255)
  const G = Math.round((g + m) * 255)
  const B = Math.round((b + m) * 255)
  return { r: R, g: G, b: B }
}

function rgbaStr({ r, g, b }, a = 1) { return `rgba(${r}, ${g}, ${b}, ${a})` }

const bgVars = computed(() => {
  const id = user.value?.id || 'guest'
  const base = hashCode(id)
  // 使用更邻近的色相并降低饱和度/提高亮度，整体更柔和
  const baseHue = base % 360
  const offsets = [-24, -12, 0, 12, 24]
  const colors = offsets.map((off) => hslToRgb(baseHue + off, 0.5, 0.62))
  const alpha = 0.85
  return {
    '--c1': rgbaStr(colors[0], alpha),
    '--c2': rgbaStr(colors[1], alpha),
    '--c3': rgbaStr(colors[2], alpha),
    '--c4': rgbaStr(colors[3], alpha),
    '--c5': rgbaStr(colors[4], alpha),
  }
})
</script>
