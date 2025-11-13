<template>
  <div class="relative">
    <div class="bg-white px-4 py-3 rounded-lg shadow text-gray-800 text-sm">
      <div>User ID: {{ user?.id }}</div>
      <div>Username: {{ user?.username }}</div>
      <div>Email: {{ user?.email }}</div>
    </div>
    <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  user: { type: Object, default: null }
})
</script>
