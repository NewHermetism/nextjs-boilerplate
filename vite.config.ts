import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'path';
import { Alias } from 'vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgrPlugin from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

const aliasWithIndex = (name: string): Alias[] => [
  {
    find: new RegExp(`^${name}$`),
    replacement: resolve(__dirname, `src/${name}/index.ts`)
  },
  {
    find: new RegExp(`^${name}/`),
    replacement: `${resolve(__dirname, `src/${name}`)}/`
  }
];

const aliasDirOnly = (name: string): Alias[] => [
  {
    find: new RegExp(`^${name}/`),
    replacement: `${resolve(__dirname, `src/${name}`)}/`
  }
];

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
    host: true,
    https: true,
    watch: {
      usePolling: false,
      useFsEvents: false
    },
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    basicSsl(),
    tsconfigPaths(),
    svgrPlugin(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true }
    })
  ],
  resolve: {
    alias: [
      ...aliasDirOnly('assets'),
      ...aliasWithIndex('components'),
      ...aliasWithIndex('config'),
      ...aliasDirOnly('games'),
      ...aliasWithIndex('helpers'),
      ...aliasWithIndex('hooks'),
      ...aliasWithIndex('localConstants'),
      ...aliasWithIndex('pages'),
      ...aliasWithIndex('routes'),
      ...aliasWithIndex('services'),
      ...aliasDirOnly('styles'),
      ...aliasWithIndex('types'),
      ...aliasWithIndex('utils'),
      ...aliasWithIndex('wrappers')
    ]
  },
  build: {
    outDir: 'build'
  },
  preview: {
    port: 3002,
    https: true,
    host: 'localhost',
    strictPort: true
  }
});
