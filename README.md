# Private Key Manager

A CLI tool for generating Solana keypairs and converting between private key formats. This project provides utilities to generate new Solana wallets and convert between base58 encoded private keys and wallet byte arrays.

## Features

- Generate new Solana keypairs
- Convert private keys from base58 to wallet byte array format
- Convert wallet byte arrays to base58 private keys

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

## Development

This project uses Rust and Cargo for dependency management. All functionality is implemented as test functions that can be run individually using `cargo test` with the `--nocapture` flag to see output.

> [!IMPORTANT]  
> Keep your private keys secure and never share them. This tool is for development and testing purposes.
