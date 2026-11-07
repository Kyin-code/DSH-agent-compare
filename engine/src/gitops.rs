use std::path::{Path, PathBuf};
use std::process::Command;

use anyhow::{anyhow, Context, Result};

pub fn run_git(repo: &Path, args: &[&str]) -> Result<Vec<u8>> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_OPTIONAL_LOCKS", "0")
        .output()
        .with_context(|| format!("failed to run git in {}", repo.display()))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow!(
            "git {} failed in {}: {}",
            args.join(" "),
            repo.display(),
            stderr.trim()
        ));
    }
    Ok(output.stdout)
}

pub fn repo_root(repo: &Path) -> Result<PathBuf> {
    let output = run_git(repo, &["rev-parse", "--show-toplevel"])?;
    let text = String::from_utf8_lossy(&output).trim().to_string();
    if text.is_empty() {
        return Err(anyhow!("{} is not inside a git repository", repo.display()));
    }
    Ok(PathBuf::from(text))
}

pub fn verify_rev(repo: &Path, base: &str) -> Result<()> {
    run_git(repo, &["rev-parse", "--verify", &format!("{}^{{commit}}", base)])
        .map(|_| ())
        .map_err(|_| anyhow!("git revision not found: {}", base))
}

pub fn branch(repo: &Path) -> String {
    run_git(repo, &["rev-parse", "--abbrev-ref", "HEAD"])
        .map(|bytes| String::from_utf8_lossy(&bytes).trim().to_string())
        .unwrap_or_else(|_| "HEAD".into())
}

pub fn ls_files(repo: &Path) -> Vec<String> {
    let mut out = Vec::new();
    if let Ok(bytes) = run_git(repo, &["ls-files", "-z"]) {
        for chunk in bytes.split(|byte| *byte == 0) {
            if chunk.is_empty() {
                continue;
            }
            out.push(String::from_utf8_lossy(chunk).to_string());
        }
    }
    out
}

pub fn untracked_files(repo: &Path) -> Vec<String> {
    let mut out = Vec::new();
    if let Ok(bytes) = run_git(repo, &["ls-files", "--others", "--exclude-standard", "-z"]) {
        for chunk in bytes.split(|byte| *byte == 0) {
            if chunk.is_empty() {
                continue;
            }
            out.push(String::from_utf8_lossy(chunk).to_string());
        }
    }
    out
}

/// Returns (status, path) pairs from `git diff --name-status --no-renames`.
pub fn changed_files(repo: &Path, base: &str) -> Result<Vec<(String, String)>> {
    let bytes = run_git(
        repo,
        &["diff", "--name-status", "-z", "--no-renames", base, "--"],
    )?;
    let mut tokens: Vec<&[u8]> = bytes.split(|byte| *byte == 0).collect();
    if tokens.last().map(|token| token.is_empty()).unwrap_or(false) {
        tokens.pop();
    }
    let mut out = Vec::new();
    let mut index = 0;
    while index + 1 < tokens.len() {
        let status = String::from_utf8_lossy(tokens[index]).trim().to_string();
        let path = String::from_utf8_lossy(tokens[index + 1]).to_string();
        if !status.is_empty() && !path.is_empty() {
            out.push((status, path));
        }
        index += 2;
    }
    Ok(out)
}

pub fn show_file(repo: &Path, base: &str, path: &str) -> Option<Vec<u8>> {
    let spec = format!("{}:{}", base, path);
    run_git(repo, &["show", &spec]).ok()
}

pub fn working_file(repo: &Path, path: &str) -> Option<Vec<u8>> {
    let full = repo.join(path);
    if full.is_file() {
        std::fs::read(full).ok()
    } else {
        None
    }
}
