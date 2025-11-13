<template>
  <div class="w-full h-full flex items-center justify-center">
    <svg ref="svgEl" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="w-full h-auto max-w-[450px]">
      <defs>
        <linearGradient id="furGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4b5563"/>
          <stop offset="100%" stop-color="#9ca3af"/>
        </linearGradient>
        <linearGradient id="muzzleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f3f4f6"/>
          <stop offset="100%" stop-color="#e5e7eb"/>
        </linearGradient>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#525a65"/>
          <stop offset="100%" stop-color="#9aa3ad"/>
        </linearGradient>
        <linearGradient id="pawGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#aeb6bf"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
        <clipPath id="eyeClipLeft">
          <ellipse cx="80" cy="90" rx="13" ry="9" />
        </clipPath>
        <clipPath id="eyeClipRight">
          <ellipse cx="120" cy="90" rx="13" ry="9" />
        </clipPath>
        <g id="wolfPaw">
          <path d="M -16 12 C -14 0 -6 -6 0 -6 C 6 -6 14 0 16 12 C 17 20 10 24 0 24 C -10 24 -17 20 -16 12 Z" fill="url(#pawGrad)" stroke="#6b7280" stroke-opacity=".45" stroke-width="0.8" stroke-linejoin="round" />
          <ellipse cx="-10" cy="-8" rx="6.2" ry="7" fill="url(#pawGrad)" stroke="#6b7280" stroke-opacity=".38" stroke-width="0.6" />
          <ellipse cx="-3" cy="-10" rx="6.4" ry="7.6" fill="url(#pawGrad)" stroke="#6b7280" stroke-opacity=".38" stroke-width="0.6" />
          <ellipse cx="3" cy="-10" rx="6.4" ry="7.6" fill="url(#pawGrad)" stroke="#6b7280" stroke-opacity=".38" stroke-width="0.6" />
          <ellipse cx="10" cy="-8" rx="6.2" ry="7" fill="url(#pawGrad)" stroke="#6b7280" stroke-opacity=".38" stroke-width="0.6" />
          <path d="M -12 -16 L -10 -23 L -8 -16 Z" fill="#374151" />
          <path d="M -4 -18 L -2 -25 L 0 -18 Z" fill="#374151" />
          <path d="M 2 -18 L 4 -25 L 6 -18 Z" fill="#374151" />
          <path d="M 8 -16 L 10 -23 L 12 -16 Z" fill="#374151" />
          <path d="M -7 14 C -3 11 3 11 7 14" fill="none" stroke="#e5e7eb" stroke-opacity=".45" stroke-width="1" stroke-linecap="round" />
        </g>
      </defs>
      <g>
        <polygon points="58,58 74,22 90,64" fill="#6b7280" />
        <polygon points="142,58 126,22 110,64" fill="#6b7280" />
        <polygon points="64,60 74,38 84,62" fill="#9ca3af" />
        <polygon points="136,60 126,38 116,62" fill="#9ca3af" />
        <ellipse cx="100" cy="108" rx="68" ry="62" fill="url(#furGrad)" />
        <ellipse cx="72" cy="120" rx="26" ry="22" fill="#d1d5db" opacity=".85"/>
        <ellipse cx="128" cy="120" rx="26" ry="22" fill="#d1d5db" opacity=".85"/>
        <ellipse cx="100" cy="126" rx="34" ry="24" fill="url(#muzzleGrad)" />
        <ellipse cx="80" cy="90" rx="13" ry="9" fill="#fff" />
        <ellipse cx="120" cy="90" rx="13" ry="9" fill="#fff" />
        <ellipse cx="80" cy="90" rx="11" ry="8" fill="none" stroke="#6b7280" stroke-width="1.5" opacity=".6"/>
        <ellipse cx="120" cy="90" rx="11" ry="8" fill="none" stroke="#6b7280" stroke-width="1.5" opacity=".6"/>
        <circle :cx="pupilLeft.x" :cy="pupilLeft.y" r="5" fill="#111827" />
        <circle :cx="pupilRight.x" :cy="pupilRight.y" r="5" fill="#111827" />
        <path d="M86 132q14 10 28 0" stroke="#4b5563" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M65 84q15-10 30-2" stroke="#1f2937" stroke-width="2" stroke-linecap="round" opacity=".6" fill="none"/>
        <path d="M135 84q-15-10-30-2" stroke="#1f2937" stroke-width="2" stroke-linecap="round" opacity=".6" fill="none"/>
        <path d="M100 118l-8 12h16z" fill="#111827"/>

        <g pointer-events="none" :class="cover ? 'opacity-100 translate-y-0 rotate-2' : 'opacity-0 -translate-y-10 -rotate-2'" class="transform transition-transform duration-200 will-change-transform motion-reduce:transition-none" style="transform-box: fill-box; transform-origin: 87px 102px;">
          <g transform="translate(77 94)">
            <use href="#wolfPaw" />
          </g>
        </g>

        <g pointer-events="none" :class="cover ? 'opacity-100 translate-y-0 -rotate-2' : 'opacity-0 -translate-y-10 rotate-2'" class="transform transition-transform duration-200 will-change-transform motion-reduce:transition-none" style="transform-box: fill-box; transform-origin: 113px 102px;">
          <g transform="translate(123 92) scale(-1,1)">
            <use href="#wolfPaw" />
          </g>
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
const reduced = ref(false)

let scheduled = false
let lastX = 0
let lastY = 0
let rafId = 0
let resizeObs = null
let mediaQuery = null
let onMQ = null

function onPointerMove(e) {
  lastX = e.clientX
  lastY = e.clientY
  if (!scheduled) {
    scheduled = true
    rafId = requestAnimationFrame(() => {
      mx.value = lastX
      my.value = lastY
      scheduled = false
    })
  }
}

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = !!mediaQuery.matches
  onMQ = (e) => { reduced.value = !!e.matches }
  if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onMQ)
  else if (mediaQuery.addListener) mediaQuery.addListener(onMQ)

  if (!reduced.value) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
  }
  updateRect()
  window.addEventListener('resize', updateRect)
  if (svgEl.value && 'ResizeObserver' in window) {
    resizeObs = new ResizeObserver(() => updateRect())
    resizeObs.observe(svgEl.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('resize', updateRect)
  if (resizeObs) {
    resizeObs.disconnect()
    resizeObs = null
  }
  if (rafId) cancelAnimationFrame(rafId)
  if (mediaQuery) {
    if (mediaQuery.removeEventListener && onMQ) mediaQuery.removeEventListener('change', onMQ)
    // Older Safari
    else if (mediaQuery.removeListener && onMQ) mediaQuery.removeListener(onMQ)
  }
})

function updateRect() {
  if (svgEl.value) {
    const r = svgEl.value.getBoundingClientRect()
    rect.value = { left: r.left, top: r.top, width: r.width, height: r.height }
  }
}

function eyePupil(cx, cy) {
  if (reduced.value) return { x: cx, y: cy }
  const r = rect.value
  const ex = r.left + (cx / 200) * r.width
  const ey = r.top + (cy / 200) * r.height
  const dx = mx.value - ex
  const dy = my.value - ey
  const len = Math.hypot(dx, dy) || 1
  const max = 4
  const nx = cx + (dx / len) * max
  const ny = cy + (dy / len) * max
  return { x: nx, y: ny }
}

const pupilLeft = computed(() => eyePupil(80, 90))
const pupilRight = computed(() => eyePupil(120, 90))
const cover = computed(() => props.cover)
</script>
