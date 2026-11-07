use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{anyhow, Context, Result};
use walkdir::WalkDir;

use crate::diff;
use crate::gitops;
use crate::model::{FileEntry, GitInfo, LangStat, Project, ScanResult, Stats};
use crate::symbols;

const MAX_FILES: usize = 20_000;
const MAX_GIT_FILES: usize = 1_500;

pub struct ScanOptions {
    pub mode: String,
    pub left: Option<PathBuf>,
    pub right: Option<PathBuf>,
    pub repo: Option<PathBuf>,
    pub base: String,
    pub max_file_bytes: u64,
}

struct TreeFile {
    path: PathBuf,
    size: u64,
}

struct Loaded {
    size: Option<u64>,
    text: Option<String>,
    binary: bool,
    oversized: bool,
}

fn ignored_dir(name: &str) -> bool {
    matches!(
        name,
        ".git"
            | ".svn"
            | ".hg"
            | "node_modules"
            | "target"
            | "dist"
            | "build"
            | "out"
            | ".next"
            | ".nuxt"
            | ".idea"
            | ".vscode"
            | "__pycache__"
            | ".venv"
            | "venv"
            | ".tox"
            | ".gradle"
            | ".mypy_cache"
            | ".pytest_cache"
            | "coverage"
            | ".DS_Store"
    )
}

fn collect_tree(root: &Path) -> Result<(BTreeMap<String, TreeFile>, bool, Vec<String>)> {
    if !root.exists() {
        return Err(anyhow!("path does not exist: {}", root.display()));
    }
    if root.is_file() {
        let mut map = BTreeMap::new();
        let name = root
            .file_name()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_else(|| root.display().to_string());
        map.insert(
            name,
            TreeFile {
                path: root.to_path_buf(),
                size: fs::metadata(root).map(|meta| meta.len()).unwrap_or(0),
            },
        );
        return Ok((map, false, Vec::new()));
    }

    let mut map = BTreeMap::new();
    let mut notes = Vec::new();
    let mut truncated = false;
    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|entry| {
            if entry.depth() == 0 {
                return true;
            }
            if entry.file_type().is_dir() {
                !ignored_dir(&entry.file_name().to_string_lossy())
            } else {
                true
            }
        })
    {
        let entry = match entry {
            Ok(value) => value,
            Err(error) => {
                notes.push(format!("跳过无法读取的路径: {}", error));
                continue;
            }
        };
        if !entry.file_type().is_file() {
            continue;
        }
        let name = entry.file_name().to_string_lossy();
        if name == ".DS_Store" || name.ends_with(".tmp") {
            continue;
        }
        let relative = entry
            .path()
            .strip_prefix(root)
            .unwrap_or(entry.path())
            .to_string_lossy()
            .replace('\\', "/");
        let size = entry.metadata().map(|meta| meta.len()).unwrap_or(0);
        map.insert(relative, TreeFile { path: entry.path().to_path_buf(), size });
        if map.len() >= MAX_FILES {
            truncated = true;
            notes.push(format!("文件数超过 {}，已截断扫描结果。", MAX_FILES));
            break;
        }
    }
    Ok((map, truncated, notes))
}

fn read_text(path: &Path, max_file_bytes: u64) -> Loaded {
    let meta = match fs::metadata(path) {
        Ok(value) => value,
        Err(_) => {
            return Loaded { size: None, text: None, binary: false, oversized: false };
        }
    };
    if meta.len() > max_file_bytes {
        return Loaded { size: Some(meta.len()), text: None, binary: false, oversized: true };
    }
    let bytes = match fs::read(path) {
        Ok(value) => value,
        Err(_) => {
            return Loaded { size: Some(meta.len()), text: None, binary: false, oversized: false };
        }
    };
    if symbols::is_binary(&path.to_string_lossy(), &bytes) {
        return Loaded { size: Some(meta.len()), text: None, binary: true, oversized: false };
    }
    Loaded {
        size: Some(meta.len()),
        text: Some(String::from_utf8_lossy(&bytes).to_string()),
        binary: false,
        oversized: false,
    }
}

fn bytes_text(path: &str, bytes: Option<Vec<u8>>, max_file_bytes: u64) -> Loaded {
    let Some(bytes) = bytes else {
        return Loaded { size: None, text: None, binary: false, oversized: false };
    };
    if bytes.len() as u64 > max_file_bytes {
        return Loaded { size: Some(bytes.len() as u64), text: None, binary: false, oversized: true };
    }
    if symbols::is_binary(path, &bytes) {
        return Loaded { size: Some(bytes.len() as u64), text: None, binary: true, oversized: false };
    }
    Loaded {
        size: Some(bytes.len() as u64),
        text: Some(String::from_utf8_lossy(&bytes).to_string()),
        binary: false,
        oversized: false,
    }
}

fn hash_file(path: &Path) -> Option<blake3::Hash> {
    let meta = fs::metadata(path).ok()?;
    if meta.len() > 32 * 1024 * 1024 {
        return None;
    }
    let bytes = fs::read(path).ok()?;
    Some(blake3::hash(&bytes))
}

fn language_stats(files: &BTreeMap<String, TreeFile>) -> Vec<LangStat> {
    let mut stats: BTreeMap<String, (usize, u64)> = BTreeMap::new();
    for (path, file) in files {
        let language = symbols::language_for(path).to_string();
        let entry = stats.entry(language).or_insert((0, 0));
        entry.0 += 1;
        entry.1 += file.size;
    }
    let mut result: Vec<LangStat> = stats
        .into_iter()
        .map(|(name, (files, bytes))| LangStat { name, files, bytes })
        .collect();
    result.sort_by(|left, right| right.files.cmp(&left.files).then(left.name.cmp(&right.name)));
    result.truncate(12);
    result
}

fn language_stats_from_paths(paths: impl Iterator<Item = (String, u64)>) -> Vec<LangStat> {
    let mut stats: BTreeMap<String, (usize, u64)> = BTreeMap::new();
    for (path, bytes) in paths {
        let language = symbols::language_for(&path).to_string();
        let entry = stats.entry(language).or_insert((0, 0));
        entry.0 += 1;
        entry.1 += bytes;
    }
    let mut result: Vec<LangStat> = stats
        .into_iter()
        .map(|(name, (files, bytes))| LangStat { name, files, bytes })
        .collect();
    result.sort_by(|left, right| right.files.cmp(&left.files).then(left.name.cmp(&right.name)));
    result.truncate(12);
    result
}

fn build_entry(
    path: &str,
    display: &str,
    status: &str,
    left: &Loaded,
    right: &Loaded,
) -> FileEntry {
    let language = symbols::language_for(path).to_string();
    let binary = left.binary || right.binary;
    let oversized = left.oversized || right.oversized;
    let mut added = 0u64;
    let mut deleted = 0u64;
    let mut risk = Vec::new();
    let mut symbols_added = Vec::new();
    let mut symbols_removed = Vec::new();

    if !binary && !oversized {
        let old_text = left.text.as_deref().unwrap_or("");
        let new_text = right.text.as_deref().unwrap_or("");
        let (file_added, file_deleted) = diff::line_counts(old_text, new_text);
        added = file_added;
        deleted = file_deleted;
        let (added_symbols, removed_symbols) =
            symbols::symbol_diff(path, &language, old_text, new_text);
        symbols_added = added_symbols;
        symbols_removed = removed_symbols;
        risk = symbols::risk_hints(
            path,
            status,
            &language,
            old_text,
            new_text,
            &symbols_removed,
        );
    }

    FileEntry {
        path: path.to_string(),
        display: display.to_string(),
        status: status.to_string(),
        left_size: left.size,
        right_size: right.size,
        added,
        deleted,
        binary,
        oversized,
        language,
        risk,
        symbols_added,
        symbols_removed,
    }
}

fn status_counts(files: &[FileEntry]) -> Stats {
    let mut stats = Stats {
        added_files: 0,
        removed_files: 0,
        modified_files: 0,
        unchanged_files: 0,
        added_lines: 0,
        deleted_lines: 0,
        scanned_files: files.len(),
    };
    for file in files {
        match file.status.as_str() {
            "added" => stats.added_files += 1,
            "removed" => stats.removed_files += 1,
            "modified" => stats.modified_files += 1,
            _ => stats.unchanged_files += 1,
        }
        stats.added_lines += file.added;
        stats.deleted_lines += file.deleted;
    }
    stats
}

fn scan_folders(options: &ScanOptions) -> Result<ScanResult> {
    let left_root = options
        .left
        .as_ref()
        .ok_or_else(|| anyhow!("--left is required for folder comparison"))?;
    let right_root = options
        .right
        .as_ref()
        .ok_or_else(|| anyhow!("--right is required for folder comparison"))?;
    let (left_tree, left_truncated, mut notes) = collect_tree(left_root)?;
    let (right_tree, right_truncated, right_notes) = collect_tree(right_root)?;
    notes.extend(right_notes);

    let keys: BTreeSet<&String> = left_tree.keys().chain(right_tree.keys()).collect();
    let mut files: Vec<FileEntry> = Vec::with_capacity(keys.len());
    let mut changed_files = 0usize;
    let mut diff_budget = 900usize;

    for key in keys {
        let left_file = left_tree.get(key);
        let right_file = right_tree.get(key);
        let status = match (left_file, right_file) {
            (None, Some(_)) => "added",
            (Some(_), None) => "removed",
            (Some(left), Some(right)) => {
                let same = left.size == right.size
                    && match (hash_file(&left.path), hash_file(&right.path)) {
                        (Some(left_hash), Some(right_hash)) => left_hash == right_hash,
                        _ => false,
                    };
                if same {
                    "unchanged"
                } else {
                    "modified"
                }
            }
            (None, None) => unreachable!(),
        };
        if status != "unchanged" {
            changed_files += 1;
        }

        let mut left_loaded = Loaded { size: left_file.map(|file| file.size), text: None, binary: false, oversized: false };
        let mut right_loaded = Loaded { size: right_file.map(|file| file.size), text: None, binary: false, oversized: false };
        if status != "unchanged" && diff_budget > 0 {
            if let Some(file) = left_file {
                left_loaded = read_text(&file.path, options.max_file_bytes);
            }
            if let Some(file) = right_file {
                right_loaded = read_text(&file.path, options.max_file_bytes);
            }
            diff_budget -= 1;
        } else if status == "unchanged" {
            // Keep the size information only; no content work for identical files.
        }

        files.push(build_entry(key, key, status, &left_loaded, &right_loaded));
    }

    if diff_budget == 0 && changed_files > 900 {
        notes.push("改动文件较多，行数与符号分析仅覆盖前 900 个文件。".into());
    }

    let project = Project {
        name: right_root
            .file_name()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_else(|| "project".into()),
        left_label: left_root.display().to_string(),
        right_label: right_root.display().to_string(),
        total_files: files.len(),
        changed_files,
        languages: language_stats(&right_tree),
        git: None,
    };
    let stats = status_counts(&files);
    Ok(ScanResult {
        ok: true,
        mode: "folders".into(),
        project,
        stats,
        files,
        notes,
        truncated: left_truncated || right_truncated,
    })
}

fn scan_git(options: &ScanOptions) -> Result<ScanResult> {
    let repo_input = options
        .repo
        .as_ref()
        .ok_or_else(|| anyhow!("--repo is required for git comparison"))?;
    let root = gitops::repo_root(repo_input)?;
    let base = if options.base.trim().is_empty() { "HEAD".to_string() } else { options.base.clone() };
    gitops::verify_rev(&root, &base)?;

    let tracked = gitops::ls_files(&root);
    let untracked = gitops::untracked_files(&root);
    let mut changes: BTreeMap<String, String> = BTreeMap::new();
    for (raw_status, path) in gitops::changed_files(&root, &base)? {
        let status = if raw_status.starts_with('A') {
            "added"
        } else if raw_status.starts_with('D') {
            "removed"
        } else {
            "modified"
        };
        changes.insert(path, status.to_string());
    }
    for path in untracked.iter() {
        changes.entry(path.clone()).or_insert_with(|| "added".to_string());
    }

    let mut files = Vec::with_capacity(changes.len());
    let mut notes = Vec::new();
    let mut processed = 0usize;
    for (path, status) in changes.iter() {
        if processed >= MAX_GIT_FILES {
            notes.push(format!("改动文件超过 {} 个，仅分析前 {} 个。", MAX_GIT_FILES, MAX_GIT_FILES));
            break;
        }
        processed += 1;
        let left_bytes = gitops::show_file(&root, &base, path);
        let right_bytes = gitops::working_file(&root, path);
        let left_loaded = bytes_text(path, left_bytes, options.max_file_bytes);
        let right_loaded = bytes_text(path, right_bytes, options.max_file_bytes);
        files.push(build_entry(path, path, status, &left_loaded, &right_loaded));
    }

    let mut tracked_for_stats: Vec<(String, u64)> = Vec::new();
    for path in tracked.iter().chain(untracked.iter()) {
        let size = fs::metadata(root.join(path)).map(|meta| meta.len()).unwrap_or(0);
        tracked_for_stats.push((path.clone(), size));
    }
    let total_files = tracked.len() + untracked.len();
    let changed_files = files.len();
    let stats = status_counts(&files);

    Ok(ScanResult {
        ok: true,
        mode: "git".into(),
        project: Project {
            name: root
                .file_name()
                .map(|value| value.to_string_lossy().to_string())
                .unwrap_or_else(|| "repository".into()),
            left_label: format!("{} · {}", base, root.display()),
            right_label: "工作区 (working tree)".into(),
            total_files,
            changed_files,
            languages: language_stats_from_paths(tracked_for_stats.into_iter()),
            git: Some(GitInfo {
                repo: root.display().to_string(),
                branch: gitops::branch(&root),
                base: base.clone(),
            }),
        },
        stats,
        files,
        notes,
        truncated: total_files > MAX_FILES,
    })
}

fn scan_files(options: &ScanOptions) -> Result<ScanResult> {
    let left_path = options
        .left
        .as_ref()
        .ok_or_else(|| anyhow!("--left is required for file comparison"))?;
    let right_path = options
        .right
        .as_ref()
        .ok_or_else(|| anyhow!("--right is required for file comparison"))?;
    let left_exists = left_path.is_file();
    let right_exists = right_path.is_file();
    if !left_exists && !right_exists {
        return Err(anyhow!("neither side exists: {} / {}", left_path.display(), right_path.display()));
    }
    let left_loaded = read_text(left_path, options.max_file_bytes);
    let right_loaded = read_text(right_path, options.max_file_bytes);
    let status = match (left_exists, right_exists) {
        (true, false) => "removed",
        (false, true) => "added",
        _ => "modified",
    };
    let name = right_path
        .file_name()
        .or_else(|| left_path.file_name())
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| "file".into());
    let entry = build_entry(&name, &name, status, &left_loaded, &right_loaded);
    let stats = status_counts(std::slice::from_ref(&entry));
    let project = Project {
        name,
        left_label: left_path.display().to_string(),
        right_label: right_path.display().to_string(),
        total_files: 1,
        changed_files: 1,
        languages: Vec::new(),
        git: None,
    };
    Ok(ScanResult {
        ok: true,
        mode: "files".into(),
        project,
        stats,
        files: vec![entry],
        notes: Vec::new(),
        truncated: false,
    })
}

pub fn scan(options: &ScanOptions) -> Result<ScanResult> {
    match options.mode.as_str() {
        "folders" => scan_folders(options),
        "git" => scan_git(options),
        "files" => scan_files(options),
        other => Err(anyhow!("unknown scan mode: {}", other)),
    }
}

pub fn git_diff_path(repo: &Path, base: &str, path: &str) -> Result<(Option<String>, Option<String>)> {
    let left = gitops::show_file(repo, base, path);
    let right = gitops::working_file(repo, path);
    Ok((
        left.map(|bytes| String::from_utf8_lossy(&bytes).to_string()),
        right.map(|bytes| String::from_utf8_lossy(&bytes).to_string()),
    ))
}

pub fn file_bytes(path: &Path) -> Result<Option<String>> {
    if !path.is_file() {
        return Ok(None);
    }
    let bytes = fs::read(path).with_context(|| format!("failed to read {}", path.display()))?;
    Ok(Some(String::from_utf8_lossy(&bytes).to_string()))
}
