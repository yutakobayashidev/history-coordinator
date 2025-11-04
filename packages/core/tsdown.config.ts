import { defineConfig } from 'tsdown';

export default defineConfig({
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    entry: ['src/index.ts', '!src/**/*.spec.*', '!src/**/*.d.ts'],
    external: ['react'],
    unbundle: true,
});