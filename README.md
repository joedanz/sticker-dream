# Sticker Dream

![](./dream.png)

A voice-activated sticker printer. Press and hold the button, describe what you want, and it generates a black and white coloring page sticker that prints to a thermal printer.

## How it works

1. Hold the button and speak (max 15 seconds)
2. Whisper transcribes your voice
3. Google Imagen generates a coloring page based on your description
4. Image displays in browser and prints to USB thermal printer

## Quick Start

Run the interactive setup:

```bash
pnpm quickstart
```

This will:
- Install dependencies
- Prompt for your Gemini API key
- Generate HTTPS certificates for local network access
- Build for production

Then start the server:

```bash
pnpm start
```

Scan the QR code shown in the terminal to access from your phone or tablet.

## Setup Details

### Requirements

- Node.js 20.6.0 or later
- pnpm 9.10.0 or later
- OpenSSL (for certificate generation)

### API Key

You'll need a [Google AI Studio](https://aistudio.google.com/) API key with access to Imagen. The setup script will prompt you, or create a `.env` file manually:

```
GEMINI_API_KEY=your_api_key_here
```

### Mobile Device Access (iOS/Android)

The app uses HTTPS so your phone's microphone works over the local network. On first use:

1. Start the server: `pnpm start`
2. On your device, visit the HTTP certificate URL shown in the terminal (e.g., `http://192.168.1.x:3080`)
3. **iOS**: Install the profile in Settings > General > VPN & Device Management, then trust it in Settings > General > About > Certificate Trust Settings
4. **Android**: Install from Settings > Security > Install from storage

After trusting the certificate, access the app at the HTTPS network URL (e.g., `https://192.168.1.x:3000`).

### macOS Certificate Trust (Optional)

To avoid browser warnings on your Mac:

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain certs/cert.pem
```

## Running

### Production Mode (Recommended)

```bash
pnpm start
```

Serves the built frontend and API over HTTPS on port 3000.

### Development Mode

```bash
pnpm dev
```

Runs the backend server and Vite dev server with hot reload.

## Docker

For always-on deployment (e.g., Raspberry Pi):

```bash
docker compose up -d
```

**Linux users**: To enable printing, uncomment the CUPS socket mount in `docker-compose.yml`:

```yaml
- /var/run/cups:/var/run/cups:ro
```

## Printers

TLDR: [The Phomemo](https://amzn.to/4hOmqki) PM2 will work great over bluetooth or USB.

While any printer will work, I'm using a 4x6 thermal printer with 4x6 shipping labels. These printers are fast, cheap and don't require ink.

Theoretically a bluetooth printer will work as well, but I have not tested. I'd love to get this working with these cheap Niimbot / Bluetooth "Cat printer", though those labels are plastic and not colour-able.

## Tips

The image prints right away, which is magical. Sometimes you can goof up. In this case, simply say "CANCEL", "ABORT" or "START OVER" as part of your recording.

## Certificate Renewal

Certificates are valid for 365 days and auto-renew when they're within 30 days of expiration. You can regenerate manually by deleting the `certs/` folder and running `pnpm quickstart` again.

## Ideas

It would be great if this was more portable. The app has 2 pieces: Client and Server. The TTS happens on the client. The Gemini API calls and printing happens on the server.

The server does not do anything computationally expensive - just API calls -, so it could theoretically be run on Raspberry PI or an ESP32, which may require re-writing in C++. The server also sends the data to the printer - so there would need to be drivers or use a lower level protocol use ESC/POS.

It could not be run 100% on an iphone browser as WebSerial / Web USB isn't supported on Safari. Perhaps it could as a react native app?
