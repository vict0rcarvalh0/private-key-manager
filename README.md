# Private Key Manager

A comprehensive tool for managing Solana private keys with both a web interface and CLI tool. Convert between Base58 and Byte Array formats securely, with all processing happening locally in your browser or on your machine.

# Web Application

A modern, client-side web application that runs entirely in your browser:

- **Secure**: All conversions happen locally - no data is sent to servers
- **Modern UI**: Clean, responsive interface with real-time conversion
- **Base58 ↔ Byte Array**: Convert between both formats seamlessly
- **Copy to Clipboard**: Easy copying of results
- **Security Warning**: Clear notices about key safety

### Features
- Convert Base58 private keys to byte arrays `[123, 45, 67, ...]`
- Convert byte arrays to Base58 private keys
- Real-time validation and error handling
- Copy results to clipboard with one click
- Responsive design for desktop and mobile

## CLI Tool

A Rust-based command-line tool for advanced users and automation:

### Features
- Generate new Solana keypairs
- Convert private keys from base58 to wallet byte array format
- Convert wallet byte arrays to base58 private keys

## Getting Started

### Web Application

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### CLI Tool

## Usage

### Generate a New Keypair

Generate a new Solana wallet and display the keypair information:

```bash
cargo test keygen -- --nocapture
```

This will:
- Create a new Solana keypair
- Display the public key
- Show the private key as a byte array that can be saved to a JSON file

### Convert Base58 to Wallet Format

Convert a base58 encoded private key to wallet byte array format:

```bash
cargo test base58_to_wallet -- --nocapture
```

This will:
- Prompt you to input your private key in base58 format
- Convert it to a wallet byte array
- Display the result as a byte array

### Convert Wallet to Base58

Convert a wallet byte array to base58 encoded private key:

```bash
cargo test wallet_to_base58 -- --nocapture
```

This will:
- Prompt you to input your private key as a wallet byte array (comma-separated numbers)
- Convert it to base58 format
- Display the base58 encoded private key

## Security

> [!IMPORTANT]  
> **Your private keys are never stored or transmitted anywhere.** All conversions happen locally in your browser (web app) or on your machine (CLI). Keep your private keys secure and never share them.
