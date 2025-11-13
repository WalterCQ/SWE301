<template>
  <svg ref="svgEl" :width="size" :height="size" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path :d="hairBackPath" :fill="hairColor" />
      <circle cx="60" cy="70" r="38" :fill="faceColor" />
      <rect x="30" y="100" width="60" height="30" :fill="bodyColor" rx="8" />
      <circle cx="46" cy="62" r="8" fill="#fff" />
      <circle cx="74" cy="62" r="8" fill="#fff" />
      <path :d="browLeftPath" :stroke="hairColor" stroke-width="2" stroke-linecap="round" fill="none" />
      <path :d="browRightPath" :stroke="hairColor" stroke-width="2" stroke-linecap="round" fill="none" />
      <path :d="nosePath" :stroke="eyeColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <circle :cx="pupilLeft.x" :cy="pupilLeft.y" r="3" :fill="eyeColor" />
      <circle :cx="pupilRight.x" :cy="pupilRight.y" r="3" :fill="eyeColor" />
      <g v-if="hasGlasses" :stroke="accessoryColor" fill="none" stroke-width="1.5">
        <circle cx="46" cy="62" r="9" />
        <circle cx="74" cy="62" r="9" />
        <line x1="55" y1="62" x2="65" y2="62" />
      </g>
      <path :d="mouthPath" :stroke="mouthColor" stroke-width="2" fill="none" stroke-linecap="round" />
      <path v-if="hasBeard" :d="beardPath" :fill="hairColor" opacity="0.85" />
    </g>
  </svg>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  seed: { type: [String, Number], required: true },
  size: { type: Number, default: 160 }
})

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function pick(arr, h, shift) {
  return arr[(Math.floor(h / (shift || 1)) % arr.length + arr.length) % arr.length]
}

const h = computed(() => hashCode(String(props.seed)))
const faceColor = computed(() => pick(['#F9C9B6','#F5D6C6','#FFD5AB','#E7BBAA'], h.value, 7))
const bodyColor = computed(() => pick(['#6366f1','#f59e0b','#10b981','#06b6d4','#ef4444'], h.value, 13))
const hairColor = computed(() => pick(['#0f172a','#1f2937','#334155','#3f3f46'], h.value, 3))
const eyeColor = computed(() => pick(['#111827','#1f2937'], h.value, 11))

const mx = ref(0)
const my = ref(0)
const svgEl = ref(null)
const rect = ref({ left: 0, top: 0, width: 120, height: 140 })

function onMove(e) {
  mx.value = e.clientX
  my.value = e.clientY
}

function updateRect() {
  if (svgEl.value) {
    const r = svgEl.value.getBoundingClientRect()
    rect.value = { left: r.left, top: r.top, width: r.width, height: r.height }
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onMove)
  updateRect()
  window.addEventListener('resize', updateRect)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('resize', updateRect)
})

function eyePupil(cx, cy) {
  const r = rect.value
  const ex = r.left + (cx / 120) * r.width
  const ey = r.top + (cy / 140) * r.height
  const dx = mx.value - ex
  const dy = my.value - ey
  const len = Math.hypot(dx, dy) || 1
  const max = 4
  const nx = cx + (dx / len) * max
  const ny = cy + (dy / len) * max
  return { x: nx, y: ny }
}

const pupilLeft = computed(() => eyePupil(46, 62))
const pupilRight = computed(() => eyePupil(74, 62))

const hairStyle = computed(() => (Math.floor(h.value / 7) % 3))
const mouthStyle = computed(() => (Math.floor(h.value / 11) % 3))
const browTilt = computed(() => (Math.floor(h.value / 13) % 3) - 1)
const hasGlasses = computed(() => (Math.floor(h.value / 17) % 3) === 0)
const hasBeard = computed(() => (Math.floor(h.value / 19) % 4) === 0)
const accessoryColor = computed(() => pick(['#1f2937','#334155','#94a3b8'], h.value, 17))
const mouthColor = computed(() => pick(['#ef4444','#dc2626','#b91c1c','#111827'], h.value, 23))
const hairBackPath = computed(() => {
  const s = hairStyle.value
  if (s === 0) return 'M18,58 C18,28 102,28 102,58 Q102,70 90,76 Q60,90 30,76 Q18,70 18,58Z'
  if (s === 1) return 'M20,60 C25,35 95,35 100,60 Q98,78 60,86 Q22,78 20,60Z'
  return 'M16,62 C22,26 98,26 104,62 L104,72 Q84,84 60,88 Q36,84 16,72Z'
})
const browLeftPath = computed(() => {
  const t = browTilt.value
  const y = 52 - t * 2
  return `M38,${y} Q46,${y-2} 54,${y}`
})
const browRightPath = computed(() => {
  const t = -browTilt.value
  const y = 52 - t * 2
  return `M66,${y} Q74,${y-2} 82,${y}`
})
const nosePath = computed(() => 'M60,66 q-2,6 0,9')
const mouthPath = computed(() => {
  const s = mouthStyle.value
  if (s === 0) return 'M48,84 Q60,90 72,84'
  if (s === 1) return 'M50,84 L70,84'
  return 'M48,86 Q60,80 72,86'
})
const beardPath = computed(() => 'M38,86 Q60,100 82,86 L82,94 Q60,108 38,94Z')
</script>
