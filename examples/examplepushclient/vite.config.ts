import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    // https://vite-pwa-org.netlify.app/guide/
    VitePWA({
      filename: 'sw.ts',
      injectRegister: 'inline',
      srcDir: 'src',
      strategies: 'injectManifest',

      devOptions: {
        type: 'module',
        enabled: true
      },

      manifest: {
        name: 'My App',
        short_name: 'My App',
        icons: [
          // {
          //   src: '/img/icons/android-chrome-192x192.png',
          //   sizes: '192x192',
          //   type: 'image/png'
          // },
          // {
          //   src: '/img/icons/android-chrome-512x512.png',
          //   sizes: '512x512',
          //   type: 'image/png'
          // }
        ],
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone'
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost\//,
            handler: 'NetworkFirst'
          }
        ]
      }
    })]
})
