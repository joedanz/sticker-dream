// ABOUTME: Network utilities for local IP discovery and QR code generation.
// ABOUTME: Enables easy device discovery on local networks without DNS configuration.

import * as os from 'node:os';

export function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export function getServerURLs(port: number): { local: string; network: string } {
  const ip = getLocalIP();
  return {
    local: `https://localhost:${port}`,
    network: `https://${ip}:${port}`,
  };
}

// Simple QR code generator for terminal display
// Uses Unicode block characters to create a scannable QR in the console
export async function generateTerminalQR(text: string): Promise<string> {
  // Dynamic import to handle the optional dependency
  try {
    const { default: QRCode } = await import('qrcode');
    return QRCode.toString(text, {
      type: 'terminal',
      small: true,
      margin: 1,
    });
  } catch {
    // Fallback if qrcode isn't installed
    return `[QR code unavailable - install 'qrcode' package]\nURL: ${text}`;
  }
}

// Generate QR as data URL for embedding in HTML
export async function generateQRDataURL(text: string): Promise<string | null> {
  try {
    const { default: QRCode } = await import('qrcode');
    return QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch {
    return null;
  }
}

// Print startup banner with connection info
export async function printStartupBanner(port: number): Promise<void> {
  const urls = getServerURLs(port);

  console.log('\n' + '═'.repeat(50));
  console.log('  🎨 Sticker Dream');
  console.log('═'.repeat(50));
  console.log(`\n  Local:   ${urls.local}`);
  console.log(`  Network: ${urls.network}`);
  console.log('\n  Scan this QR code with your phone/tablet:\n');

  const qr = await generateTerminalQR(urls.network);
  console.log(qr);

  console.log('═'.repeat(50));
  console.log('  First time on iOS? Visit:');
  console.log(`  ${urls.network}/certs/cert.pem`);
  console.log('  to download and trust the certificate.');
  console.log('═'.repeat(50) + '\n');
}
