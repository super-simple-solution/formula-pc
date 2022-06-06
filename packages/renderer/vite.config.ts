import { defineConfig } from 'vite'
import resolve, { lib2esm } from 'vite-plugin-resolve'
import electron from 'vite-plugin-electron/renderer'
import pkg from '../../package.json'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import eslintPlugin from 'vite-plugin-eslint'
import vueJsx from '@vitejs/plugin-vue-jsx'

const envStr = 'test'

const evnPath = `${envStr}`

const pathMap = {
  online: '',
  test: evnPath,
  pre: evnPath,
}

export default defineConfig({
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, './src')}/`,
    },
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
    strictPort: false,
    proxy: {
      '/buscustomized': {
        target: pathMap[envStr],
        rewrite: (path) => path.replace(/^\/buscustomized/, '/customized_busd/buscustomized/'),
        changeOrigin: true,
        ws: true,
      },
    },
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    vue(),
    electron(),
    vueJsx(),
    Components({
      dts: true,
      dirs: ['src/components'],
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
      ],
    }),
    createSvgIconsPlugin({
      // Specify the icon folder to be cached
      iconDirs: [path.resolve(process.cwd(), 'src/icons')],
      // Specify symbolId format
      symbolId: 'icon-[dir]-[name]',
    }),
    eslintPlugin(),
    AutoImport({
      // targets to transform
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
        /\.json$/, // .json
      ],
      // global imports to register
      imports: [
        // presets
        'vue',
      ],
      eslintrc: {
        enabled: true, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },
      resolvers: [() => null],
      dts: './auto-imports.d.ts',
    }),
    resolve(
      /**
       * Here you can specify other modules
       * 🚧 You have to make sure that your module is in `dependencies` and not in the` devDependencies`,
       *    which will ensure that the electron-builder can package it correctly
       */
      {
        // If you use the following modules, the following configuration will work
        // What they have in common is that they will return - ESM format code snippets

        // ESM format string
        'electron-store': 'export default require("electron-store");',
        // Use lib2esm() to easy to convert ESM
        // Equivalent to
        /**
         * sqlite3: () => `
         * const _M_ = require('sqlite3');
         * const _D_ = _M_.default || _M_;
         * export { _D_ as default }
         * `
         */
        sqlite3: lib2esm('sqlite3', { format: 'cjs' }),
        serialport: lib2esm(
          // CJS lib name
          'serialport',
          // export memebers
          [
            'SerialPort',
            'SerialPortMock',
          ],
          { format: 'cjs' },
        ),
      }
    ),
  ],
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
  },
})
