#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cargo build --release --manifest-path "$root/engine/Cargo.toml"
mkdir -p "$root/engine/bin"
cp "$root/engine/target/release/agent-compare-engine" "$root/engine/bin/agent-compare-engine"
echo "Installed agent-compare-engine to engine/bin"
