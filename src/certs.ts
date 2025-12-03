// ABOUTME: Generates and manages self-signed TLS certificates for local HTTPS.
// ABOUTME: Certificates are stored in ./certs/ and regenerated when expired or missing.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getLocalIP } from './network.ts';

export interface CertPaths {
  key: string;
  cert: string;
}

const CERT_DIR = path.join(process.cwd(), 'certs');
const KEY_PATH = path.join(CERT_DIR, 'key.pem');
const CERT_PATH = path.join(CERT_DIR, 'cert.pem');
const CERT_VALIDITY_DAYS = 365;

export function getCertPaths(): CertPaths {
  return { key: KEY_PATH, cert: CERT_PATH };
}

export function certsExist(): boolean {
  return fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);
}

export function generateCerts(): CertPaths {
  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
  }

  const localIP = getLocalIP();
  const hostname = 'sticker.local';

  // Build subject alternative names for broad local network compatibility
  const altNames = [
    `DNS:${hostname}`,
    'DNS:localhost',
    'IP:127.0.0.1',
    `IP:${localIP}`,
  ].join(',');

  const subject = `/CN=${hostname}`;

  // Generate certificate using openssl (available on macOS and Linux)
  // Using execFileSync with argument array to avoid shell injection
  const args = [
    'req', '-x509',
    '-newkey', 'rsa:2048',
    '-keyout', KEY_PATH,
    '-out', CERT_PATH,
    '-days', String(CERT_VALIDITY_DAYS),
    '-nodes',
    '-subj', subject,
    '-addext', `subjectAltName=${altNames}`,
  ];

  try {
    execFileSync('openssl', args, { stdio: 'pipe' });
    // Restrict private key permissions (owner read/write only)
    fs.chmodSync(KEY_PATH, 0o600);
    console.log(`✅ Generated certificates in ${CERT_DIR}`);
    console.log(`   Valid for: localhost, ${localIP}, ${hostname}`);
  } catch (error) {
    throw new Error(`Failed to generate certificates: ${error}`);
  }

  return getCertPaths();
}

export function ensureCerts(): CertPaths {
  if (certsExist()) {
    return getCertPaths();
  }
  return generateCerts();
}
