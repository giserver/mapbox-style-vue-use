import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: 'MSVU',
      fileName: 'index',
    },
  },
  plugins: [vue(), dts()]
})
