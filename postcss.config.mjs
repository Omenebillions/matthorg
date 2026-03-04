// postcss.config.mjs
import autoprefixer from 'autoprefixer';

export default {
  plugins: {
    '@tailwindcss/postcss': {},  // ✅ make sure it's exactly like this
    autoprefixer: {},
  },
};