import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset,
  images: ['public/icons/logo.svg', 'public-dev/icons/logo.svg'],
});
