#!/usr/bin/env node
// ABOUTME: Interactive setup script for Sticker Dream.
// ABOUTME: Handles certificate generation, API key configuration, and production build.

import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as readline from 'node:readline';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);

process.chdir(projectRoot);

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

function isValidIPv4(ip) {
  if (!IPV4_REGEX.test(ip)) return false;
  // Verify each octet is 0-255
  const octets = ip.split('.').map(Number);
  return octets.every(octet => octet >= 0 && octet <= 255);
}

// Gemini API keys start with "AI" and are typically 39 characters
function isValidGeminiApiKey(key) {
  return typeof key === 'string' && key.startsWith('AI') && key.length >= 30;
}

function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printBanner() {
  console.log('\n' + '═'.repeat(50));
  console.log('  🎨 Sticker Dream Setup');
  console.log('═'.repeat(50) + '\n');
}

function printSection(title) {
  console.log(`\n📦 ${title}...`);
}

async function setup() {
  printBanner();

  // 1. Check for pnpm
  try {
    execFileSync('pnpm', ['--version'], { stdio: 'pipe' });
  } catch {
    console.error('❌ pnpm is required but not installed.');
    console.error('   Install it with: npm install -g pnpm');
    process.exit(1);
  }

  // 2. Install dependencies
  printSection('Installing dependencies');
  const installResult = spawnSync('pnpm', ['install'], { stdio: 'inherit' });
  if (installResult.status !== 0) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }

  // 3. Check for .env
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) {
    printSection('Configuring API key');
    console.log('   No .env file found.\n');

    let apiKey = await question('   Enter your GEMINI_API_KEY (or press Enter to skip): ');
    apiKey = apiKey.trim();

    if (apiKey) {
      let shouldSave = true;
      if (!isValidGeminiApiKey(apiKey)) {
        console.log('   ⚠️  Warning: API key format looks unusual (expected to start with "AI")');
        const confirm = await question('   Save anyway? (y/N): ');
        shouldSave = confirm.toLowerCase() === 'y';
      }
      if (shouldSave) {
        fs.writeFileSync(envPath, `GEMINI_API_KEY=${apiKey}\n`);
        console.log('   ✅ Created .env file');
      } else {
        console.log('   ⚠️  Skipped - create .env manually before running');
      }
    } else {
      console.log('   ⚠️  Skipped - create .env manually before running');
    }
  } else {
    console.log('\n✅ .env file already exists');
  }

  // 4. Generate certificates
  printSection('Generating HTTPS certificates');
  const certsDir = path.join(projectRoot, 'certs');
  const keyPath = path.join(certsDir, 'key.pem');
  const certPath = path.join(certsDir, 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('   ✅ Certificates already exist');
  } else {
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }

    // Get local IP for certificate
    const interfaces = os.networkInterfaces();
    let localIP = '127.0.0.1';
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal && isValidIPv4(iface.address)) {
          localIP = iface.address;
          break;
        }
      }
    }

    const hostname = 'sticker.local';
    const altNames = `DNS:${hostname},DNS:localhost,IP:127.0.0.1,IP:${localIP}`;

    try {
      execFileSync('openssl', [
        'req', '-x509',
        '-newkey', 'rsa:2048',
        '-keyout', keyPath,
        '-out', certPath,
        '-days', '365',
        '-nodes',
        '-subj', `/CN=${hostname}`,
        '-addext', `subjectAltName=${altNames}`,
      ], { stdio: 'pipe' });
      // Restrict private key permissions (owner read/write only)
      fs.chmodSync(keyPath, 0o600);
      console.log(`   ✅ Generated certificates in ${certsDir}`);
      console.log(`   Valid for: localhost, ${localIP}, ${hostname}`);
    } catch (error) {
      console.error('   ❌ Failed to generate certificates');
      console.error('   Make sure openssl is installed');
      process.exit(1);
    }
  }

  // 5. Build for production
  printSection('Building for production');
  const buildResult = spawnSync('pnpm', ['build'], { stdio: 'inherit' });
  if (buildResult.status !== 0) {
    console.error('❌ Build failed');
    process.exit(1);
  }

  // 6. Print success and instructions
  const platform = process.platform;
  const interfaces2 = os.networkInterfaces();
  let localIP2 = '127.0.0.1';
  for (const name of Object.keys(interfaces2)) {
    for (const iface of interfaces2[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal && isValidIPv4(iface.address)) {
        localIP2 = iface.address;
        break;
      }
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('  ✅ Setup complete!');
  console.log('═'.repeat(50));

  console.log('\n📱 Certificate Trust Instructions:\n');

  if (platform === 'darwin') {
    console.log('   macOS (one-time):');
    console.log('   sudo security add-trusted-cert -d -r trustRoot \\');
    console.log('     -k /Library/Keychains/System.keychain certs/cert.pem\n');
  } else {
    console.log('   Linux (one-time):');
    console.log('   sudo cp certs/cert.pem /usr/local/share/ca-certificates/sticker-dream.crt');
    console.log('   sudo update-ca-certificates\n');
  }

  console.log('   iOS devices:');
  console.log(`   1. Start the server: pnpm start`);
  console.log(`   2. On iPad/iPhone, visit: https://${localIP2}:3000/certs/cert.pem`);
  console.log('   3. Install the profile in Settings > General > VPN & Device Management');
  console.log('   4. Trust it in Settings > General > About > Certificate Trust Settings\n');

  console.log('═'.repeat(50));
  console.log('\n🚀 To start Sticker Dream:\n');
  console.log('   pnpm start      # Production mode (recommended)');
  console.log('   pnpm dev        # Development mode\n');
  console.log('═'.repeat(50) + '\n');
}

setup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
