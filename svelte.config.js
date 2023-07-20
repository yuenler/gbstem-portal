import { vitePreprocess } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-cloudflare';


/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: true,
      strict: true
    })
  },
  preprocess: vitePreprocess()
}

export default config
