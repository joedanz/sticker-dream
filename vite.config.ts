// ABOUTME: Vite configuration for Sticker Dream frontend.
// ABOUTME: Supports HTTPS dev mode when certificates are available.

import { defineConfig } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';

const certsDir = path.join(process.cwd(), 'certs');
const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

export default defineConfig(({ command }) => {
  // Check if certs exist for HTTPS support
  const certsExist = fs.existsSync(keyPath) && fs.existsSync(certPath);
  const useHttps = command === 'serve' && certsExist;

  return {
    server: {
      port: 7767,
      host: true,
      allowedHosts: ['sticker.local'],
      https: useHttps ? {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      } : undefined,
      proxy: {
        '/api': {
          target: useHttps ? 'https://localhost:3000' : 'http://localhost:3000',
          changeOrigin: true,
          secure: false, // Accept self-signed certificates
        },
        '/certs': {
          target: useHttps ? 'https://localhost:3000' : 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});

