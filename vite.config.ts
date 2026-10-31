import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 4444,
    // Port band bo‘lsa boshqasiga O‘TMAYDI: backend'dagi CORS ro‘yxati va
    // deploy sozlamalari aynan shu portga tayangan, «tasodifan boshqa
    // portda ochildi» holati esa sabab topish qiyin bo‘lgan xato beradi.
    strictPort: true,
    // ⚠️ Proksi ataylab: frontend API'ni `/api/v1/...` deb chaqiradi va
    // `VITE_API_URL` sozlanmagan bo‘lsa ham ishlaydi. Shu tufayli CORS
    // muammosi dev rejimida umuman tug‘ilmaydi.
    proxy: {
      '/api': { target: 'http://localhost:3333', changeOrigin: true },
    },
  },
  // `npm run preview` — qurilgan natijani SHU portda ko‘rsatadi.
  preview: {
    port: 4444,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:3333', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Og‘ir kutubxonalar alohida bo‘lakka chiqariladi: xarita va
        // diagramma har sahifada kerak emas, ularni birga yuklash
        // birinchi ochilish vaqtini sezilarli uzaytirardi.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'react';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('leaflet')) return 'map';
          return 'vendor';
        },
      },
    },
  },
});
