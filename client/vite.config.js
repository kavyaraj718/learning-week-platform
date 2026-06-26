import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, /api and /socket.io are proxied to the Express server so
// the frontend can use same-origin relative URLs.
// PROXY_TARGET lets Docker point the proxy at the `server` service; locally it
// defaults to localhost:5000.
const target = process.env.PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0 so it works inside containers
    port: 5173,
    proxy: {
      '/api': { target, changeOrigin: true },
      '/socket.io': { target, ws: true },
    },
  },
});
