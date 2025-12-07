import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(async () => {
  const plugins = [vue()]
  try {
    const { default: compression } = await import('vite-plugin-compression')
    plugins.push(compression({ algorithm: 'brotliCompress' }))
  } catch {}
  return {
    plugins,
    build: {
      target: 'es2018',
      minify: 'esbuild',
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
          },
        },
      },
    },
    esbuild: { drop: ['console', 'debugger'] },
  }
})
