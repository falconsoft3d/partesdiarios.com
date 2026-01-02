const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Esto permite el build incluso con errores de TypeScript
    ignoreBuildErrors: true,
  },
  // Configuración para Next.js 16 con Turbopack
  turbopack: {},
};

module.exports = withPWA(nextConfig);
