#!/usr/bin/env bash
set -e

# Install rustup (non-interactive)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Add Cargo (Rust) to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Use the stable toolchain
rustup default stable

# Upgrade pip & wheel tools
python -m pip install --upgrade pip setuptools wheel

# Install Python dependencies
python -m pip install -r requirements.txt
