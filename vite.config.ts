import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // Relative base so the same build works at user.github.io/dealer/ or any other path.
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    preact(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      injectManifest: {
        // offers.json is fetched and cached by the app itself (IndexedDB).
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        globIgnores: ['data/**'],
      },
      manifest: {
        name: 'dealer – промоции',
        short_name: 'dealer',
        description: 'Промоциите от Kaufland, Lidl и Billa на едно място.',
        lang: 'bg',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0E1012',
        theme_color: '#0E1012',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
