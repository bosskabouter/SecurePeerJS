import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/guide/features.html#webassembly
import wasm from 'vite-plugin-wasm'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

import topLevelAwait from 'vite-plugin-top-level-await'

import rollupNodePolyFill from 'rollup-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: false,
          buffer: true
        }),
        NodeModulesPolyfillPlugin()
      ]
      //, target: "es2020"
    }
  },
  build: {
    minify: false,
    rollupOptions: {
      plugins: [
        // Enable rollup polyfills plugin
        // used during production bundling
        rollupNodePolyFill()
      ]
    }
  }

})
