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
    rollupOptions:{
      external: ['vue', 'maplibre-gl', 'mapbox-gl', '@turf/center', 'proj4']
    }
  },
  plugins: [vue(), dts()]
})
