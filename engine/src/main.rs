mod diff;
mod gitops;
mod model;
mod scan;
mod symbols;

use std::collections::HashMap;
use std::path::PathBuf;

use anyhow::{anyhow, Result};
use serde_json::json;

use crate::model::{DiffResult, FileEntry, Project, ScanResult, Stats};
use crate::scan::ScanOptions;

struct Flags {
    values: HashMap<String, String>,
}

impl Flags {
    fn parse(args: &[String]) -> Result<Self> {
        let mut values = HashMap::new();
        let mut index = 0;
        while index < args.len() {
            let arg = &args[index];
            if let Some(rest) = arg.strip_prefix("--") {
                if let Some((key, value)) = rest.split_once('=') {
                    values.insert(key.to_string(), value.to_string());
                } else if index + 1 < args.len() && !args[index + 1].starts_with("--") {
                    values.insert(rest.to_string(), args[index + 1].clone());
                    index += 1;
                } else {
                    values.insert(rest.to_string(), "true".to_string());
                }
            } else {
                return Err(anyhow!("unexpected argument: {}", arg));
            }
            index += 1;
        }
        Ok(Self { values })
    }

    fn get(&self, key: &str) -> Option<&str> {
        self.values.get(key).map(|value| value.as_str())
    }

    fn path(&self, key: &str) -> Option<PathBuf> {
        self.get(key).map(PathBuf::from)
    }

    fn max_file_bytes(&self) -> u64 {
        self.get("max-file-bytes")
            .and_then(|value| value.parse::<u64>().ok())
            .unwrap_or(2 * 1024 * 1024)
    }
}

fn scan_options(flags: &Flags) -> ScanOptions {
    ScanOptions {
        mode: flags.get("mode").unwrap_or("folders").to_string(),
        left: flags.path("left"),
        right: flags.path("right"),
        repo: flags.path("repo"),
        base: flags.get("base").unwrap_or("HEAD").to_string(),
        max_file_bytes: flags.max_file_bytes(),
    }
}

fn binary_diff(path: &str, status: &str, left_exists: bool, right_exists: bool) -> DiffResult {
    DiffResult {
        ok: true,
        path: path.to_string(),
        status: status.to_string(),
        language: symbols::language_for(path).to_string(),
        binary: true,
        left_exists,
        right_exists,
        left_text: String::new(),
        right_text: String::new(),
        blocks: Vec::new(),
        added: 0,
        deleted: 0,
        risk: Vec::new(),
        symbols_added: Vec::new(),
        symbols_removed: Vec::new(),
        truncated: false,
    }
}

fn status_for(left_exists: bool, right_exists: bool) -> &'static str {
    match (left_exists, right_exists) {
        (true, false) => "removed",
        (false, true) => "added",
        _ => "modified",
    }
}

fn run_diff(flags: &Flags) -> Result<DiffResult> {
    let mode = flags.get("mode").unwrap_or("folders");
    let max_file_bytes = flags.max_file_bytes();
    match mode {
        "folders" | "files" => {
            let left_path = flags
                .path("left")
                .ok_or_else(|| anyhow!("--left is required"))?;
            let right_path = flags
                .path("right")
                .ok_or_else(|| anyhow!("--right is required"))?;
            let left_exists = left_path.is_file();
            let right_exists = right_path.is_file();
            if !left_exists && !right_exists {
                return Err(anyhow!("neither side exists"));
            }
            let name = right_path
                .file_name()
                .or_else(|| left_path.file_name())
                .map(|value| value.to_string_lossy().to_string())
                .unwrap_or_else(|| "file".into());
            let left_bytes = if left_exists { std::fs::read(&left_path).ok() } else { None };
            let right_bytes = if right_exists { std::fs::read(&right_path).ok() } else { None };
            if left_bytes.as_ref().map(|bytes| symbols::is_binary(&name, bytes)).unwrap_or(false)
                || right_bytes
                    .as_ref()
                    .map(|bytes| symbols::is_binary(&name, bytes))
                    .unwrap_or(false)
            {
                return Ok(binary_diff(&name, status_for(left_exists, right_exists), left_exists, right_exists));
            }
            if left_bytes.as_ref().map(|bytes| bytes.len() as u64).unwrap_or(0) > max_file_bytes
                || right_bytes.as_ref().map(|bytes| bytes.len() as u64).unwrap_or(0) > max_file_bytes
            {
                let mut result = binary_diff(&name, status_for(left_exists, right_exists), left_exists, right_exists);
                result.binary = false;
                result.truncated = true;
                return Ok(result);
            }
            let old = left_bytes
                .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
                .unwrap_or_default();
            let new = right_bytes
                .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
                .unwrap_or_default();
            Ok(diff::build(
                &name,
                status_for(left_exists, right_exists),
                symbols::language_for(&name),
                &old,
                &new,
                left_exists,
                right_exists,
            ))
        }
        "git" => {
            let repo_input = flags.path("repo").ok_or_else(|| anyhow!("--repo is required"))?;
            let root = gitops::repo_root(&repo_input)?;
            let base = flags.get("base").unwrap_or("HEAD");
            gitops::verify_rev(&root, base)?;
            let path = flags.get("path").ok_or_else(|| anyhow!("--path is required"))?;
            let left_bytes = gitops::show_file(&root, base, path);
            let right_bytes = gitops::working_file(&root, path);
            let left_exists = left_bytes.is_some();
            let right_exists = right_bytes.is_some();
            if !left_exists && !right_exists {
                return Err(anyhow!("path not found in either revision: {}", path));
            }
            if left_bytes.as_ref().map(|bytes| symbols::is_binary(path, bytes)).unwrap_or(false)
                || right_bytes
                    .as_ref()
                    .map(|bytes| symbols::is_binary(path, bytes))
                    .unwrap_or(false)
            {
                return Ok(binary_diff(path, status_for(left_exists, right_exists), left_exists, right_exists));
            }
            let old = left_bytes
                .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
                .unwrap_or_default();
            let new = right_bytes
                .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
                .unwrap_or_default();
            Ok(diff::build(
                path,
                status_for(left_exists, right_exists),
                symbols::language_for(path),
                &old,
                &new,
                left_exists,
                right_exists,
            ))
        }
        other => Err(anyhow!("unknown diff mode: {}", other)),
    }
}

fn run_scan(flags: &Flags) -> Result<ScanResult> {
    scan::scan(&scan_options(flags))
}

fn print_json<T: serde::Serialize>(value: &T) -> Result<()> {
    println!("{}", serde_json::to_string(value)?);
    Ok(())
}

fn run() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty() {
        print_json(&json!({
            "ok": false,
            "error": "usage: agent-compare-engine <scan|diff|version> [--key value ...]"
        }))?;
        return Ok(());
    }
    let command = args[0].clone();
    let flags = Flags::parse(&args[1..])?;
    match command.as_str() {
        "scan" => {
            let result = run_scan(&flags)?;
            print_json(&result)
        }
        "diff" => {
            let result = run_diff(&flags)?;
            print_json(&result)
        }
        "version" => print_json(&json!({
            "ok": true,
            "version": env!("CARGO_PKG_VERSION"),
            "engine": "agent-compare-engine",
            "platform": std::env::consts::OS
        })),
        other => Err(anyhow!("unknown command: {}", other)),
    }
}

fn main() {
    if let Err(error) = run() {
        let _ = print_json(&json!({ "ok": false, "error": error.to_string() }));
        std::process::exit(1);
    }
}

// Keep these referenced so the model file's helper types remain part of the
// binary's public surface while the client-facing schema evolves.
#[allow(dead_code)]
fn _unused(_: FileEntry, _: Project, _: Stats) {}
