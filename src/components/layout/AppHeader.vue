<template>
  <header class="w-full flex items-center justify-between px-6 h-16 bg-white shadow">
    <div class="text-lg font-semibold">MySecureApp</div>
    <div class="flex items-center gap-4">
      <div class="text-gray-700">Welcome, {{ username }}!</div>
      <button class="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 active:scale-95" @click="onLogout">
        Logout
      </button>
    </div>
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../store/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const { username } = storeToRefs(auth)
const router = useRouter()

function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>
