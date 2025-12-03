// ABOUTME: Network utilities for local IP discovery and QR code generation.
// ABOUTME: Enables easy device discovery on local networks without DNS configuration.

import * as os from 'node:os';

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

function isValidIPv4(ip: string): boolean {
  if (!IPV4_REGEX.test(ip)) return false;
  const octets = ip.split('.').map(Number);
  return octets.every(octet => octet >= 0 && octet <= 255);
}

export function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal (loopback), non-IPv4, and invalid addresses
      if (iface.family === 'IPv4' && !iface.internal && isValidIPv4(iface.address)) {
        return iface.address;
      }
    }
  }
  console.warn('⚠️  No network interface found - remote access will not work');
  console.warn('   Connect to a network and restart for device access');
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
export async function printStartupBanner(port: number, certHttpPort?: number): Promise<void> {
  const urls = getServerURLs(port);
  const ip = getLocalIP();

  console.log('\n' + '═'.repeat(50));
  console.log('  🎨 Sticker Dream');
  console.log('═'.repeat(50));
  console.log(`\n  Local:   ${urls.local}`);
  console.log(`  Network: ${urls.network}`);
  console.log('\n  Scan this QR code with your phone/tablet:\n');

  const qr = await generateTerminalQR(urls.network);
  console.log(qr);

  if (certHttpPort) {
    console.log('═'.repeat(50));
    console.log('  📱 First time on iOS/Android?');
    console.log(`  1. Visit: http://${ip}:${certHttpPort}`);
    console.log('  2. iOS: Settings > General > VPN & Device Management');
    console.log('  3. Tap the profile and tap Install');
    console.log(`  4. Then access: ${urls.network}`);
    console.log('═'.repeat(50) + '\n');
  }
}
