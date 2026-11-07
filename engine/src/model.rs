use serde::Serialize;

/// A single deterministic review hint produced by the engine.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Risk {
    pub severity: String,
    pub kind: String,
    pub title: String,
    pub detail: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LangStat {
    pub name: String,
    pub files: usize,
    pub bytes: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitInfo {
    pub repo: String,
    pub branch: String,
    pub base: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub name: String,
    pub left_label: String,
    pub right_label: String,
    pub total_files: usize,
    pub changed_files: usize,
    pub languages: Vec<LangStat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git: Option<GitInfo>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub path: String,
    pub display: String,
    /// added | removed | modified | unchanged
    pub status: String,
    pub left_size: Option<u64>,
    pub right_size: Option<u64>,
    pub added: u64,
    pub deleted: u64,
    pub binary: bool,
    pub oversized: bool,
    pub language: String,
    pub risk: Vec<Risk>,
    pub symbols_added: Vec<String>,
    pub symbols_removed: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Stats {
    pub added_files: usize,
    pub removed_files: usize,
    pub modified_files: usize,
    pub unchanged_files: usize,
    pub added_lines: u64,
    pub deleted_lines: u64,
    pub scanned_files: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub ok: bool,
    pub mode: String,
    pub project: Project,
    pub stats: Stats,
    pub files: Vec<FileEntry>,
    pub notes: Vec<String>,
    pub truncated: bool,
}

#[derive(Clone, Serialize)]
pub struct Segment {
    pub text: String,
    pub changed: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Row {
    /// equal | mod | del | add
    pub kind: String,
    pub left_no: Option<usize>,
    pub right_no: Option<usize>,
    pub left_text: Option<String>,
    pub right_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub left_segments: Option<Vec<Segment>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub right_segments: Option<Vec<Segment>>,
}

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum Block {
    Hunk {
        hunk_index: usize,
        header: String,
        old_start: usize,
        old_lines: usize,
        new_start: usize,
        new_lines: usize,
        rows: Vec<Row>,
    },
    Context {
        old_start: usize,
        new_start: usize,
        count: usize,
        rows: Vec<Row>,
    },
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffResult {
    pub ok: bool,
    pub path: String,
    pub status: String,
    pub language: String,
    pub binary: bool,
    pub left_exists: bool,
    pub right_exists: bool,
    pub left_text: String,
    pub right_text: String,
    pub blocks: Vec<Block>,
    pub added: u64,
    pub deleted: u64,
    pub risk: Vec<Risk>,
    pub symbols_added: Vec<String>,
    pub symbols_removed: Vec<String>,
    pub truncated: bool,
}

pub fn counts(status: &str) -> (usize, usize, usize, usize) {
    match status {
        "added" => (1, 0, 0, 0),
        "removed" => (0, 1, 0, 0),
        "modified" => (0, 0, 1, 0),
        _ => (0, 0, 0, 1),
    }
}
