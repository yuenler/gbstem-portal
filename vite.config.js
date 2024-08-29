import { sveltekit } from '@sveltejs/kit/vite'
import dotenv from 'dotenv'
import { defineConfig } from 'vite'

dotenv.config();

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [sveltekit()],
  define: {
    'process.env.CLIENT_ID': JSON.stringify(process.env.CLIENT_ID),
    'process.env.CLIENT_SECRET': JSON.stringify(process.env.CLIENT_SECRET)
  }
});