use similar::{ChangeTag, DiffOp, TextDiff};

use crate::model::{Block, DiffResult, Row, Segment};
use crate::symbols;

const MAX_ROWS: usize = 12_000;
const MAX_TEXT: usize = 200_000;

fn line_text(raw: &str) -> String {
    raw.trim_end_matches('\n').trim_end_matches('\r').to_string()
}

fn truncate_text(text: &str, max: usize) -> String {
    if text.len() <= max {
        return text.to_string();
    }
    let mut end = max;
    while end > 0 && !text.is_char_boundary(end) {
        end -= 1;
    }
    let mut out = text[..end].to_string();
    out.push_str("\n… [内容已截断，完整文件请在本机查看]");
    out
}

fn push_segment(target: &mut Vec<Segment>, text: String, changed: bool) {
    if text.is_empty() {
        return;
    }
    if let Some(last) = target.last_mut() {
        if last.changed == changed {
            last.text.push_str(&text);
            return;
        }
    }
    target.push(Segment { text, changed });
}

/// Token-level highlight for one replaced line pair.
fn word_segments(old: &str, new: &str) -> (Vec<Segment>, Vec<Segment>) {
    if old.len() > 8_000 || new.len() > 8_000 {
        return (
            vec![Segment { text: old.to_string(), changed: true }],
            vec![Segment { text: new.to_string(), changed: true }],
        );
    }
    let diff = TextDiff::from_words(old, new);
    let mut left: Vec<Segment> = Vec::new();
    let mut right: Vec<Segment> = Vec::new();
    for op in diff.ops() {
        for change in diff.iter_changes(op) {
            let text = change.value().to_string();
            match change.tag() {
                ChangeTag::Equal => {
                    push_segment(&mut left, text.clone(), false);
                    push_segment(&mut right, text, false);
                }
                ChangeTag::Delete => push_segment(&mut left, text, true),
                ChangeTag::Insert => push_segment(&mut right, text, true),
            }
        }
    }
    if left.is_empty() {
        left.push(Segment { text: old.to_string(), changed: true });
    }
    if right.is_empty() {
        right.push(Segment { text: new.to_string(), changed: true });
    }
    (left, right)
}

fn equal_row(old_no: usize, new_no: usize, old_text: &str, new_text: &str) -> Row {
    Row {
        kind: "equal".into(),
        left_no: Some(old_no),
        right_no: Some(new_no),
        left_text: Some(old_text.to_string()),
        right_text: Some(new_text.to_string()),
        left_segments: None,
        right_segments: None,
    }
}

fn delete_row(old_no: Option<usize>, text: &str) -> Row {
    Row {
        kind: "del".into(),
        left_no: old_no,
        right_no: None,
        left_text: Some(text.to_string()),
        right_text: None,
        left_segments: None,
        right_segments: None,
    }
}

fn insert_row(new_no: Option<usize>, text: &str) -> Row {
    Row {
        kind: "add".into(),
        left_no: None,
        right_no: new_no,
        left_text: None,
        right_text: Some(text.to_string()),
        left_segments: None,
        right_segments: None,
    }
}

fn replace_row(old_no: usize, new_no: usize, old_text: &str, new_text: &str) -> Row {
    let (left_segments, right_segments) = word_segments(old_text, new_text);
    Row {
        kind: "mod".into(),
        left_no: Some(old_no),
        right_no: Some(new_no),
        left_text: Some(old_text.to_string()),
        right_text: Some(new_text.to_string()),
        left_segments: Some(left_segments),
        right_segments: Some(right_segments),
    }
}

fn group_start(group: &[DiffOp]) -> (usize, usize) {
    let first = group.first().expect("group is non-empty");
    (first.old_range().start + 1, first.new_range().start + 1)
}

fn group_end(group: &[DiffOp]) -> (usize, usize) {
    let last = group.last().expect("group is non-empty");
    (last.old_range().end + 1, last.new_range().end + 1)
}

fn group_len(group: &[DiffOp]) -> (usize, usize) {
    let first = group.first().expect("group is non-empty");
    let last = group.last().expect("group is non-empty");
    (
        last.old_range().end.saturating_sub(first.old_range().start),
        last.new_range().end.saturating_sub(first.new_range().start),
    )
}

fn context_block(
    diff: &TextDiff<'_, '_, '_, str>,
    old_start: usize,
    new_start: usize,
    count: usize,
) -> Block {
    let old_slices = diff.old_slices();
    let new_slices = diff.new_slices();
    let mut rows = Vec::with_capacity(count);
    for index in 0..count {
        let old_index = old_start - 1 + index;
        let new_index = new_start - 1 + index;
        if old_index >= old_slices.len() || new_index >= new_slices.len() {
            break;
        }
        rows.push(equal_row(
            old_index + 1,
            new_index + 1,
            &line_text(old_slices[old_index]),
            &line_text(new_slices[new_index]),
        ));
    }
    Block::Context {
        old_start,
        new_start,
        count: rows.len(),
        rows,
    }
}

fn build_group_rows(
    diff: &TextDiff<'_, '_, '_, str>,
    ops: &[DiffOp],
) -> (Vec<Row>, u64, u64) {
    let old_slices = diff.old_slices();
    let new_slices = diff.new_slices();
    let mut rows: Vec<Row> = Vec::new();
    let mut added = 0u64;
    let mut deleted = 0u64;

    for op in ops {
        match *op {
            DiffOp::Equal { old_index, new_index, len } => {
                for offset in 0..len {
                    let old_text = line_text(old_slices[old_index + offset]);
                    let new_text = line_text(new_slices[new_index + offset]);
                    rows.push(equal_row(
                        old_index + offset + 1,
                        new_index + offset + 1,
                        &old_text,
                        &new_text,
                    ));
                }
            }
            DiffOp::Delete { old_index, old_len, .. } => {
                for offset in 0..old_len {
                    rows.push(delete_row(
                        Some(old_index + offset + 1),
                        &line_text(old_slices[old_index + offset]),
                    ));
                    deleted += 1;
                }
            }
            DiffOp::Insert { new_index, new_len, .. } => {
                for offset in 0..new_len {
                    rows.push(insert_row(
                        Some(new_index + offset + 1),
                        &line_text(new_slices[new_index + offset]),
                    ));
                    added += 1;
                }
            }
            DiffOp::Replace { old_index, old_len, new_index, new_len } => {
                let paired = old_len.min(new_len);
                for offset in 0..paired {
                    rows.push(replace_row(
                        old_index + offset + 1,
                        new_index + offset + 1,
                        &line_text(old_slices[old_index + offset]),
                        &line_text(new_slices[new_index + offset]),
                    ));
                }
                for offset in paired..old_len {
                    rows.push(delete_row(
                        Some(old_index + offset + 1),
                        &line_text(old_slices[old_index + offset]),
                    ));
                }
                for offset in paired..new_len {
                    rows.push(insert_row(
                        Some(new_index + offset + 1),
                        &line_text(new_slices[new_index + offset]),
                    ));
                }
                added += new_len as u64;
                deleted += old_len as u64;
            }
        }
    }
    (rows, added, deleted)
}

#[allow(clippy::too_many_arguments)]
pub fn build(
    path: &str,
    status: &str,
    language: &str,
    old: &str,
    new: &str,
    left_exists: bool,
    right_exists: bool,
) -> DiffResult {
    let diff = TextDiff::from_lines(old, new);
    let old_lines = diff.old_slices().len();
    let new_lines = diff.new_slices().len();
    let groups = diff.grouped_ops(3);
    let mut blocks: Vec<Block> = Vec::new();
    let mut emitted_old = 1usize;
    let mut emitted_new = 1usize;
    let mut added = 0u64;
    let mut deleted = 0u64;
    let mut hunk_index = 0usize;
    let mut row_total = 0usize;
    let mut truncated = false;

    for group in groups {
        let (old_start, new_start) = group_start(&group);
        if old_start > emitted_old {
            let count = old_start - emitted_old;
            let block = context_block(&diff, emitted_old, emitted_new, count);
            if let Block::Context { rows, .. } = &block {
                row_total += rows.len();
            }
            blocks.push(block);
        }
        let (old_len, new_len) = group_len(&group);
        let (rows, group_added, group_deleted) = build_group_rows(&diff, &group);
        added += group_added;
        deleted += group_deleted;
        row_total += rows.len();
        blocks.push(Block::Hunk {
            hunk_index,
            header: format!("@@ -{},{} +{},{} @@", old_start, old_len, new_start, new_len),
            old_start,
            old_lines: old_len,
            new_start,
            new_lines: new_len,
            rows,
        });
        hunk_index += 1;
        let (next_old, next_new) = group_end(&group);
        emitted_old = emitted_old.max(next_old);
        emitted_new = emitted_new.max(next_new);
        if row_total > MAX_ROWS {
            truncated = true;
            break;
        }
    }

    if !truncated {
        if emitted_old <= old_lines {
            let count = old_lines - emitted_old + 1;
            let block = context_block(&diff, emitted_old, emitted_new, count);
            if let Block::Context { rows, .. } = &block {
                row_total += rows.len();
            }
            blocks.push(block);
        } else if blocks.is_empty() {
            // Identical (possibly empty) files: expose the common content as one context block.
            let count = old_lines.min(new_lines);
            if count > 0 {
                blocks.push(context_block(&diff, 1, 1, count));
            }
        }
    }

    if row_total > MAX_ROWS {
        truncated = true;
    }

    let (symbols_added, symbols_removed) = symbols::symbol_diff(path, language, old, new);
    let risk = symbols::risk_hints(path, status, language, old, new, &symbols_removed);

    DiffResult {
        ok: true,
        path: path.to_string(),
        status: status.to_string(),
        language: language.to_string(),
        binary: false,
        left_exists,
        right_exists,
        left_text: truncate_text(old, MAX_TEXT),
        right_text: truncate_text(new, MAX_TEXT),
        blocks,
        added,
        deleted,
        risk,
        symbols_added,
        symbols_removed,
        truncated,
    }
}

pub fn empty_diff(path: &str, status: &str, language: &str, left_exists: bool, right_exists: bool) -> DiffResult {
    build(path, status, language, "", "", left_exists, right_exists)
}

/// Count added/deleted lines without materialising the presented blocks.
pub fn line_counts(old: &str, new: &str) -> (u64, u64) {
    let diff = TextDiff::from_lines(old, new);
    let mut added = 0u64;
    let mut deleted = 0u64;
    for op in diff.ops() {
        match *op {
            DiffOp::Equal { .. } => {}
            DiffOp::Delete { old_len, .. } => deleted += old_len as u64,
            DiffOp::Insert { new_len, .. } => added += new_len as u64,
            DiffOp::Replace { old_len, new_len, .. } => {
                deleted += old_len as u64;
                added += new_len as u64;
            }
        }
    }
    (added, deleted)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_a_replaced_line() {
        let (added, deleted) = line_counts("a\nb\n", "a\nc\n");
        assert_eq!(added, 1);
        assert_eq!(deleted, 1);
    }

    #[test]
    fn builds_a_hunk_with_word_segments() {
        let result = build(
            "math.js",
            "modified",
            "JavaScript",
            "export function clamp(v, min, max) {\n  return Math.min(Math.max(v, min), max);\n}\n",
            "export function clamp(v, min, max, fallback = 0) {\n  if (v < min) return fallback;\n  return Math.min(Math.max(v, min), max);\n}\n",
            true,
            true,
        );
        assert!(result.blocks.iter().any(|block| matches!(block, Block::Hunk { .. })));
        assert!(result.added > 0);
        assert_eq!(result.language, "JavaScript");
    }
}
