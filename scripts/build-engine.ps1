$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$manifest = Join-Path $root 'engine/Cargo.toml'
$binDir = Join-Path $root 'engine/bin'
$isWindows = ($env:OS -eq 'Windows_NT')
$name = if ($isWindows) { 'agent-compare-engine.exe' } else { 'agent-compare-engine' }

Write-Host "Building Rust engine..."
cargo build --release --manifest-path $manifest
if ($LASTEXITCODE -ne 0) { throw "cargo build failed with exit code $LASTEXITCODE" }

New-Item -ItemType Directory -Force -Path $binDir | Out-Null
$source = Join-Path $root "engine/target/release/$name"
if (-not (Test-Path $source)) { throw "engine binary not found: $source" }
Copy-Item $source (Join-Path $binDir $name) -Force
Write-Host "Installed $name to engine/bin"
