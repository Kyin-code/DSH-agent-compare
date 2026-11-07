use std::collections::BTreeSet;
use regex::Regex;

use crate::model::Risk;

const KEYWORDS: &[&str] = &[
    "if", "for", "while", "switch", "catch", "return", "new", "else", "do", "try", "throw",
    "function", "class", "const", "let", "var", "type", "interface", "enum", "struct", "impl",
    "trait", "fn", "def", "module", "namespace", "public", "private", "protected", "static",
    "async", "await", "import", "export", "from", "default", "void", "int", "string", "bool",
    "true", "false", "null", "none", "self", "this", "super", "extends", "implements",
];

pub fn language_for(path: &str) -> &'static str {
    let ext = path
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_ascii_lowercase();
    match ext.as_str() {
        "rs" => "Rust",
        "ts" | "tsx" | "mts" | "cts" => "TypeScript",
        "js" | "jsx" | "mjs" | "cjs" => "JavaScript",
        "py" | "pyi" => "Python",
        "java" => "Java",
        "kt" | "kts" => "Kotlin",
        "cs" => "C#",
        "c" | "h" => "C",
        "cc" | "cpp" | "cxx" | "hpp" | "hh" => "C++",
        "go" => "Go",
        "rb" => "Ruby",
        "php" => "PHP",
        "swift" => "Swift",
        "scala" => "Scala",
        "sh" | "bash" | "zsh" | "ps1" | "bat" | "cmd" => "Shell",
        "json" | "jsonc" => "JSON",
        "yaml" | "yml" => "YAML",
        "toml" | "ini" | "conf" => "Config",
        "md" | "mdx" => "Markdown",
        "html" | "htm" => "HTML",
        "css" | "scss" | "sass" | "less" => "CSS",
        "vue" => "Vue",
        "svelte" => "Svelte",
        "sql" => "SQL",
        "dockerfile" => "Dockerfile",
        _ => {
            let lower = path.to_ascii_lowercase();
            if lower.ends_with("dockerfile") {
                "Dockerfile"
            } else if lower.ends_with(".gitignore") || lower.ends_with(".gitattributes") {
                "Config"
            } else {
                "Text"
            }
        }
    }
}

pub fn is_binary(path: &str, bytes: &[u8]) -> bool {
    let ext = path
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_ascii_lowercase();
    if matches!(
        ext.as_str(),
        "png" | "jpg" | "jpeg" | "gif" | "webp" | "ico" | "bmp" | "psd" | "pdf" | "zip" | "gz"
            | "tar" | "7z" | "rar" | "exe" | "dll" | "so" | "dylib" | "woff" | "woff2" | "ttf"
            | "otf" | "mp3" | "mp4" | "mov" | "avi" | "wav" | "ogg" | "wasm" | "class" | "pyc"
    ) {
        return true;
    }
    bytes.iter().take(8192).any(|byte| *byte == 0)
}

fn push_symbols(set: &mut BTreeSet<String>, captures: regex::Captures<'_>) {
    for index in 1..captures.len() {
        if let Some(value) = captures.get(index) {
            let name = value.as_str();
            if name.len() > 1 && !KEYWORDS.contains(&name.to_ascii_lowercase().as_str()) {
                set.insert(name.to_string());
            }
        }
    }
}

fn symbol_set(language: &str, text: &str) -> BTreeSet<String> {
    let text = text.trim_start_matches('\u{feff}');
    let pattern = match language {
        "Rust" => {
            r"(?m)^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?(?:unsafe\s+)?(?:const\s+)?fn\s+([A-Za-z_]\w*)|^\s*(?:pub\s+)?(?:struct|enum|trait|type|const|static|union|mod)\s+([A-Za-z_]\w*)"
        }
        "Python" => {
            r"(?m)^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)|^\s*class\s+([A-Za-z_]\w*)"
        }
        "Go" => {
            r"(?m)^func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)|^type\s+([A-Za-z_]\w*)"
        }
        "Java" | "Kotlin" | "C#" | "Swift" | "Scala" | "C++" | "C" => {
            r"(?m)^\s*(?:(?:public|private|protected|internal|static|final|abstract|async|virtual|override|sealed|partial|export)\s+)*(?:class|interface|enum|record|struct|namespace)\s+([A-Za-z_]\w*)|^\s*(?:(?:public|private|protected|internal|static|final|abstract|async|virtual|override|sealed|partial|export)\s+)+[\w<>\[\],.?*&:]+\s+([A-Za-z_]\w*)\s*\("
        }
        "JavaScript" | "TypeScript" => {
            r"(?m)^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)"
        }
        _ => {
            r"(?m)^\s*(?:export\s+)?(?:async\s+)?(?:function|class|def|fn|struct|interface|type|enum|trait)\s+([A-Za-z_$][\w$]*)"
        }
    };
    let mut set = BTreeSet::new();
    if let Ok(regex) = Regex::new(pattern) {
        for captures in regex.captures_iter(text) {
            push_symbols(&mut set, captures);
        }
    }
    set
}

pub fn symbol_diff(path: &str, language: &str, old: &str, new: &str) -> (Vec<String>, Vec<String>) {
    let _ = path;
    let old_set = symbol_set(language, old);
    let new_set = symbol_set(language, new);
    let added: Vec<String> = new_set.difference(&old_set).cloned().collect();
    let removed: Vec<String> = old_set.difference(&new_set).cloned().collect();
    (added, removed)
}

fn count_matches(regex: &str, text: &str) -> usize {
    Regex::new(regex)
        .map(|compiled| compiled.find_iter(text).count())
        .unwrap_or(0)
}

const COMMON_TYPOS: &[(&str, &str)] = &[
    ("recieve", "receive"),
    ("seperate", "separate"),
    ("occured", "occurred"),
    ("adress", "address"),
    ("lenght", "length"),
    ("sucess", "success"),
    ("neccessary", "necessary"),
    ("definately", "definitely"),
    ("enviroment", "environment"),
    ("paramter", "parameter"),
    ("funciton", "function"),
    ("widht", "width"),
    ("heigth", "height"),
    ("calback", "callback"),
    ("responce", "response"),
    ("existance", "existence"),
    ("maintainance", "maintenance"),
    ("compatability", "compatibility"),
    ("dependancy", "dependency"),
    ("buisness", "business"),
];

fn typo_hits(text: &str) -> Vec<String> {
    let lower = text.to_ascii_lowercase();
    COMMON_TYPOS
        .iter()
        .filter(|(typo, _)| lower.contains(typo))
        .map(|(typo, correct)| format!("{}→{}", typo, correct))
        .collect()
}

pub fn risk_hints(
    path: &str,
    status: &str,
    language: &str,
    old: &str,
    new: &str,
    removed_symbols: &[String],
) -> Vec<Risk> {    let mut risks = Vec::new();
    let lower_path = path.to_ascii_lowercase();
    let is_test_path = lower_path.contains("/test/")
        || lower_path.contains("/tests/")
        || lower_path.contains("__tests__")
        || lower_path.contains(".test.")
        || lower_path.contains(".spec.");

    if status == "removed" {
        risks.push(Risk {
            severity: "high".into(),
            kind: "file-removed".into(),
            title: "文件被删除".into(),
            detail: "新版本中不存在该文件，需确认其功能是否已迁移到其他位置。".into(),
        });
    }

    if !removed_symbols.is_empty() {
        let shown: Vec<String> = removed_symbols.iter().take(8).cloned().collect();
        risks.push(Risk {
            severity: "high".into(),
            kind: "removed-symbol".into(),
            title: format!("旧代码中的 {} 个符号在新代码中未找到", removed_symbols.len()),
            detail: format!(
                "可能影响功能覆盖：{}。该判断为启发式，需结合调用方确认。",
                shown.join("、")
            ),
        });
    }

    if is_test_path && status == "removed" {
        risks.push(Risk {
            severity: "high".into(),
            kind: "test-removed".into(),
            title: "测试文件被删除".into(),
            detail: "删除测试会削弱回归保障，建议确认测试是否迁移。".into(),
        });
    }

    let old_secret = count_matches(
        r#"(?i)(api[_-]?key|secret|token|password|passwd)\s*[:=]\s*['"][^'"]{8,}"#,
        old,
    );
    let new_secret = count_matches(
        r#"(?i)(api[_-]?key|secret|token|password|passwd)\s*[:=]\s*['"][^'"]{8,}"#,
        new,
    );
    if new_secret > old_secret {
        risks.push(Risk {
            severity: "high".into(),
            kind: "possible-secret".into(),
            title: "疑似新增硬编码凭据".into(),
            detail: "检测到新增的密钥/令牌类赋值，请确认不是真实凭据。".into(),
        });
    }

    let old_debug = count_matches(r"console\.(log|debug|trace)|debugger;|dbg!\(|System\.out\.print", old);
    let new_debug = count_matches(r"console\.(log|debug|trace)|debugger;|dbg!\(|System\.out\.print", new);
    if new_debug > old_debug {
        risks.push(Risk {
            severity: "low".into(),
            kind: "debug-output".into(),
            title: "新增调试输出".into(),
            detail: format!("调试输出从 {} 处增加到 {} 处，提交前建议清理。", old_debug, new_debug),
        });
    }

    let old_todo = count_matches(r"TODO|FIXME|XXX", old);
    let new_todo = count_matches(r"TODO|FIXME|XXX", new);
    if new_todo > old_todo {
        risks.push(Risk {
            severity: "low".into(),
            kind: "new-todo".into(),
            title: "新增待办标记".into(),
            detail: format!("TODO/FIXME 从 {} 处增加到 {} 处。", old_todo, new_todo),
        });
    }

    let old_typos = typo_hits(old);
    let new_typos: Vec<String> = typo_hits(new)
        .into_iter()
        .filter(|typo| !old_typos.contains(typo))
        .collect();
    if !new_typos.is_empty() {
        risks.push(Risk {
            severity: "low".into(),
            kind: "spelling".into(),
            title: "疑似拼写错误".into(),
            detail: format!(
                "新增拼写：{}。建议在提交前修正标识符或注释。",
                new_typos.iter().take(8).cloned().collect::<Vec<_>>().join("、")
            ),
        });
    }

    if language == "Rust" {
        let old_unwrap = count_matches(r"\.unwrap\(\)|\.expect\(", old);
        let new_unwrap = count_matches(r"\.unwrap\(\)|\.expect\(", new);
        if new_unwrap > old_unwrap + 2 {
            risks.push(Risk {
                severity: "medium".into(),
                kind: "rust-panic".into(),
                title: "新增较多 panic 风险".into(),
                detail: format!("unwrap/expect 从 {} 处增加到 {} 处，建议改用错误传播。", old_unwrap, new_unwrap),
            });
        }
    }

    let deleted_lines = count_matches(r"\n", old);
    let added_lines = count_matches(r"\n", new);
    if deleted_lines > added_lines + 150 {
        risks.push(Risk {
            severity: "medium".into(),
            kind: "large-deletion".into(),
            title: "大规模删减".into(),
            detail: format!("行数从 {} 减少到 {}，需确认没有丢失必要逻辑。", deleted_lines, added_lines),
        });
    }

    risks
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_removed_javascript_symbols() {
        let (added, removed) = symbol_diff(
            "math.js",
            "JavaScript",
            "export function add() {}\nexport function clamp() {}\n",
            "export function add() {}\nexport function safeDivide() {}\n",
        );
        assert!(added.contains(&"safeDivide".to_string()));
        assert!(removed.contains(&"clamp".to_string()));
    }

    #[test]
    fn detects_utf8_bom_symbols() {
        let (added, _) = symbol_diff(
            "bye.js",
            "JavaScript",
            "",
            "\u{feff}export function farewell() {}\n",
        );
        assert!(added.contains(&"farewell".to_string()));
    }

    #[test]
    fn flags_a_possible_secret() {
        let risks = risk_hints(
            "config.js",
            "modified",
            "JavaScript",
            "export const x = 1;",
            "export const apiKey = 'sk-1234567890abcdef';",
            &[],
        );
        assert!(risks.iter().any(|risk| risk.kind == "possible-secret"));
    }

    #[test]
    fn flags_a_new_typo() {
        let risks = risk_hints(
            "helper.js",
            "modified",
            "JavaScript",
            "export function receive(value) {}",
            "export function recieve(value) {}",
            &[],
        );
        assert!(risks.iter().any(|risk| risk.kind == "spelling"));
    }
}
