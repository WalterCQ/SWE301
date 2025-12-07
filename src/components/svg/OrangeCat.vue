<template>
  <div class="w-full h-full flex items-center justify-center">
    <svg ref="svgEl" width="260" height="260" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g>
        <ellipse cx="100" cy="168" rx="46" ry="26" fill="#fbbf24" opacity="0"/>
        <rect x="66" y="136" width="16" height="34" rx="8" fill="#fbbf24" opacity="0"/>
        <rect x="118" y="136" width="16" height="34" rx="8" fill="#fbbf24" opacity="0"/>
        <ellipse cx="74" cy="172" rx="12" ry="8" fill="#fbbf24" opacity="0"/>
        <ellipse cx="126" cy="172" rx="12" ry="8" fill="#fbbf24" opacity="0"/>
        <path d="M70 158q30 14 60 0" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" opacity="0" fill="none"/>
        <path d="M66 166q34 14 68 0" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" opacity="0" fill="none"/>
        <path d="M62 174q38 14 76 0" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" opacity="0" fill="none"/>
        <path d="M68 140q8 3 14 0" stroke="#f59e0b" stroke-width="3" opacity="0" fill="none" stroke-linecap="round"/>
        <path d="M68 148q8 3 14 0" stroke="#f59e0b" stroke-width="3" opacity="0" fill="none" stroke-linecap="round"/>
        <path d="M68 156q8 3 14 0" stroke="#f59e0b" stroke-width="3" opacity="0" fill="none" stroke-linecap="round"/>
        <path d="M68 164q8 3 14 0" stroke="#f59e0b" stroke-width="3" opacity="0" fill="none" stroke-linecap="round"/>
        <path d="M118 140q8 3 14 0" stroke="#f59e0b" stroke-width="3" opacity="0" fill="none" stroke-linecap="round"/>
        <path d="M118 148q8 3 14 0" stroke="#f59e0b" stroke-width="3" opacity="0" fill="none" stroke-linecap="round"/>
        <path d="M118 156q8 3 14 0" stroke="#f59e0b" stroke-width="3" opacity="0" fill="none" stroke-linecap="round"/>
        <path d="M118 164q8 3 14 0" stroke="#f59e0b" stroke-width="3" opacity="0" fill="none" stroke-linecap="round"/>
        <ellipse cx="100" cy="95" rx="66" ry="56" fill="#fbbf24" />
        <ellipse cx="76" cy="62" rx="7" ry="5" fill="#fbbf24" />
        <ellipse cx="76" cy="64" rx="5" ry="3" fill="#f59e0b" opacity=".35"/>
        <ellipse cx="124" cy="62" rx="7" ry="5" fill="#fbbf24" />
        <ellipse cx="124" cy="64" rx="5" ry="3" fill="#f59e0b" opacity=".35"/>
        <path d="M100 58l-8 12h16z" fill="#f59e0b"/>
        <path d="M83 67l-10 7 12 6z" fill="#f59e0b"/>
        <path d="M117 67l10 7-12 6z" fill="#f59e0b"/>
        <ellipse cx="75" cy="120" rx="22" ry="15" fill="#fde68a" opacity=".55"/>
        <ellipse cx="125" cy="120" rx="22" ry="15" fill="#fde68a" opacity=".55"/>
        <ellipse cx="78" cy="95" rx="16" ry="14" fill="#fff" />
        <ellipse cx="122" cy="95" rx="16" ry="14" fill="#fff" />
        <circle :cx="pupilLeft.x" :cy="pupilLeft.y" r="7" fill="#111827" />
        <circle :cx="pupilRight.x" :cy="pupilRight.y" r="7" fill="#111827" />
        <ellipse cx="100" cy="118" rx="18" ry="12" fill="#fde68a" opacity=".8"/>
        <path d="M100 112l-7 8h14z" fill="#a16207"/>
        <path d="M100 120v6" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M84 126q16 10 32 0" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M66 128q10 6 18 0" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" opacity=".35" fill="none"/>
        <path d="M66 134q10 6 18 0" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" opacity=".3" fill="none"/>
        <path d="M134 128q-10 6 -18 0" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" opacity=".35" fill="none"/>
        <path d="M134 134q-10 6 -18 0" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" opacity=".3" fill="none"/>
        <path d="M48 112q24 -6 48 0" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity=".9" fill="none"/>
        <path d="M48 118q24 -4 48 0" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity=".9" fill="none"/>
        <path d="M48 124q24 -2 48 0" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity=".9" fill="none"/>
        <path d="M152 112q-24 -6 -48 0" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity=".9" fill="none"/>
        <path d="M152 118q-24 -4 -48 0" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity=".9" fill="none"/>
        <path d="M152 124q-24 -2 -48 0" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity=".9" fill="none"/>
        <g :class="cover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'" class="transition-all duration-300">
          <ellipse cx="64" cy="80" rx="14" ry="10" fill="#fbbf24" />
          <circle cx="54" cy="75" r="4" fill="#fbbf24" />
          <circle cx="64" cy="72" r="4" fill="#fbbf24" />
          <circle cx="74" cy="75" r="4" fill="#fbbf24" />
          <ellipse cx="136" cy="80" rx="14" ry="10" fill="#fbbf24" />
          <circle cx="126" cy="75" r="4" fill="#fbbf24" />
          <circle cx="136" cy="72" r="4" fill="#fbbf24" />
          <circle cx="146" cy="75" r="4" fill="#fbbf24" />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'

const props = defineProps({ cover: { type: Boolean, default: false } })

const mx = ref(0)
const my = ref(0)
const svgEl = ref(null)
const rect = ref({ left: 0, top: 0, width: 260, height: 260 })

function onMove(e) {
  mx.value = e.clientX
  my.value = e.clientY
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

function updateRect() {
  if (svgEl.value) {
    const r = svgEl.value.getBoundingClientRect()
    rect.value = { left: r.left, top: r.top, width: r.width, height: r.height }
  }
}

function eyePupil(cx, cy) {
  const r = rect.value
  const ex = r.left + (cx / 200) * r.width
  const ey = r.top + (cy / 200) * r.height
  const dx = mx.value - ex
  const dy = my.value - ey
  const len = Math.hypot(dx, dy) || 1
  const max = 8
  const nx = cx + (dx / len) * max
  const ny = cy + (dy / len) * max
  return { x: nx, y: ny }
}

const pupilLeft = computed(() => eyePupil(78, 95))
const pupilRight = computed(() => eyePupil(122, 95))
const cover = computed(() => props.cover)
</script>
