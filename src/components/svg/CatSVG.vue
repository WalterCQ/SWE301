<template>
  <div class="w-full h-full flex items-center justify-center">
    <div ref="svgWrap" class="w-full h-full flex items-center justify-center"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  isError: { type: Boolean, default: false },
  coverEyes: { type: Boolean, default: false },
})

const svgWrap = ref(null)
const svgEl = ref(null)
const leftPupil = ref(null)
const rightPupil = ref(null)
const leftPaw = ref(null)
const rightPaw = ref(null)

const mx = ref(0)
const my = ref(0)
const rect = ref({ left: 0, top: 0, width: 260, height: 260 })
const view = ref({ w: 333.75, h: 234.75 })

let rafId = null
let pendingMouse = null
let resizeObserver = null

const svgAssets = import.meta.glob('../../assets/*.svg', { eager: true, import: 'default' })
function resolveSvgName(name) {
  for (const [k, v] of Object.entries(svgAssets)) {
    if (k.endsWith('/' + name)) return v
  }
  return '/' + name
}

// CAT.svg 的眼睛中心使用相对比例
const CAT_EYE_RATIO = { 
  leftX: 0.32, 
  rightX: 0.61, 
  leftY: 0.325,  // 左眼Y坐标
  rightY: 0.315   // 右眼Y坐标
}

// CATWRONG.svg 的眼睛中心使用相对比例（不同位置）
const CATWRONG_EYE_RATIO = { 
  leftX: 0.35,   // 左眼更靠右
  rightX: 0.585,  // 右眼更靠右
  leftY: 0.385,   // 左眼更低
  rightY: 0.385  // 右眼更低
}
// CAT.svg 的瞳孔和眼球参数
const CAT_PUPIL_RADIUS_X = 8
const CAT_PUPIL_RADIUS_Y = 15
const CAT_EYE_RADIUS_X = 18
const CAT_EYE_RADIUS_Y = 21

// CATWRONG.svg 的瞳孔和眼球参数（不同的样式）
const CATWRONG_PUPIL_RADIUS_X = 9  // 更小的瞳孔
const CATWRONG_PUPIL_RADIUS_Y = 0   // 圆形瞳孔
const CATWRONG_EYE_RADIUS_X = 20  // 圆形眼球半径
const CATWRONG_EYE_RADIUS_Y = 10    // 适中的Y轴运动范围
const MAX_OFFSET = 0

// 猫爪缩放：普通与错误（WRONGCAT）略微更大，便于完全遮眼
const PAW_SCALE_NORMAL = 1.45
const PAW_SCALE_ERROR = 1.55

function getEyeCenters() {
  const w = view.value.w, h = view.value.h
  const eyeRatio = props.isError ? CATWRONG_EYE_RATIO : CAT_EYE_RATIO
  return {
    left: { x: w * eyeRatio.leftX, y: h * eyeRatio.leftY },
    right: { x: w * eyeRatio.rightX, y: h * eyeRatio.rightY },
  }
}

function onMove(e) {
  pendingMouse = { x: e.clientX, y: e.clientY }
  if (rafId == null) {
    rafId = requestAnimationFrame(() => {
      rafId = null
      if (pendingMouse) {
        mx.value = pendingMouse.x
        my.value = pendingMouse.y
        pendingMouse = null
      }
      updatePupils()
    })
  }
}

function updateRect() {
  if (!svgEl.value) return
  const r = svgEl.value.getBoundingClientRect()
  rect.value = { left: r.left, top: r.top, width: r.width, height: r.height }
}

function toSvgCoords(cx, cy) {
  const r = rect.value
  const ex = r.left + (cx / view.value.w) * r.width
  const ey = r.top + (cy / view.value.h) * r.height
  const dx = mx.value - ex
  const dy = my.value - ey
  
  // 根据猫的状态选择相应的眼球参数
  const eyeRadiusX = props.isError ? CATWRONG_EYE_RADIUS_X : CAT_EYE_RADIUS_X
  const eyeRadiusY = props.isError ? CATWRONG_EYE_RADIUS_Y : CAT_EYE_RADIUS_Y
  const pupilRadiusX = props.isError ? CATWRONG_PUPIL_RADIUS_X : CAT_PUPIL_RADIUS_X
  const pupilRadiusY = props.isError ? CATWRONG_PUPIL_RADIUS_Y : CAT_PUPIL_RADIUS_Y
  
  // 计算鼠标方向的角度
  const angle = Math.atan2(dy, dx)
  
  // 计算瞳孔在椭圆形眼球边界内的位置
  // 使用椭圆的参数方程来限制瞳孔移动范围
  const maxDx = (eyeRadiusX - pupilRadiusX) * Math.cos(angle)
  const maxDy = (eyeRadiusY - pupilRadiusY) * Math.sin(angle)
  
  // 计算实际移动距离（不超过眼球边界）
  const distance = Math.sqrt(dx * dx + dy * dy)
  const maxDistance = Math.sqrt(maxDx * maxDx + maxDy * maxDy)
  
  let moveX, moveY
  if (distance <= maxDistance) {
    moveX = dx
    moveY = dy
  } else {
    // 限制在椭圆边界内
    const scale = maxDistance / distance
    moveX = dx * scale
    moveY = dy * scale
  }
  
  return { 
    x: cx + moveX, 
    y: cy + moveY 
  }
}

function ensurePupils() {
  if (!svgEl.value) return
  
  // 根据猫的状态选择瞳孔参数
  const pupilRadiusX = props.isError ? CATWRONG_PUPIL_RADIUS_X : CAT_PUPIL_RADIUS_X
  const pupilRadiusY = props.isError ? CATWRONG_PUPIL_RADIUS_Y : CAT_PUPIL_RADIUS_Y
  const pupilColor = props.isError ? '#ff0000' : '#111827' // 错误状态用红色瞳孔
  
  // 根据猫的状态选择瞳孔形状
  const isWrongCat = props.isError
  const pupilShape = isWrongCat ? 'circle' : 'ellipse'
  
  if (!leftPupil.value) {
    leftPupil.value = document.createElementNS('http://www.w3.org/2000/svg', pupilShape)
    if (isWrongCat) {
      leftPupil.value.setAttribute('r', String(pupilRadiusX)) // 圆形用 r
    } else {
      leftPupil.value.setAttribute('rx', String(pupilRadiusX)) // 椭圆用 rx, ry
      leftPupil.value.setAttribute('ry', String(pupilRadiusY))
    }
    leftPupil.value.setAttribute('fill', pupilColor)
    svgEl.value.appendChild(leftPupil.value)
  } else {
    // 更新现有瞳孔的属性
    if (isWrongCat) {
      leftPupil.value.setAttribute('r', String(pupilRadiusX))
    } else {
      leftPupil.value.setAttribute('rx', String(pupilRadiusX))
      leftPupil.value.setAttribute('ry', String(pupilRadiusY))
    }
    leftPupil.value.setAttribute('fill', pupilColor)
  }
  
  if (!rightPupil.value) {
    rightPupil.value = document.createElementNS('http://www.w3.org/2000/svg', pupilShape)
    if (isWrongCat) {
      rightPupil.value.setAttribute('r', String(pupilRadiusX)) // 圆形用 r
    } else {
      rightPupil.value.setAttribute('rx', String(pupilRadiusX)) // 椭圆用 rx, ry
      rightPupil.value.setAttribute('ry', String(pupilRadiusY))
    }
    rightPupil.value.setAttribute('fill', pupilColor)
    svgEl.value.appendChild(rightPupil.value)
  } else {
    // 更新现有瞳孔的属性
    if (isWrongCat) {
      rightPupil.value.setAttribute('r', String(pupilRadiusX))
    } else {
      rightPupil.value.setAttribute('rx', String(pupilRadiusX))
      rightPupil.value.setAttribute('ry', String(pupilRadiusY))
    }
    rightPupil.value.setAttribute('fill', pupilColor)
  }
}

function ensureDefs() {
  if (!svgEl.value) return
  const ns = 'http://www.w3.org/2000/svg'
  let defs = svgEl.value.querySelector('defs')
  if (!defs) {
    defs = document.createElementNS(ns, 'defs')
    svgEl.value.insertBefore(defs, svgEl.value.firstChild)
  }

  // 渐变：掌心与趾豆（#bfa06f 色系）
  if (!svgEl.value.querySelector('#catPalmGrad')) {
    const g1 = document.createElementNS(ns, 'linearGradient')
    g1.setAttribute('id', 'catPalmGrad')
    g1.setAttribute('x1', '0')
    g1.setAttribute('y1', '0')
    g1.setAttribute('x2', '0')
    g1.setAttribute('y2', '1')
    const s1 = document.createElementNS(ns, 'stop')
    s1.setAttribute('offset', '0%')
    s1.setAttribute('stop-color', '#d7c49a')
    const s2 = document.createElementNS(ns, 'stop')
    s2.setAttribute('offset', '100%')
    s2.setAttribute('stop-color', '#bfa06f')
    g1.appendChild(s1)
    g1.appendChild(s2)
    defs.appendChild(g1)
  }

  if (!svgEl.value.querySelector('#catToeGrad')) {
    const g2 = document.createElementNS(ns, 'linearGradient')
    g2.setAttribute('id', 'catToeGrad')
    g2.setAttribute('x1', '0')
    g2.setAttribute('y1', '0')
    g2.setAttribute('x2', '0')
    g2.setAttribute('y2', '1')
    const t1 = document.createElementNS(ns, 'stop')
    t1.setAttribute('offset', '0%')
    t1.setAttribute('stop-color', '#e6d8af')
    const t2 = document.createElementNS(ns, 'stop')
    t2.setAttribute('offset', '100%')
    t2.setAttribute('stop-color', '#c7a469')
    g2.appendChild(t1)
    g2.appendChild(t2)
    defs.appendChild(g2)
  }

  // 猫爪符号（更圆润的掌心 + 四个趾豆，无爪尖）
  if (!svgEl.value.querySelector('#catPaw')) {
    const g = document.createElementNS(ns, 'g')
    g.setAttribute('id', 'catPaw')
    // 掌心（偏椭圆的心形豆）
    const palm = document.createElementNS(ns, 'path')
    palm.setAttribute('d', 'M -18 10 C -16 -4 -7 -10 0 -10 C 7 -10 16 -4 18 10 C 19 18 10 24 0 24 C -10 24 -19 18 -18 10 Z')
    palm.setAttribute('fill', 'url(#catPalmGrad)')
    palm.setAttribute('stroke', '#8b6e3f')
    palm.setAttribute('stroke-opacity', '.35')
    palm.setAttribute('stroke-width', '0.9')
    palm.setAttribute('stroke-linejoin', 'round')
    g.appendChild(palm)

    // 四个趾豆
    const toes = [
      { x: -11, y: -9, rx: 6.5, ry: 7.5 },
      { x: -3, y: -12, rx: 7.0, ry: 8.0 },
      { x: 3, y: -12, rx: 7.0, ry: 8.0 },
      { x: 11, y: -9, rx: 6.5, ry: 7.5 },
    ]
    toes.forEach(pos => {
      const toe = document.createElementNS(ns, 'ellipse')
      toe.setAttribute('cx', String(pos.x))
      toe.setAttribute('cy', String(pos.y))
      toe.setAttribute('rx', String(pos.rx))
      toe.setAttribute('ry', String(pos.ry))
      toe.setAttribute('fill', 'url(#catToeGrad)')
      toe.setAttribute('stroke', '#8b6e3f')
      toe.setAttribute('stroke-opacity', '.28')
      toe.setAttribute('stroke-width', '0.7')
      g.appendChild(toe)
    })

    // 轻微高光
    const shine = document.createElementNS(ns, 'path')
    shine.setAttribute('d', 'M -8 12 C -4 9 4 9 8 12')
    shine.setAttribute('fill', 'none')
    shine.setAttribute('stroke', '#ffffff')
    shine.setAttribute('stroke-opacity', '.45')
    shine.setAttribute('stroke-width', '1')
    shine.setAttribute('stroke-linecap', 'round')
    g.appendChild(shine)

    defs.appendChild(g)
  }
}

function buildPawGroup(cx, cy, flipX = false, originX = cx, originY = cy + 10, scale = PAW_SCALE_NORMAL) {
  const ns = 'http://www.w3.org/2000/svg'
  const outer = document.createElementNS(ns, 'g')
  outer.setAttribute('pointer-events', 'none')
  outer.style.transformBox = 'fill-box'
  outer.style.transformOrigin = `${originX}px ${originY}px`
  outer.style.transition = 'transform 200ms ease, opacity 200ms ease'
  outer.style.opacity = '0'

  // 分层：先位移到目标坐标，再按需翻转+放大，避免缩放影响 translate 距离
  const translateG = document.createElementNS(ns, 'g')
  translateG.setAttribute('transform', `translate(${cx} ${cy})`)

  const scaleG = document.createElementNS(ns, 'g')
  const sx = (flipX ? -1 : 1) * scale
  const sy = scale
  scaleG.setAttribute('transform', `scale(${sx}, ${sy})`)

  const use = document.createElementNS(ns, 'use')
  // 同时设置 xlink:href 与 href 以兼容不同实现
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#catPaw')
  use.setAttribute('href', '#catPaw')
  scaleG.appendChild(use)
  translateG.appendChild(scaleG)
  outer.appendChild(translateG)
  return outer
}

function updatePaws() {
  if (!svgEl.value) return
  ensureDefs()

  const centers = getEyeCenters()
  const lcx = centers.left.x, lcy = centers.left.y
  const rcx = centers.right.x, rcy = centers.right.y
  const yOffset = props.isError ? 4 : 0
  const scale = props.isError ? PAW_SCALE_ERROR : PAW_SCALE_NORMAL

  if (!leftPaw.value) {
    leftPaw.value = buildPawGroup(lcx, lcy + yOffset, false, lcx, lcy + 10 + yOffset, scale)
    svgEl.value.appendChild(leftPaw.value)
  }
  if (!rightPaw.value) {
    rightPaw.value = buildPawGroup(rcx, rcy + yOffset, true, rcx, rcy + 10 + yOffset, scale)
    svgEl.value.appendChild(rightPaw.value)
  }

  if (props.coverEyes) {
    leftPaw.value.style.opacity = '1'
    leftPaw.value.style.transform = 'translateY(0px) rotate(2deg)'
    rightPaw.value.style.opacity = '1'
    rightPaw.value.style.transform = 'translateY(0px) rotate(-2deg)'
  } else {
    leftPaw.value.style.opacity = '0'
    leftPaw.value.style.transform = 'translateY(-10px) rotate(-2deg)'
    rightPaw.value.style.opacity = '0'
    rightPaw.value.style.transform = 'translateY(-10px) rotate(2deg)'
  }
}

function updatePupils() {
  if (!svgEl.value) return
  ensurePupils()
  const centers = getEyeCenters()
  const l = toSvgCoords(centers.left.x, centers.left.y)
  const r = toSvgCoords(centers.right.x, centers.right.y)
  leftPupil.value.setAttribute('cx', String(l.x))
  leftPupil.value.setAttribute('cy', String(l.y))
  rightPupil.value.setAttribute('cx', String(r.x))
  rightPupil.value.setAttribute('cy', String(r.y))
}

async function loadSvg() {
  const url = props.isError ? resolveSvgName('CATWRONG.svg') : resolveSvgName('CAT.svg')
  const res = await fetch(url)
  const text = await res.text()
  if (!svgWrap.value) return
  svgWrap.value.innerHTML = text
  await nextTick()
  svgEl.value = svgWrap.value.querySelector('svg')
  if (!svgEl.value) return
  const vb = svgEl.value.getAttribute('viewBox') || ''
  const parts = vb.trim().split(/\s+/)
  if (parts.length === 4) {
    view.value = { w: parseFloat(parts[2]) || view.value.w, h: parseFloat(parts[3]) || view.value.h }
  }
  leftPupil.value = null
  rightPupil.value = null
  leftPaw.value = null
  rightPaw.value = null
  updateRect()
  updatePupils()
}

onMounted(() => {
  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('resize', updateRect)
  loadSvg()
  if (window && 'ResizeObserver' in window && svgWrap.value) {
    resizeObserver = new ResizeObserver(() => updateRect())
    resizeObserver.observe(svgWrap.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('resize', updateRect)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})

watch(() => props.isError, loadSvg)
watch(() => props.coverEyes, updatePaws)
</script>

<style scoped>
svg {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}
</style>
