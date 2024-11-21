import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: 'maplugin',
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'vue', 
        'maplibre-gl', 
        'mapbox-gl', 
        'proj4', 
        '@mapbox/mapbox-gl-draw',
        '@turf/boolean-clockwise',
        '@turf/center']
    }
  },
  plugins: [vue(), dts({ include: ['../maplugin-core', "./"], exclude: ['demo'] })]
})
