import path from 'path'
import vue from '@vitejs/plugin-vue'
import { UserConfig } from 'vite'

export default {
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(process.cwd(), './vue-tiny-validator.ts'),
      name: 'TinyValidator',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
} as UserConfig
