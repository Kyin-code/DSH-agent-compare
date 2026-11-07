window.__ModuleLoader__.load({
  id: '@local/agent-compare-app',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useMemo, useCallback } = React
    const NS = 'agent-compare'
    const API = '/agent-compare/api'
    const ROW_HEIGHT = 22

    const ZH = {
      panel: '代码比对',
      tagline: '像 JetBrains Compare 一样看差异，让 Agent 只评审你正在看的地方',
      'mode.folders': '文件夹',
      'mode.files': '文件',
      'mode.git': 'Git 工作区',
      'mode.folders.hint': '比较两个目录的完整工程',
      'mode.files.hint': '比较两个单文件',
      'mode.git.hint': '比较某个提交与当前工作区',
      left: '原始（左）',
      right: '修改后（右）',
      repo: '仓库路径',
      base: '基线提交',
      choose: '选择',
      browse: '浏览',
      scan: '开始比对',
      rescan: '重新扫描',
      scanning: '正在扫描工程…',
      swap: '交换',
      reset: '清空',
      filter: '搜索文件…',
      all: '全部',
      changed: '有改动',
      modified: '修改',
      added: '新增',
      removed: '删除',
      unchanged: '未变',
      files: '文件',
      project: '工程概览',
      total: '文件总数',
      changedFiles: '改动文件',
      addedLines: '新增行',
      deletedLines: '删除行',
      'empty.title': '把一次改动看清楚',
      'empty.desc': '选择两个目录、两个文件，或一个 Git 仓库与基线提交。扫描完成后，点击右侧差异行即可获得聚焦评审。',
      'empty.folders': '文件夹对比',
      'empty.folders.desc': '逐文件比较两个目录，快速定位新增、删除与修改。',
      'empty.files': '单文件对比',
      'empty.files.desc': '左右并排查看一个文件的全部差异，支持行内高亮。',
      'empty.git': 'Git 工作区',
      'empty.git.desc': '将工作区与 HEAD 或任意提交比较，适合评审 Agent 的未提交改动。',
      'empty.tip': '提示：Agent 只分析你已经打开并聚焦的文件；未打开的文件不会被评价。',
      'diff.empty': '从左侧选择一个文件开始查看差异',
      'diff.loading': '正在加载差异…',
      'diff.identical': '两侧内容完全一致',
      'diff.binary': '二进制文件，无法按行比较',
      'diff.oversized': '文件超过大小限制，已跳过内容对比',
      'diff.truncated': '差异过大，已截断显示',
      'diff.hunkAnalyze': '分析',
      'diff.prev': '上一',
      'diff.next': '下一',
      'diff.wrap': '换行',
      'diff.expandAll': '展开全部',
      'diff.collapseAll': '折叠上下文',
      'diff.gap': '展开 {count} 行未改动内容',
      'diff.count': '{added} 新增 / {deleted} 删除',
      agent: 'Agent 评审',
      'agent.auto': '自动分析',
      'agent.analyzeFile': '分析当前文件',
      'agent.analyzeHunk': '分析当前片段',
      'agent.loading': 'Agent 正在阅读当前片段…',
      'agent.onlyOpened': '只评审已打开文件。聚焦行会作为分析范围。',
      'agent.empty': '点击差异行，或点击下方按钮，让 Agent 结合工程上下文评审当前片段。',
      'agent.coverage': '功能覆盖',
      'agent.score': '质量评分',
      'agent.issues': '问题',
      'agent.strengths': '优势',
      'agent.suggestions': '建议',
      'agent.removed': '未覆盖的旧能力',
      'agent.meta': '由 {model} 生成 · {elapsed}ms',
      'agent.heuristic': '本地规则建议（模型不可用）',
      'agent.error': '分析失败',
      'agent.retry': '重新分析',
      'agent.details': '查看完整评审',
      'agent.cardTitle': '聚焦建议',
      'agent.cardLoading': '正在分析你聚焦的差异…',
      'coverage.full': '完全覆盖',
      'coverage.partial': '部分覆盖',
      'coverage.none': '未覆盖',
      'coverage.uncertain': '待确认',
      folderFloat: '目录浮窗',
      'folderFloat.title': '工程目录',
      'folderFloat.close': '关闭',
      'folderFloat.hint': '拖动标题栏移动；双击文件打开',
      engine: 'Rust 引擎',
      engineMissing: '未找到 Rust 引擎，请先运行 scripts/build-engine.ps1',
      llm: 'Agent',
      llmMissing: '模型服务不可用',
      close: '关闭',
      cancel: '取消',
      parent: '上一级',
      selectFolder: '选择此文件夹',
      loading: '加载中…',
      'statusbar.hint': 'F7 / F8 切换差异 · Ctrl+Enter 分析聚焦片段 · Esc 关闭浮窗',
      'error.scan': '扫描失败',
      'error.diff': '加载差异失败',
      'error.analyze': '分析失败',
      'notice.noEngine': 'Rust 引擎不可用，请构建后再试。',
      'notice.scanned': '扫描完成：{changed} 个改动文件',
      'notice.copied': '已复制',
      'browse.title': '选择{kind}',
      'browse.file': '文件',
      'browse.directory': '文件夹',
      'browse.empty': '此目录为空',
      'browse.path': '路径',
      'browse.up': '上一级',
      'status.added': '新增',
      'status.removed': '删除',
      'status.modified': '修改',
      'status.unchanged': '未变',
      'risk.high': '高风险',
      'risk.medium': '中风险',
      'risk.low': '提示',
      'meta.lines': '行数',
      'meta.language': '语言',
      'meta.size': '大小',
      'meta.binary': '二进制',
    }

    const EN = {
      panel: 'Agent Compare',
      tagline: 'JetBrains-style diffs, with AI review scoped to what you are reading',
      'mode.folders': 'Folders',
      'mode.files': 'Files',
      'mode.git': 'Git worktree',
      'mode.folders.hint': 'Compare two complete project trees',
      'mode.files.hint': 'Compare two single files',
      'mode.git.hint': 'Compare a revision with the working tree',
      left: 'Original (left)',
      right: 'Changed (right)',
      repo: 'Repository',
      base: 'Base revision',
      choose: 'Choose',
      browse: 'Browse',
      scan: 'Compare',
      rescan: 'Rescan',
      scanning: 'Scanning project…',
      swap: 'Swap',
      reset: 'Clear',
      filter: 'Filter files…',
      all: 'All',
      changed: 'Changed',
      modified: 'Modified',
      added: 'Added',
      removed: 'Removed',
      unchanged: 'Unchanged',
      files: 'Files',
      project: 'Project',
      total: 'Files',
      changedFiles: 'Changed',
      addedLines: 'Added',
      deletedLines: 'Deleted',
      'empty.title': 'See a change clearly',
      'empty.desc': 'Pick two folders, two files, or a git repository and base revision. Once scanned, click a diff row to get a focused review.',
      'empty.folders': 'Folder compare',
      'empty.folders.desc': 'Compare two trees file by file and find additions, deletions, and edits.',
      'empty.files': 'File compare',
      'empty.files.desc': 'Inspect one file side by side with inline highlighting.',
      'empty.git': 'Git worktree',
      'empty.git.desc': 'Compare the working tree with HEAD or any revision — ideal for reviewing agent edits.',
      'empty.tip': 'The agent reviews only files you have opened and focused. Unopened files are never evaluated.',
      'diff.empty': 'Pick a file on the left to inspect its diff',
      'diff.loading': 'Loading diff…',
      'diff.identical': 'The two sides are identical',
      'diff.binary': 'Binary file — line comparison is unavailable',
      'diff.oversized': 'File exceeds the size limit; content comparison was skipped',
      'diff.truncated': 'Diff is very large and was truncated',
      'diff.hunkAnalyze': 'Review',
      'diff.prev': 'Prev',
      'diff.next': 'Next',
      'diff.wrap': 'Wrap',
      'diff.expandAll': 'Expand all',
      'diff.collapseAll': 'Collapse context',
      'diff.gap': 'Expand {count} unchanged lines',
      'diff.count': '{added} added / {deleted} deleted',
      agent: 'Agent review',
      'agent.auto': 'Auto review',
      'agent.analyzeFile': 'Review this file',
      'agent.analyzeHunk': 'Review this hunk',
      'agent.loading': 'The agent is reading the focused region…',
      'agent.onlyOpened': 'Only opened files are reviewed. The focused row defines the scope.',
      'agent.empty': 'Click a diff row, or use the button below, to review the focused region with project context.',
      'agent.coverage': 'Coverage',
      'agent.score': 'Quality score',
      'agent.issues': 'Issues',
      'agent.strengths': 'Strengths',
      'agent.suggestions': 'Suggestions',
      'agent.removed': 'Old capabilities not covered',
      'agent.meta': 'Generated by {model} · {elapsed}ms',
      'agent.heuristic': 'Local heuristic (model unavailable)',
      'agent.error': 'Review failed',
      'agent.retry': 'Review again',
      'agent.details': 'Full review',
      'agent.cardTitle': 'Focused review',
      'agent.cardLoading': 'Reviewing your focused region…',
      'coverage.full': 'Fully covered',
      'coverage.partial': 'Partially covered',
      'coverage.none': 'Not covered',
      'coverage.uncertain': 'Needs confirmation',
      folderFloat: 'Folder window',
      'folderFloat.title': 'Project tree',
      'folderFloat.close': 'Close',
      'folderFloat.hint': 'Drag the title bar; double-click a file to open',
      engine: 'Rust engine',
      engineMissing: 'Rust engine not found. Run scripts/build-engine.ps1 first.',
      llm: 'Agent',
      llmMissing: 'Model service unavailable',
      close: 'Close',
      cancel: 'Cancel',
      parent: 'Up',
      selectFolder: 'Use this folder',
      loading: 'Loading…',
      'statusbar.hint': 'F7 / F8 diff navigation · Ctrl+Enter review focus · Esc close overlays',
      'error.scan': 'Scan failed',
      'error.diff': 'Could not load diff',
      'error.analyze': 'Review failed',
      'notice.noEngine': 'The Rust engine is unavailable. Build it first.',
      'notice.scanned': 'Scan complete: {changed} changed files',
      'notice.copied': 'Copied',
      'browse.title': 'Choose {kind}',
      'browse.file': 'file',
      'browse.directory': 'folder',
      'browse.empty': 'This folder is empty',
      'browse.path': 'Path',
      'browse.up': 'Up',
      'status.added': 'Added',
      'status.removed': 'Removed',
      'status.modified': 'Modified',
      'status.unchanged': 'Unchanged',
      'risk.high': 'High risk',
      'risk.medium': 'Medium risk',
      'risk.low': 'Note',
      'meta.lines': 'Lines',
      'meta.language': 'Language',
      'meta.size': 'Size',
      'meta.binary': 'Binary',
    }

    function tr(t, key, vars) {
      let value = typeof t === 'function' ? t(key) : undefined
      if (typeof value !== 'string' || value === key || value.length === 0) value = ZH[key] ?? key
      if (vars) {
        for (const name of Object.keys(vars)) value = value.split('{' + name + '}').join(String(vars[name]))
      }
      return value
    }

    function load(key, fallback) {
      try {
        const value = window.localStorage.getItem('ac.' + key)
        return value === null ? fallback : value
      } catch {
        return fallback
      }
    }

    function save(key, value) {
      try {
        window.localStorage.setItem('ac.' + key, String(value))
      } catch {
        // Local storage is optional.
      }
    }

    async function api(pathname, options) {
      const init = { ...(options ?? {}) }
      init.headers = { 'content-type': 'application/json', ...(init.headers ?? {}) }
      const response = await fetch(API + pathname, init)
      let data
      try {
        data = await response.json()
      } catch {
        throw new Error('服务返回了无法解析的响应')
      }
      if (!response.ok || data?.ok === false) throw new Error(data?.error ?? `HTTP ${response.status}`)
      return data
    }

    function formatNumber(value) {
      if (value === null || value === undefined) return '—'
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
      return String(value)
    }

    function formatBytes(value) {
      if (value === null || value === undefined) return '—'
      if (value < 1024) return `${value} B`
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
      return `${(value / 1024 / 1024).toFixed(1)} MB`
    }

    function basename(path) {
      if (!path) return ''
      const parts = String(path).split(/[\\/]/)
      return parts[parts.length - 1] || path
    }

    function dirname(path) {
      if (!path) return ''
      const value = String(path)
      const index = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'))
      return index > 0 ? value.slice(0, index) : ''
    }

    function statusKey(status) {
      return status === 'added' ? 'status.added'
        : status === 'removed' ? 'status.removed'
          : status === 'modified' ? 'status.modified'
            : 'status.unchanged'
    }

    function coverageKey(value) {
      return value === 'full' ? 'coverage.full'
        : value === 'partial' ? 'coverage.partial'
          : value === 'none' ? 'coverage.none'
            : 'coverage.uncertain'
    }

    function severityRank(severity) {
      return severity === 'high' ? 3 : severity === 'medium' ? 2 : 1
    }

    function riskSeverity(risk) {
      return (risk ?? []).reduce((max, item) => Math.max(max, severityRank(item.severity)), 0)
    }

    function classNames(...values) {
      return values.filter(Boolean).join(' ')
    }

    // ---------------------------------------------------------------- icons
    function Svg(props) {
      return h('svg', {
        width: props.size ?? 18,
        height: props.size ?? 18,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: props.strokeWidth ?? 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        className: props.className,
      }, props.children)
    }

    function IconSplit(props) {
      return h(Svg, props,
        h('rect', { x: 3, y: 4, width: 7, height: 16, rx: 1.5 }),
        h('rect', { x: 14, y: 4, width: 7, height: 16, rx: 1.5 }),
        h('path', { d: 'M10 9h4m0 0-1.5-1.5M14 9l-1.5 1.5' }),
        h('path', { d: 'M14 15h-4m0 0 1.5-1.5M10 15l1.5 1.5' })
      )
    }

    function IconFolder(props) {
      return h(Svg, props, h('path', { d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }))
    }

    function IconFile(props) {
      return h(Svg, props, h('path', { d: 'M6 3h8l4 4v14H6z' }), h('path', { d: 'M14 3v5h5' }))
    }

    function IconGit(props) {
      return h(Svg, props, h('circle', { cx: 6, cy: 6, r: 2 }), h('circle', { cx: 6, cy: 18, r: 2 }), h('circle', { cx: 18, cy: 12, r: 2 }), h('path', { d: 'M6 8v8M8 6h5a3 3 0 0 1 3 3v1' }))
    }

    function IconSearch(props) {
      return h(Svg, props, h('circle', { cx: 11, cy: 11, r: 6.5 }), h('path', { d: 'm16 16 4 4' }))
    }

    function IconClose(props) {
      return h(Svg, props, h('path', { d: 'M6 6l12 12M18 6 6 18' }))
    }

    function IconChevron(props) {
      return h(Svg, props, h('path', { d: props.open ? 'm8 10 4 4 4-4' : 'm10 8 4 4-4 4' }))
    }

    function IconRefresh(props) {
      return h(Svg, props, h('path', { d: 'M20 11a8 8 0 1 0-2.3 5.7' }), h('path', { d: 'M20 5v6h-6' }))
    }

    function IconSwap(props) {
      return h(Svg, props, h('path', { d: 'M4 8h15m0 0-3-3m3 3-3 3' }), h('path', { d: 'M20 16H5m0 0 3-3m-3 3 3 3' }))
    }

    function IconSpark(props) {
      return h(Svg, props, h('path', { d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z' }), h('path', { d: 'M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z' }))
    }

    function IconArrowLeft(props) {
      return h(Svg, props, h('path', { d: 'M19 12H5m0 0 6-6m-6 6 6 6' }))
    }

    function IconArrowRight(props) {
      return h(Svg, props, h('path', { d: 'M5 12h14m0 0-6-6m6 6-6 6' }))
    }

    function IconFolderFloat(props) {
      return h(Svg, props, h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 }), h('path', { d: 'M3 9h18M8 4v5' }))
    }

    function IconWarning(props) {
      return h(Svg, props, h('path', { d: 'M12 3 2.8 20h18.4z' }), h('path', { d: 'M12 9v5' }), h('path', { d: 'M12 17.2v.1' }))
    }

    function IconChevronDown(props) {
      return h(Svg, props, h('path', { d: 'm6 9 6 6 6-6' }))
    }

    function PanelIcon({ size }) {
      return h(IconSplit, { size })
    }

    // ------------------------------------------------------------- components
    function Toolbar(props) {
      const { t, mode, setMode, scanning, onScan, onReset, autoAnalyze, setAutoAnalyze, agentOpen, setAgentOpen, floatOpen, setFloatOpen, health } = props
      const modeButton = (key, icon) => h('button', {
        type: 'button',
        className: classNames('ac-seg', mode === key && 'ac-seg-active'),
        onClick: () => setMode(key),
        title: tr(t, 'mode.' + key + '.hint'),
      }, icon, h('span', null, tr(t, 'mode.' + key)))
      return h('div', { className: 'ac-toolbar' },
        h('div', { className: 'ac-brand' },
          h('div', { className: 'ac-brand-icon' }, h(IconSplit, { size: 22 })),
          h('div', { className: 'ac-brand-text' },
            h('div', { className: 'ac-title' }, tr(t, 'panel')),
            h('div', { className: 'ac-subtitle' }, tr(t, 'tagline'))
          )
        ),
        h('div', { className: 'ac-segmented' },
          modeButton('folders', h(IconFolder, { size: 15 })),
          modeButton('files', h(IconFile, { size: 15 })),
          modeButton('git', h(IconGit, { size: 15 }))
        ),
        h('div', { className: 'ac-toolbar-spacer' }),
        h('div', { className: 'ac-toolbar-actions' },
          h('span', {
            className: classNames('ac-status-dot', health?.engineReady ? 'ac-ok' : 'ac-bad'),
            title: health?.engineReady ? 'Rust engine ready' : tr(t, 'engineMissing'),
          }, health?.engineReady ? 'Rust' : 'Rust!'),
          h('button', {
            type: 'button',
            className: classNames('ac-icon-btn', autoAnalyze && 'ac-icon-btn-on'),
            title: tr(t, 'agent.auto'),
            onClick: () => setAutoAnalyze(!autoAnalyze),
          }, h(IconSpark, { size: 17 })),
          h('button', {
            type: 'button',
            className: classNames('ac-icon-btn', floatOpen && 'ac-icon-btn-on'),
            title: tr(t, 'folderFloat'),
            onClick: () => setFloatOpen(!floatOpen),
          }, h(IconFolderFloat, { size: 17 })),
          h('button', {
            type: 'button',
            className: classNames('ac-icon-btn', agentOpen && 'ac-icon-btn-on'),
            title: tr(t, 'agent'),
            onClick: () => setAgentOpen(!agentOpen),
          }, h(IconSpark, { size: 17 })),
          h('button', { type: 'button', className: 'ac-btn ac-btn-ghost', onClick: onReset }, tr(t, 'reset')),
          h('button', {
            type: 'button',
            className: 'ac-btn ac-btn-primary',
            onClick: onScan,
            disabled: scanning,
          }, scanning ? h(Spinner, { size: 14 }) : h(IconRefresh, { size: 15 }), scanning ? tr(t, 'scanning') : tr(t, 'scan'))
        )
      )
    }

    function PathBar(props) {
      const { t, mode, left, right, repo, base, setLeft, setRight, setRepo, setBase, onPick, onBrowseFile, onSwap, scanning, onScan } = props
      const field = (label, value, setter, onBrowseClick, placeholder) => h('label', { className: 'ac-field' },
        h('span', { className: 'ac-field-label' }, label),
        h('div', { className: 'ac-input-group' },
          h('input', {
            className: 'ac-input',
            value,
            placeholder,
            spellCheck: false,
            onChange: (event) => setter(event.target.value),
          }),
          h('button', { type: 'button', className: 'ac-input-btn', onClick: onBrowseClick, title: tr(t, 'browse') },
            h(IconFolder, { size: 15 }))
        )
      )

      return h('div', { className: 'ac-paths' },
        mode === 'git'
          ? h(React.Fragment, null,
            field(tr(t, 'repo'), repo, setRepo, () => onPick(setRepo), 'C:\\project'),
            h('label', { className: 'ac-field ac-field-base' },
              h('span', { className: 'ac-field-label' }, tr(t, 'base')),
              h('input', {
                className: 'ac-input',
                value: base,
                spellCheck: false,
                placeholder: 'HEAD',
                onChange: (event) => setBase(event.target.value),
              })
            )
          )
          : h(React.Fragment, null,
            field(tr(t, 'left'), left, setLeft, () => mode === 'files' ? onBrowseFile(setLeft) : onPick(setLeft), 'C:\\old'),
            h('button', { type: 'button', className: 'ac-swap-btn', onClick: onSwap, title: tr(t, 'swap') }, h(IconSwap, { size: 16 })),
            field(tr(t, 'right'), right, setRight, () => mode === 'files' ? onBrowseFile(setRight) : onPick(setRight), 'C:\\new')
          ),
        h('div', { className: 'ac-path-actions' },
          mode !== 'git' ? null : h('span', { className: 'ac-hint' }, tr(t, 'mode.git.hint')),
          h('button', { type: 'button', className: 'ac-btn ac-btn-primary', onClick: onScan, disabled: scanning },
            scanning ? h(Spinner, { size: 14 }) : h(IconSplit, { size: 15 }), tr(t, 'scan'))
        )
      )
    }

    function EmptyState(props) {
      const { t, mode, setMode, onPick } = props
      const card = (key, icon) => h('button', {
        type: 'button',
        className: classNames('ac-hero-card', mode === key && 'ac-hero-card-active'),
        onClick: () => setMode(key),
      },
        h('div', { className: 'ac-hero-card-icon' }, icon),
        h('div', { className: 'ac-hero-card-title' }, tr(t, 'empty.' + key)),
        h('div', { className: 'ac-hero-card-desc' }, tr(t, 'empty.' + key + '.desc'))
      )
      return h('div', { className: 'ac-hero' },
        h('div', { className: 'ac-hero-mark' }, h(IconSplit, { size: 44 })),
        h('h1', { className: 'ac-hero-title' }, tr(t, 'empty.title')),
        h('p', { className: 'ac-hero-desc' }, tr(t, 'empty.desc')),
        h('div', { className: 'ac-hero-cards' },
          card('folders', h(IconFolder, { size: 20 })),
          card('files', h(IconFile, { size: 20 })),
          card('git', h(IconGit, { size: 20 }))
        ),
        h('div', { className: 'ac-hero-tip' }, h(IconSpark, { size: 15 }), tr(t, 'empty.tip'))
      )
    }

    function ProjectSummary(props) {
      const { t, scan } = props
      const stats = scan.stats
      const languages = scan.project.languages ?? []
      return h('div', { className: 'ac-project' },
        h('div', { className: 'ac-project-head' },
          h('div', { className: 'ac-project-name', title: scan.project.rightLabel }, scan.project.name),
          scan.project.git ? h('span', { className: 'ac-git-badge' }, h(IconGit, { size: 12 }), scan.project.git.branch) : null
        ),
        h('div', { className: 'ac-project-stats' },
          stat(t, tr(t, 'total'), stats.scannedFiles),
          stat(t, tr(t, 'changedFiles'), stats.addedFiles + stats.removedFiles + stats.modifiedFiles, 'ac-warn-text'),
          stat(t, tr(t, 'addedLines'), '+' + formatNumber(stats.addedLines), 'ac-add-text'),
          stat(t, tr(t, 'deletedLines'), '-' + formatNumber(stats.deletedLines), 'ac-del-text')
        ),
        languages.length
          ? h('div', { className: 'ac-langs' }, languages.slice(0, 4).map((item) =>
              h('span', { className: 'ac-lang', key: item.name, title: `${item.files} files` }, item.name, h('b', null, item.files))))
          : null
      )
    }

    function stat(t, label, value, className) {
      return h('div', { className: 'ac-stat' },
        h('span', { className: 'ac-stat-label' }, label),
        h('span', { className: classNames('ac-stat-value', className) }, value)
      )
    }

    function FileList(props) {
      const { t, scan, selected, filter, setFilter, statusFilter, setStatusFilter, onOpen } = props
      const files = scan.files
      const changed = files.filter((file) => file.status !== 'unchanged').length
      const visible = useMemo(() => {
        const query = filter.trim().toLowerCase()
        return files.filter((file) => {
          if (statusFilter === 'changed' && file.status === 'unchanged') return false
          if (statusFilter !== 'all' && statusFilter !== 'changed' && file.status !== statusFilter) return false
          if (query && !file.path.toLowerCase().includes(query)) return false
          return true
        }).slice(0, 1200)
      }, [files, filter, statusFilter])

      const chips = [
        ['changed', tr(t, 'changed'), changed],
        ['modified', tr(t, 'modified'), files.filter((file) => file.status === 'modified').length],
        ['added', tr(t, 'added'), files.filter((file) => file.status === 'added').length],
        ['removed', tr(t, 'removed'), files.filter((file) => file.status === 'removed').length],
        ['unchanged', tr(t, 'unchanged'), files.filter((file) => file.status === 'unchanged').length],
        ['all', tr(t, 'all'), files.length],
      ]

      return h('div', { className: 'ac-sidebar' },
        h(ProjectSummary, { t, scan }),
        h('div', { className: 'ac-sidebar-head' },
          h('div', { className: 'ac-sidebar-title' }, tr(t, 'files'), h('span', { className: 'ac-count' }, visible.length)),
          h('div', { className: 'ac-chips' }, chips.map(([key, label, count]) => h('button', {
            key,
            type: 'button',
            className: classNames('ac-chip', statusFilter === key && 'ac-chip-active'),
            onClick: () => setStatusFilter(key),
          }, label, h('b', null, count))))
        ),
        h('div', { className: 'ac-search' },
          h(IconSearch, { size: 14 }),
          h('input', { value: filter, onChange: (event) => setFilter(event.target.value), placeholder: tr(t, 'filter'), spellCheck: false }),
          filter ? h('button', { type: 'button', className: 'ac-search-clear', onClick: () => setFilter('') }, h(IconClose, { size: 12 })) : null
        ),
        h('div', { className: 'ac-file-list' },
          visible.length === 0
            ? h('div', { className: 'ac-empty-small' }, filter ? '没有匹配的文件' : tr(t, 'diff.identical'))
            : visible.map((file) => h(FileRow, {
                key: file.path,
                t,
                file,
                active: selected === file.path,
                onClick: () => onOpen(file.path),
              })),
          visible.length >= 1200 ? h('div', { className: 'ac-empty-small' }, '只显示前 1200 个文件，请使用搜索过滤。') : null
        )
      )
    }

    function FileRow(props) {
      const { t, file, active, onClick } = props
      const severity = riskSeverity(file.risk)
      const status = file.status
      return h('button', {
        type: 'button',
        className: classNames('ac-file', active && 'ac-file-active'),
        onClick,
        title: file.path,
      },
        h('span', { className: classNames('ac-file-icon', 'ac-file-' + status) }, status === 'added' ? '+' : status === 'removed' ? '−' : status === 'modified' ? '~' : '='),
        h('div', { className: 'ac-file-main' },
          h('div', { className: 'ac-file-name' }, basename(file.path)),
          h('div', { className: 'ac-file-dir' }, dirname(file.path) || '.')
        ),
        h('div', { className: 'ac-file-meta' },
          file.added || file.deleted ? h('span', { className: 'ac-file-lines' },
            file.added ? h('i', { className: 'ac-add-text' }, '+' + file.added) : null,
            file.deleted ? h('i', { className: 'ac-del-text' }, '−' + file.deleted) : null
          ) : null,
          severity ? h('span', { className: classNames('ac-risk-dot', 'ac-risk-' + (severity === 3 ? 'high' : severity === 2 ? 'medium' : 'low')), title: tr(t, 'risk.' + (severity === 3 ? 'high' : severity === 2 ? 'medium' : 'low')) }) : null
        )
      )
    }

    function DiffViewer(props) {
      const {
        t, diff, loading, selectedFile, expanded, setExpanded,
        focus, setFocus, onAnalyze, onPrev, onNext, wrap, setWrap,
        scrollRef, analysisCache, onShowCached,
      } = props
      const rows = useMemo(() => diff ? buildDisplayRows(diff, expanded) : [], [diff, expanded])
      const hunkBlocks = useMemo(() => diff ? diff.blocks.map((block, index) => ({ block, index })).filter((item) => item.block.type === 'hunk') : [], [diff])

      if (loading) {
        return h('div', { className: 'ac-diff ac-diff-loading' },
          h(Spinner, { size: 22 }),
          h('div', null, tr(t, 'diff.loading'))
        )
      }
      if (!diff) {
        return h('div', { className: 'ac-diff ac-diff-empty' },
          h(IconSplit, { size: 34 }),
          h('div', { className: 'ac-empty-title' }, tr(t, 'diff.empty'))
        )
      }
      if (diff.binary) {
        return h('div', { className: 'ac-diff ac-diff-empty' },
          h(IconFile, { size: 34 }),
          h('div', { className: 'ac-empty-title' }, tr(t, 'diff.binary'))
        )
      }
      if (diff.truncated && diff.blocks.length === 0) {
        return h('div', { className: 'ac-diff ac-diff-empty' },
          h(IconWarning, { size: 34 }),
          h('div', { className: 'ac-empty-title' }, tr(t, 'diff.oversized'))
        )
      }

      const hasChanges = diff.blocks.some((block) => block.type === 'hunk')
      const currentHunk = focus?.hunkIndex ?? -1
      const entry = selectedFile

      return h('div', { className: 'ac-diff' },
        h('div', { className: 'ac-diff-head' },
          h('div', { className: 'ac-diff-file' },
            h('span', { className: classNames('ac-status-badge', 'ac-status-' + entry.status) }, tr(t, statusKey(entry.status))),
            h('span', { className: 'ac-diff-path', title: diff.path }, diff.path),
            h('span', { className: 'ac-diff-lang' }, diff.language),
            h('span', { className: 'ac-diff-counts' }, tr(t, 'diff.count', { added: diff.added, deleted: diff.deleted }))
          ),
          h('div', { className: 'ac-diff-actions' },
            h('button', { type: 'button', className: 'ac-btn ac-btn-ghost', onClick: onPrev, disabled: hunkBlocks.length === 0, title: 'F7' }, h(IconArrowLeft, { size: 15 }), tr(t, 'diff.prev')),
            h('button', { type: 'button', className: 'ac-btn ac-btn-ghost', onClick: onNext, disabled: hunkBlocks.length === 0, title: 'F8' }, h(IconArrowRight, { size: 15 }), tr(t, 'diff.next')),
            h('button', { type: 'button', className: classNames('ac-btn ac-btn-ghost', wrap && 'ac-btn-on'), onClick: () => setWrap(!wrap), title: tr(t, 'diff.wrap') }, tr(t, 'diff.wrap')),
            h('button', { type: 'button', className: 'ac-btn ac-btn-primary', onClick: () => onAnalyze(focus, null) }, h(IconSpark, { size: 15 }), tr(t, 'diff.hunkAnalyze'))
          )
        ),
        hasChanges ? null : h('div', { className: 'ac-identical-banner' }, h(IconSplit, { size: 16 }), tr(t, 'diff.identical')),
        diff.risk?.length ? h('div', { className: 'ac-risk-bar' }, diff.risk.slice(0, 5).map((risk, index) =>
          h('span', { key: index, className: classNames('ac-risk', 'ac-risk-' + risk.severity), title: risk.detail },
            h(IconWarning, { size: 12 }), risk.title))) : null,
        h('div', { className: 'ac-diff-columns' },
          h('div', { className: 'ac-col-head ac-col-left' }, h('span', null, tr(t, 'left')), entry.leftSize !== null ? h('small', null, formatBytes(entry.leftSize)) : null),
          h('div', { className: 'ac-col-head ac-col-right' }, h('span', null, tr(t, 'right')), entry.rightSize !== null ? h('small', null, formatBytes(entry.rightSize)) : null)
        ),
        h('div', { className: classNames('ac-diff-scroll', wrap && 'ac-wrap'), ref: scrollRef },
          h('div', { className: 'ac-diff-content' },
            rows.map((item, index) => renderDiffRow({
              item, index, t, focus, diff, analysisCache, filePath: selectedFile?.path ?? '',
              onClick: (row, event) => setFocus(row, event),
              onAnalyze,
              onToggle: (blockIndex) => setExpanded((previous) => {
                const next = new Set(previous)
                if (next.has(blockIndex)) next.delete(blockIndex); else next.add(blockIndex)
                return next
              }),
              onShowCached,
            })),
            diff.truncated ? h('div', { className: 'ac-truncated' }, tr(t, 'diff.truncated')) : null
          )
        )
      )
    }

    function renderDiffRow(props) {
      const { item, index, t, focus, analysisCache, filePath, onClick, onAnalyze, onToggle, onShowCached } = props
      if (item.kind === 'hunk-header') {
        return h('div', { key: 'h' + index, className: 'ac-hunk-head', 'data-block-index': item.blockIndex, 'data-display-index': index },
          h('span', null, item.header),
          h('button', { type: 'button', className: 'ac-hunk-btn', onClick: () => onAnalyze({ blockIndex: item.blockIndex, hunkIndex: item.hunkIndex }, null) }, h(IconSpark, { size: 12 }))
        )
      }
      if (item.kind === 'gap') {
        return h('div', { key: 'g' + index, className: 'ac-gap', 'data-block-index': item.blockIndex, 'data-display-index': index },
          h('button', { type: 'button', onClick: () => onToggle(item.blockIndex) }, h(IconChevronDown, { size: 13 }), tr(t, 'diff.gap', { count: item.count }))
        )
      }
      const row = item.row
      const focused = focus && focus.displayIndex === index
      const hunkKey = item.hunkIndex === null ? null : `${item.hunkIndex}`
      const cached = hunkKey !== null
        ? analysisCache.get(makeAnalysisKey(filePath, item, row))
        : null
      return h('div', {
        key: 'r' + index,
        className: classNames(
          'ac-code-row',
          row.kind === 'mod' && 'ac-row-mod',
          row.kind === 'del' && 'ac-row-del',
          row.kind === 'add' && 'ac-row-add',
          focused && 'ac-row-focus'
        ),
        'data-block-index': item.blockIndex,
        'data-display-index': index,
        onClick: (event) => onClick({
          blockIndex: item.blockIndex,
          hunkIndex: item.hunkIndex,
          displayIndex: index,
          leftNo: row.leftNo ?? null,
          rightNo: row.rightNo ?? null,
          rowKind: row.kind,
        }, event),
        onMouseEnter: (event) => { if (cached) onShowCached(item, row, event, cached) },
      },
        h('div', { className: classNames('ac-cell', 'ac-left', (row.kind === 'del' || row.kind === 'mod') && 'ac-cell-del') },
          h('span', { className: 'ac-ln' }, row.leftNo ?? ''),
          h('span', { className: 'ac-code' }, row.leftSegments ? renderSegments(row.leftSegments) : (row.leftText ?? ''))
        ),
        h('div', { className: classNames('ac-cell', 'ac-right', (row.kind === 'add' || row.kind === 'mod') && 'ac-cell-add') },
          h('span', { className: 'ac-ln' }, row.rightNo ?? ''),
          h('span', { className: 'ac-code' }, row.rightSegments ? renderSegments(row.rightSegments) : (row.rightText ?? ''))
        )
      )
    }

    function renderSegments(segments) {
      return segments.map((segment, index) => segment.changed
        ? h('span', { key: index, className: 'ac-word' }, segment.text)
        : segment.text)
    }

    function makeAnalysisKey(path, item, row) {
      return `${path}|${item.hunkIndex ?? 'file'}|${row?.leftNo ?? 0}|${row?.rightNo ?? 0}`
    }

    function buildDisplayRows(diff, expanded) {
      const rows = []
      diff.blocks.forEach((block, blockIndex) => {
        if (block.type === 'context') {
          const count = block.rows.length
          if (expanded.has(blockIndex) || count <= 8) {
            block.rows.forEach((row) => rows.push({ kind: 'code', row, blockIndex, hunkIndex: null }))
          } else {
            block.rows.slice(0, 3).forEach((row) => rows.push({ kind: 'code', row, blockIndex, hunkIndex: null }))
            rows.push({ kind: 'gap', blockIndex, count: count - 6 })
            block.rows.slice(count - 3).forEach((row) => rows.push({ kind: 'code', row, blockIndex, hunkIndex: null }))
          }
        } else {
          rows.push({ kind: 'hunk-header', blockIndex, hunkIndex: block.hunkIndex, header: block.header })
          block.rows.forEach((row) => rows.push({ kind: 'code', row, blockIndex, hunkIndex: block.hunkIndex }))
        }
      })
      return rows
    }

    function focusText(diffData, focusObj) {
      if (!diffData || !focusObj) return ''
      const block = diffData.blocks[focusObj.blockIndex]
      if (!block) return ''
      const lines = []
      if (block.type === 'hunk') lines.push(block.header)
      for (const row of block.rows) {
        if (row.kind === 'equal') lines.push('  ' + (row.leftText ?? ''))
        else if (row.kind === 'del') lines.push('- ' + (row.leftText ?? ''))
        else if (row.kind === 'add') lines.push('+ ' + (row.rightText ?? ''))
        else { lines.push('- ' + (row.leftText ?? '')); lines.push('+ ' + (row.rightText ?? '')) }
        if (lines.length >= 240) break
      }
      return lines.join('\n')
    }

    function AgentReview(props) {
      const { t, analysis, loading, meta, onAnalyze, onClose, hasFile, agentOpen } = props
      if (!agentOpen) return null
      return h('aside', { className: 'ac-agent' },
        h('div', { className: 'ac-agent-head' },
          h('div', { className: 'ac-agent-title' }, h(IconSpark, { size: 16 }), tr(t, 'agent')),
          h('div', { className: 'ac-agent-head-actions' },
            h('button', { type: 'button', className: 'ac-btn ac-btn-ghost ac-mini', onClick: onAnalyze, disabled: !hasFile || loading }, tr(t, 'agent.retry')),
            h('button', { type: 'button', className: 'ac-icon-btn ac-icon-btn-sm', onClick: onClose, title: tr(t, 'close') }, h(IconClose, { size: 14 }))
          )
        ),
        h('div', { className: 'ac-agent-scroll' },
          loading
            ? h('div', { className: 'ac-agent-loading' }, h(Spinner, { size: 20 }), h('div', null, tr(t, 'agent.loading')), h('div', { className: 'ac-muted' }, tr(t, 'agent.onlyOpened')))
            : analysis
              ? h(AnalysisBody, { t, analysis, meta, onAnalyze })
              : h('div', { className: 'ac-agent-empty' },
                  h(IconSpark, { size: 28 }),
                  h('p', null, tr(t, 'agent.empty')),
                  h('button', { type: 'button', className: 'ac-btn ac-btn-primary', onClick: onAnalyze, disabled: !hasFile }, tr(t, 'agent.analyzeFile')),
                  h('div', { className: 'ac-muted ac-agent-note' }, tr(t, 'agent.onlyOpened'))
                )
        )
      )
    }

    function AnalysisBody(props) {
      const { t, analysis, meta, onAnalyze } = props
      const coverage = analysis.coverage ?? 'uncertain'
      return h('div', { className: 'ac-analysis' },
        h('div', { className: 'ac-score-block' },
          h('div', { className: 'ac-score-ring', style: { '--ac-score': `${(Number(analysis.score) || 0) * 10}%` } },
            h('div', { className: 'ac-score-inner' },
              h('b', null, Number(analysis.score ?? 0).toFixed(1)),
              h('span', null, '/ 10')
            )
          ),
          h('div', { className: 'ac-score-meta' },
            h('div', { className: 'ac-coverage ac-coverage-' + coverage }, tr(t, coverageKey(coverage))),
            h('div', { className: 'ac-score-reason' }, analysis.scoreReason || '—')
          )
        ),
        h('div', { className: 'ac-verdict' }, analysis.verdict),
        analysis.coverageReason ? h('div', { className: 'ac-coverage-reason' }, analysis.coverageReason) : null,
        section(t, 'agent.strengths', analysis.strengths, 'ac-strengths'),
        analysis.removedCapabilities?.length ? section(t, 'agent.removed', analysis.removedCapabilities, 'ac-removed') : null,
        analysis.issues?.length ? h('div', { className: 'ac-section' },
          h('div', { className: 'ac-section-title' }, tr(t, 'agent.issues'), h('span', { className: 'ac-count' }, analysis.issues.length)),
          h('div', { className: 'ac-issues' }, analysis.issues.map((issue, index) => h('div', { key: index, className: 'ac-issue' },
            h('div', { className: 'ac-issue-head' },
              h('span', { className: classNames('ac-risk', 'ac-risk-' + issue.severity) }, tr(t, 'risk.' + (issue.severity ?? 'medium'))),
              h('b', null, issue.title)
            ),
            h('div', { className: 'ac-issue-detail' }, issue.detail),
            issue.line ? h('div', { className: 'ac-issue-line' }, 'line ' + issue.line) : null
          )))
        ) : null,
        section(t, 'agent.suggestions', analysis.suggestions, 'ac-suggestions'),
        h('div', { className: 'ac-agent-footer' },
          meta?.engine === 'llm'
            ? tr(t, 'agent.meta', { model: `${meta.provider ?? ''}/${meta.model ?? ''}`, elapsed: meta.elapsedMs ?? 0 })
            : tr(t, 'agent.heuristic'),
          h('button', { type: 'button', className: 'ac-btn ac-btn-ghost ac-mini', onClick: onAnalyze }, tr(t, 'agent.retry'))
        )
      )
    }

    function section(t, title, items, className) {
      if (!items || items.length === 0) return null
      return h('div', { className: classNames('ac-section', className) },
        h('div', { className: 'ac-section-title' }, tr(t, title)),
        h('ul', null, items.map((item, index) => h('li', { key: index }, item)))
      )
    }

    function AgentHoverCard(props) {
      const { t, card, onClose, onDetails, onMouseEnter, onMouseLeave } = props
      const width = 380
      const height = 260
      const x = Math.max(12, Math.min(card.x ?? 20, (window.innerWidth || 1200) - width - 12))
      const y = Math.max(170, Math.min(card.y ?? 100, (window.innerHeight || 800) - height - 12))
      const analysis = card.analysis
      return h('div', {
        className: classNames('ac-hover', card.loading && 'ac-hover-loading'),
        style: { left: x, top: y, width },
        onMouseEnter,
        onMouseLeave,
      },
        h('div', { className: 'ac-hover-head' },
          h('div', { className: 'ac-hover-title' }, h(IconSpark, { size: 14 }), tr(t, 'agent.cardTitle')),
          h('button', { type: 'button', className: 'ac-icon-btn ac-icon-btn-sm', onClick: onClose }, h(IconClose, { size: 13 }))
        ),
        card.loading
          ? h('div', { className: 'ac-hover-loading-body' }, h(Spinner, { size: 18 }), h('span', null, tr(t, 'agent.cardLoading')))
          : analysis
            ? h('div', { className: 'ac-hover-body' },
                h('div', { className: 'ac-hover-scoreline' },
                  h('span', { className: 'ac-hover-score' }, Number(analysis.score ?? 0).toFixed(1), h('small', null, '/10')),
                  h('span', { className: 'ac-coverage ac-coverage-' + (analysis.coverage ?? 'uncertain') }, tr(t, coverageKey(analysis.coverage))),
                  h('span', { className: 'ac-hover-source' }, analysis.source === 'heuristic' ? 'local' : 'agent')
                ),
                h('div', { className: 'ac-hover-verdict' }, analysis.verdict),
                analysis.issues?.[0] ? h('div', { className: 'ac-hover-issue' },
                  h('span', { className: classNames('ac-risk', 'ac-risk-' + (analysis.issues[0].severity ?? 'medium')) }, tr(t, 'risk.' + (analysis.issues[0].severity ?? 'medium'))),
                  h('span', null, analysis.issues[0].title)
                ) : null,
                h('button', { type: 'button', className: 'ac-btn ac-btn-ghost ac-mini', onClick: onDetails }, tr(t, 'agent.details'))
              )
            : null
      )
    }

    function FolderFloat(props) {
      const { t, position, setPosition, onClose, scan, selected, onOpen } = props
      const drag = useRef(null)
      const [query, setQuery] = useState('')
      useEffect(() => {
        const onMove = (event) => {
          if (!drag.current) return
          const nextX = Math.max(8, Math.min(window.innerWidth - 320, drag.current.x + event.clientX - drag.current.px))
          const nextY = Math.max(8, Math.min(window.innerHeight - 220, drag.current.y + event.clientY - drag.current.py))
          setPosition({ x: nextX, y: nextY })
        }
        const onUp = () => { drag.current = null }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        return () => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
        }
      }, [setPosition])

      const files = scan.files.filter((file) => !query || file.path.toLowerCase().includes(query.toLowerCase())).slice(0, 300)
      return h('div', { className: 'ac-float', style: { left: position.x, top: position.y } },
        h('div', {
          className: 'ac-float-head',
          onPointerDown: (event) => {
            drag.current = { x: position.x, y: position.y, px: event.clientX, py: event.clientY }
            event.currentTarget.setPointerCapture?.(event.pointerId)
          },
        },
          h('div', { className: 'ac-float-title' }, h(IconFolderFloat, { size: 15 }), tr(t, 'folderFloat.title')),
          h('button', { type: 'button', className: 'ac-icon-btn ac-icon-btn-sm', onClick: onClose }, h(IconClose, { size: 13 }))
        ),
        h('div', { className: 'ac-float-body' },
          h('div', { className: 'ac-float-stats' },
            h('span', null, formatNumber(scan.stats.scannedFiles), ' files'),
            h('span', { className: 'ac-add-text' }, '+', scan.stats.addedFiles),
            h('span', { className: 'ac-del-text' }, '−', scan.stats.removedFiles),
            h('span', { className: 'ac-warn-text' }, '~', scan.stats.modifiedFiles)
          ),
          h('div', { className: 'ac-search ac-search-small' },
            h(IconSearch, { size: 13 }),
            h('input', { value: query, onChange: (event) => setQuery(event.target.value), placeholder: tr(t, 'filter'), spellCheck: false })
          ),
          h('div', { className: 'ac-float-list' }, files.map((file) => h('button', {
            key: file.path,
            type: 'button',
            className: classNames('ac-float-file', selected === file.path && 'ac-file-active'),
            onClick: () => onOpen(file.path),
            title: file.path,
          },
            h('span', { className: classNames('ac-file-icon', 'ac-file-' + file.status) }, file.status === 'added' ? '+' : file.status === 'removed' ? '−' : file.status === 'modified' ? '~' : '='),
            h('span', { className: 'ac-float-name' }, file.path)
          ))),
          h('div', { className: 'ac-float-hint' }, tr(t, 'folderFloat.hint'))
        )
      )
    }

    function BrowseDialog(props) {
      const { t, browse, onClose } = props
      const [current, setCurrent] = useState(browse.initialPath ?? '')
      const [data, setData] = useState(null)
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState('')

      const load = (target) => {
        setLoading(true)
        setError('')
        api('/browse?files=1&path=' + encodeURIComponent(target ?? ''))
          .then((result) => {
            setData(result)
            setCurrent(result.path)
            setLoading(false)
          })
          .catch((cause) => {
            setError(cause.message)
            setLoading(false)
          })
      }

      useEffect(() => { load(browse.initialPath ?? '') }, [browse.initialPath])

      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])

      const choose = (entry) => {
        if (entry.type === 'directory') load(entry.path)
        else if (browse.selectMode === 'file') { browse.onSelect(entry.path); onClose() }
      }

      return h('div', { className: 'ac-modal-backdrop', onMouseDown: (event) => { if (event.target === event.currentTarget) onClose() } },
        h('div', { className: 'ac-modal' },
          h('div', { className: 'ac-modal-head' },
            h('div', { className: 'ac-modal-title' }, tr(t, 'browse.title', { kind: tr(t, browse.selectMode === 'file' ? 'browse.file' : 'browse.directory') })),
            h('button', { type: 'button', className: 'ac-icon-btn ac-icon-btn-sm', onClick: onClose }, h(IconClose, { size: 14 }))
          ),
          h('div', { className: 'ac-modal-path' },
            h('span', { className: 'ac-modal-path-label' }, tr(t, 'browse.path')),
            h('code', { title: current }, current || '—')
          ),
          h('div', { className: 'ac-modal-toolbar' },
            h('button', { type: 'button', className: 'ac-btn ac-btn-ghost', onClick: () => data?.parent && load(data.parent), disabled: !data?.parent }, h(IconArrowLeft, { size: 14 }), tr(t, 'browse.up')),
            h('span', { className: 'ac-modal-hint' }, loading ? tr(t, 'loading') : `${data?.entries?.length ?? 0} entries`)
          ),
          error ? h('div', { className: 'ac-modal-error' }, error) : null,
          h('div', { className: 'ac-modal-list' },
            loading
              ? h('div', { className: 'ac-empty-small' }, h(Spinner, { size: 18 }))
              : (data?.entries?.length ?? 0) === 0
                ? h('div', { className: 'ac-empty-small' }, tr(t, 'browse.empty'))
                : data.entries.map((entry) => h('button', {
                    key: entry.path,
                    type: 'button',
                    className: 'ac-modal-entry',
                    onClick: () => choose(entry),
                  },
                    entry.type === 'directory' ? h(IconFolder, { size: 16 }) : h(IconFile, { size: 16 }),
                    h('span', { className: 'ac-modal-entry-name' }, entry.name),
                    entry.type === 'file' && entry.size !== undefined ? h('span', { className: 'ac-muted' }, formatBytes(entry.size)) : null
                  ))
          ),
          h('div', { className: 'ac-modal-foot' },
            h('button', { type: 'button', className: 'ac-btn ac-btn-ghost', onClick: onClose }, tr(t, 'cancel')),
            browse.selectMode === 'directory'
              ? h('button', { type: 'button', className: 'ac-btn ac-btn-primary', onClick: () => { browse.onSelect(current); onClose() } }, tr(t, 'selectFolder'))
              : null
          )
        )
      )
    }

    function Spinner(props) {
      return h('span', { className: 'ac-spinner', style: { width: props.size ?? 16, height: props.size ?? 16 } })
    }

    class PageBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
        this.retry = () => this.setState({ error: null })
      }
      static getDerivedStateFromError(error) {
        return { error }
      }
      componentDidCatch(error, info) {
        try {
          console.error('agent-compare: page render failed', error, info)
        } catch {}
      }
      render() {
        if (this.state.error) {
          return h('div', { className: 'ac-root' },
            h('style', null, CSS),
            h('div', { className: 'ac-crash' },
              h('h2', null, '代码比对页面渲染出错'),
              h('p', null, '这是插件内部的渲染异常，不是 DSH 崩溃。请把下面的信息反馈给插件开发者。'),
              h('pre', null, String(this.state.error?.stack ?? this.state.error)),
              h('button', { type: 'button', className: 'ac-btn ac-btn-primary', onClick: this.retry }, '重试')
            )
          )
        }
        return this.props.children
      }
    }

    function AgentCompareRoot(props) {
      return h(PageBoundary, null, h(AgentComparePage, props))
    }

    // ---------------------------------------------------------------- page
    function AgentComparePage(props) {
      const t = (key) => (typeof props.t === 'function' ? props.t(key) : undefined)
      const pickDirectory = props.pickDirectory
      const [mode, setMode] = useState(() => load('mode', 'folders'))
      const [left, setLeft] = useState(() => load('left', ''))
      const [right, setRight] = useState(() => load('right', ''))
      const [repo, setRepo] = useState(() => load('repo', ''))
      const [base, setBase] = useState(() => load('base', 'HEAD'))
      const [autoAnalyze, setAutoAnalyze] = useState(() => load('auto', '1') !== '0')
      const [wrap, setWrap] = useState(() => load('wrap', '1') !== '0')
      const [scan, setScan] = useState(null)
      const [scanning, setScanning] = useState(false)
      const [selected, setSelected] = useState(null)
      const [diff, setDiff] = useState(null)
      const [diffLoading, setDiffLoading] = useState(false)
      const [analysis, setAnalysis] = useState(null)
      const [analysisMeta, setAnalysisMeta] = useState(null)
      const [analysisLoading, setAnalysisLoading] = useState(false)
      const [analysisError, setAnalysisError] = useState('')
      const [hoverCard, setHoverCard] = useState(null)
      const [agentOpen, setAgentOpen] = useState(true)
      const [floatOpen, setFloatOpen] = useState(false)
      const [floatPos, setFloatPos] = useState({ x: 360, y: 190 })
      const [focus, setFocusState] = useState(null)
      const [expanded, setExpanded] = useState(() => new Set())
      const [filter, setFilter] = useState('')
      const [statusFilter, setStatusFilter] = useState('changed')
      const [browse, setBrowse] = useState(null)
      const [health, setHealth] = useState(null)
      const [error, setError] = useState('')
      const [toast, setToast] = useState('')
      const [notice, setNotice] = useState('')

      const scanMeta = useRef(null)
      const diffReq = useRef(0)
      const analysisReq = useRef(0)
      const analysisCache = useRef(new Map())
      const analyzeTimer = useRef(null)
      const hoverTimer = useRef(null)
      const diffScrollRef = useRef(null)
      const toastTimer = useRef(null)

      useEffect(() => { save('mode', mode) }, [mode])
      useEffect(() => { save('left', left) }, [left])
      useEffect(() => { save('right', right) }, [right])
      useEffect(() => { save('repo', repo) }, [repo])
      useEffect(() => { save('base', base) }, [base])
      useEffect(() => { save('auto', autoAnalyze ? '1' : '0') }, [autoAnalyze])
      useEffect(() => { save('wrap', wrap ? '1' : '0') }, [wrap])

      useEffect(() => {
        let alive = true
        api('/health').then((value) => { if (alive) setHealth(value) }).catch(() => {})
        api('/defaults').then((value) => {
          if (!alive) return
          setRepo((previous) => previous || value.cwd || '')
        }).catch(() => {})
        return () => { alive = false }
      }, [])

      useEffect(() => () => {
        if (analyzeTimer.current) clearTimeout(analyzeTimer.current)
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        if (toastTimer.current) clearTimeout(toastTimer.current)
      }, [])

      function flash(message) {
        setToast(message)
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(''), 3600)
      }

      function resetAll() {
        setScan(null)
        setSelected(null)
        setDiff(null)
        setFocusState(null)
        setAnalysis(null)
        setAnalysisMeta(null)
        setAnalysisError('')
        setHoverCard(null)
        setError('')
        setExpanded(new Set())
        scanMeta.current = null
      }

      async function doScan() {
        setError('')
        setNotice('')
        if (mode === 'folders' && (!left.trim() || !right.trim())) {
          setError('请先选择左右两个文件夹。')
          return
        }
        if (mode === 'files' && (!left.trim() || !right.trim())) {
          setError('请先选择左右两个文件。')
          return
        }
        if (mode === 'git' && !repo.trim()) {
          setError('请先选择 Git 仓库路径。')
          return
        }
        if (health && health.engineReady === false) {
          setError(tr(t, 'engineMissing'))
          return
        }
        setScanning(true)
        setScan(null)
        setSelected(null)
        setDiff(null)
        setFocusState(null)
        setAnalysis(null)
        setHoverCard(null)
        setExpanded(new Set())
        const request = { mode, left: left.trim(), right: right.trim(), repo: repo.trim(), base: base.trim() || 'HEAD' }
        try {
          const result = await api('/scan', { method: 'POST', body: JSON.stringify(request) })
          setScan(result)
          scanMeta.current = { ...request, project: result.project }
          const first = result.files.find((file) => file.status !== 'unchanged') || result.files[0]
          setNotice(tr(t, 'notice.scanned', { changed: result.stats.addedFiles + result.stats.removedFiles + result.stats.modifiedFiles }))
          if (first) await openFile(first.path, result, request)
        } catch (cause) {
          setError(tr(t, 'error.scan') + '：' + cause.message)
        } finally {
          setScanning(false)
        }
      }

      async function openFile(filePath, sourceScan, sourceMeta) {
        const scanData = sourceScan || scan
        const meta = sourceMeta || scanMeta.current
        if (!scanData || !meta) return
        const entry = scanData.files.find((file) => file.path === filePath)
        if (!entry) return
        setSelected(filePath)
        setDiff(null)
        setDiffLoading(true)
        setFocusState(null)
        setAnalysis(null)
        setAnalysisMeta(null)
        setAnalysisError('')
        setHoverCard(null)
        setExpanded(new Set())
        setError('')
        const request = ++diffReq.current
        try {
          const body = { mode: meta.mode, left: meta.left, right: meta.right, repo: meta.repo, base: meta.base, path: entry.path }
          const data = await api('/diff', { method: 'POST', body: JSON.stringify(body) })
          if (request !== diffReq.current) return
          setDiff(data)
          setDiffLoading(false)
          if (autoAnalyze) {
            const hunk = data.blocks.find((block) => block.type === 'hunk')
            if (hunk) {
              const blockIndex = data.blocks.indexOf(hunk)
              const row = hunk.rows.find((item) => item.kind !== 'equal') || hunk.rows[0]
              const displayRows = buildDisplayRows(data, new Set())
              const displayIndex = displayRows.findIndex((item) => item.kind === 'code' && item.blockIndex === blockIndex)
              const nextFocus = {
                blockIndex,
                hunkIndex: hunk.hunkIndex,
                displayIndex: Math.max(0, displayIndex),
                leftNo: row.leftNo ?? null,
                rightNo: row.rightNo ?? null,
                rowKind: row.kind,
              }
              setFocusState(nextFocus)
              if (analyzeTimer.current) clearTimeout(analyzeTimer.current)
              analyzeTimer.current = setTimeout(() => {
                if (request !== diffReq.current) return
                showCard(data, entry, nextFocus, { x: Math.max(24, (window.innerWidth || 1200) - 420), y: 170 })
              }, 550)
            }
          }
        } catch (cause) {
          if (request !== diffReq.current) return
          setDiffLoading(false)
          setError(tr(t, 'error.diff') + '：' + cause.message)
        }
      }

      function makeFilePayload(entry, diffData) {
        return {
          ...entry,
          added: diffData?.added ?? entry.added,
          deleted: diffData?.deleted ?? entry.deleted,
          leftText: diffData?.leftText ?? '',
          rightText: diffData?.rightText ?? '',
          risk: entry.risk ?? [],
          symbolsAdded: entry.symbolsAdded ?? [],
          symbolsRemoved: entry.symbolsRemoved ?? [],
        }
      }

      async function showCard(diffData, entry, focusObj, anchor) {
        if (!diffData || !entry) return
        const key = makeAnalysisKey(entry.path, { hunkIndex: focusObj?.hunkIndex ?? 'file' }, focusObj ? { leftNo: focusObj.leftNo, rightNo: focusObj.rightNo } : {})
        const cached = analysisCache.current.get(key)
        const position = anchor || { x: Math.max(24, (window.innerWidth || 1200) - 420), y: 170 }
        if (cached) {
          setAnalysis(cached)
          setHoverCard({ ...position, analysis: cached, loading: false })
          return
        }
        if (focusObj?.hunkIndex === null || focusObj?.hunkIndex === undefined) {
          setHoverCard({ ...position, loading: true })
        } else {
          setHoverCard({ ...position, loading: true })
        }
        const request = ++analysisReq.current
        setAnalysisLoading(true)
        setAnalysisError('')
        try {
          const payload = {
            file: makeFilePayload(entry, diffData),
            project: scanMeta.current?.project ?? scan?.project ?? {},
            focus: focusObj
              ? {
                  blockIndex: focusObj.blockIndex,
                  hunkIndex: focusObj.hunkIndex,
                  leftNo: focusObj.leftNo,
                  rightNo: focusObj.rightNo,
                  text: focusText(diffData, focusObj),
                }
              : null,
          }
          const result = await api('/analyze', { method: 'POST', body: JSON.stringify(payload) })
          if (request !== analysisReq.current) return
          analysisCache.current.set(key, result.analysis)
          setAnalysis(result.analysis)
          setAnalysisMeta(result.meta)
          setHoverCard((previous) => previous ? { ...previous, loading: false, analysis: result.analysis, meta: result.meta } : null)
        } catch (cause) {
          if (request !== analysisReq.current) return
          setAnalysisError(cause.message)
          setHoverCard(null)
        } finally {
          if (request === analysisReq.current) setAnalysisLoading(false)
        }
      }

      function setFocus(nextFocus, event) {
        if (!nextFocus) return
        setFocusState(nextFocus)
        if (event?.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect()
          const position = { x: rect.right + 14, y: Math.max(170, rect.top - 20) }
          if (nextFocus.hunkIndex !== null && diff && selected) {
            const entry = scan?.files.find((file) => file.path === selected)
            if (!entry) return
            const key = makeAnalysisKey(selected, nextFocus, nextFocus)
            const cached = analysisCache.current.get(key)
            if (cached) {
              setHoverCard({ ...position, analysis: cached, loading: false })
            } else if (autoAnalyze) {
              if (analyzeTimer.current) clearTimeout(analyzeTimer.current)
              analyzeTimer.current = setTimeout(() => showCard(diff, entry, nextFocus, position), 420)
            }
          }
        }
      }

      function onShowCached(item, row, event, cached) {
        const rect = event.currentTarget.getBoundingClientRect()
        setHoverCard({ x: rect.right + 14, y: Math.max(170, rect.top - 20), analysis: cached, loading: false })
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        hoverTimer.current = setTimeout(() => {
          setHoverCard((previous) => previous?.analysis === cached ? null : previous)
        }, 1400)
      }

      function navigateHunk(direction) {
        if (!diff) return
        const hunks = diff.blocks.map((block, index) => ({ block, index })).filter((item) => item.block.type === 'hunk')
        if (hunks.length === 0) return
        let nextIndex = 0
        if (focus?.hunkIndex !== null && focus?.hunkIndex !== undefined) {
          nextIndex = focus.hunkIndex + direction
          if (nextIndex < 0) nextIndex = hunks.length - 1
          if (nextIndex >= hunks.length) nextIndex = 0
        } else {
          nextIndex = direction > 0 ? 0 : hunks.length - 1
        }
        const target = hunks[nextIndex]
        const row = target.block.rows.find((item) => item.kind !== 'equal') || target.block.rows[0]
        const displayRows = buildDisplayRows(diff, expanded)
        const displayIndex = displayRows.findIndex((item) => item.kind === 'code' && item.blockIndex === target.index)
        const nextFocus = {
          blockIndex: target.index,
          hunkIndex: target.block.hunkIndex,
          displayIndex: Math.max(0, displayIndex),
          leftNo: row?.leftNo ?? null,
          rightNo: row?.rightNo ?? null,
          rowKind: row?.kind,
        }
        setFocusState(nextFocus)
        const entry = scan?.files.find((file) => file.path === selected)
        if (entry && autoAnalyze) showCard(diff, entry, nextFocus, null)
        setTimeout(() => {
          const container = diffScrollRef.current
          const element = container?.querySelector('[data-block-index="' + target.index + '"]')
          if (container && element) {
            const delta = element.getBoundingClientRect().top - container.getBoundingClientRect().top
            container.scrollTop += delta - container.clientHeight / 2 + 40
          }
        }, 30)
      }

      function analyzeCurrent() {
        if (!diff || !selected) return
        const entry = scan?.files.find((file) => file.path === selected)
        if (!entry) return
        showCard(diff, entry, focus, null)
      }

      async function chooseFolder(setter, selectMode) {
        try {
          if (selectMode === 'directory' && typeof pickDirectory === 'function') {
            const picked = await pickDirectory()
            if (picked) setter(picked)
            return
          }
        } catch {
          // Fall through to the in-app browser.
        }
        setBrowse({
          selectMode: selectMode ?? 'directory',
          initialPath: repo || left || right || '',
          onSelect: (value) => setter(value),
        })
      }

      function onPick(setter) {
        chooseFolder(setter, 'directory')
      }

      function onBrowseFile(setter) {
        setBrowse({ selectMode: 'file', initialPath: repo || left || right || '', onSelect: (value) => setter(value) })
      }

      function swapSides() {
        if (mode === 'git') return
        setLeft(right)
        setRight(left)
        setScan(null)
        setSelected(null)
        setDiff(null)
      }

      const selectedEntry = scan?.files.find((file) => file.path === selected) ?? null
      const hasFile = Boolean(selectedEntry)
      const filePath = selectedEntry?.path ?? ''

      return h('div', { className: 'ac-root' },
        h('style', null, CSS),
        h(Toolbar, {
          t, mode, setMode, scanning, onScan: doScan, onReset: resetAll,
          autoAnalyze, setAutoAnalyze, agentOpen, setAgentOpen,
          floatOpen, setFloatOpen, health,
        }),
        h(PathBar, {
          t, mode, left, right, repo, base, setLeft, setRight, setRepo, setBase,
          onPick, onBrowseFile, onSwap: swapSides, scanning, onScan: doScan,
        }),
        error ? h('div', { className: 'ac-banner ac-banner-error' },
          h(IconWarning, { size: 15 }),
          h('span', null, error),
          h('button', { type: 'button', className: 'ac-icon-btn ac-icon-btn-sm', onClick: () => setError('') }, h(IconClose, { size: 13 }))
        ) : null,
        notice ? h('div', { className: 'ac-banner ac-banner-info' }, h('span', null, notice), h('button', { type: 'button', className: 'ac-icon-btn ac-icon-btn-sm', onClick: () => setNotice('') }, h(IconClose, { size: 13 }))) : null,
        !health?.engineReady ? h('div', { className: 'ac-banner ac-banner-warn' }, h(IconWarning, { size: 15 }), h('span', null, tr(t, 'engineMissing'))) : null,
        h('div', { className: 'ac-body' },
          scanning
            ? h('div', { className: 'ac-scan-overlay' }, h(Spinner, { size: 26 }), h('span', null, tr(t, 'scanning')))
            : null,
          !scan
            ? h('div', { className: 'ac-hero-wrap' }, h(EmptyState, { t, mode, setMode }))
            : h(React.Fragment, null,
                h(FileList, { t, scan, selected, filter, setFilter, statusFilter, setStatusFilter, onOpen: openFile }),
                h('main', { className: 'ac-main' },
                  h(DiffViewer, {
                    t, diff, loading: diffLoading, selectedFile: selectedEntry,
                    expanded, setExpanded, focus, setFocus,
                    onAnalyze: (focusObj, anchor) => {
                      const entry = scan?.files.find((file) => file.path === selected)
                      if (diff && entry) showCard(diff, entry, focusObj ?? focus, anchor)
                    },
                    onPrev: () => navigateHunk(-1), onNext: () => navigateHunk(1),
                    wrap, setWrap, scrollRef: diffScrollRef, analysisCache: analysisCache.current,
                    onShowCached,
                  })
                ),
                h(AgentReview, {
                  t, analysis, loading: analysisLoading, meta: analysisMeta, agentOpen,
                  hasFile, onAnalyze: analyzeCurrent, onClose: () => setAgentOpen(false),
                })
              )
        ),
        h('div', { className: 'ac-statusbar' },
          h('span', { className: 'ac-status-item' }, h(IconSplit, { size: 12 }), 'Agent Compare v0.1'),
          h('span', { className: 'ac-status-item' }, health?.engineReady ? 'Rust engine' : 'engine missing'),
          h('span', { className: 'ac-status-item' }, health?.model ? `${health.model.provider}/${health.model.model}` : 'model?'),
          h('span', { className: 'ac-status-spacer' }),
          analysisError ? h('span', { className: 'ac-status-item ac-del-text' }, tr(t, 'agent.error'), ': ', analysisError) : null,
          h('span', { className: 'ac-status-item ac-muted' }, tr(t, 'statusbar.hint'))
        ),
        floatOpen && scan ? h(FolderFloat, { t, position: floatPos, setPosition: setFloatPos, onClose: () => setFloatOpen(false), scan, selected, onOpen: openFile }) : null,
        hoverCard ? h(AgentHoverCard, {
          t, card: hoverCard,
          onClose: () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoverCard(null) },
          onDetails: () => { setAgentOpen(true); if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoverCard(null) },
          onMouseEnter: () => { if (hoverTimer.current) clearTimeout(hoverTimer.current) },
          onMouseLeave: () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => setHoverCard(null), 280) },
        }) : null,
        browse ? h(BrowseDialog, { t, browse, onClose: () => setBrowse(null) }) : null,
        toast ? h('div', { className: 'ac-toast' }, toast) : null
      )
    }

    const CSS = `
.ac-root {
  --ac-bg: var(--dsw-alias-bg-base, #17181c);
  --ac-layer: var(--dsw-alias-bg-layer-1, #1e2026);
  --ac-layer2: var(--dsw-alias-bg-layer-2, #24262e);
  --ac-border: var(--dsw-alias-border-l1, rgba(255,255,255,.10));
  --ac-border2: var(--dsw-alias-border-l2, rgba(255,255,255,.18));
  --ac-text: var(--dsw-alias-label-primary, #eceef4);
  --ac-muted: var(--dsw-alias-label-secondary, #9ca3b4);
  --ac-accent: var(--dsw-alias-brand-primary, #5b9dff);
  --ac-add: var(--dsw-alias-state-success-primary, #3fb950);
  --ac-del: var(--dsw-alias-state-error-primary, #f85149);
  --ac-warn: var(--dsw-alias-state-warn-primary, #d29922);
  --ac-mono: ui-monospace, SFMono-Regular, "Cascadia Code", Consolas, "Liberation Mono", monospace;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--ac-bg);
  color: var(--ac-text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  font-size: 13px;
  line-height: 1.45;
}
.ac-root *, .ac-root *::before, .ac-root *::after { box-sizing: border-box; }
.ac-root :where(button, input) { font: inherit; color: var(--ac-text); }
.ac-root button { cursor: pointer; }
.ac-root button:disabled { cursor: not-allowed; opacity: .45; }
.ac-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.ac-root ::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--ac-muted) 30%, transparent); border-radius: 8px; border: 2px solid transparent; background-clip: content-box; }
.ac-root ::-webkit-scrollbar-track { background: transparent; }

.ac-toolbar { display: flex; align-items: center; gap: 14px; padding: 9px 14px; border-bottom: 1px solid var(--ac-border); background: var(--ac-layer); flex: 0 0 auto; min-height: 58px; }
.ac-brand { display: flex; align-items: center; gap: 10px; min-width: 250px; }
.ac-brand-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--ac-accent) 16%, transparent); color: var(--ac-accent); flex: 0 0 auto; }
.ac-brand-text { min-width: 0; }
.ac-title { font-size: 14px; font-weight: 650; letter-spacing: .2px; }
.ac-subtitle { color: var(--ac-muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 330px; }
.ac-segmented { display: flex; align-items: center; gap: 2px; padding: 3px; border-radius: 9px; background: color-mix(in srgb, var(--ac-text) 6%, transparent); border: 1px solid var(--ac-border); }
.ac-seg { display: flex; align-items: center; gap: 6px; border: 0; border-radius: 7px; padding: 5px 10px; background: transparent; color: var(--ac-muted); font-size: 12px; }
.ac-seg:hover { color: var(--ac-text); background: color-mix(in srgb, var(--ac-text) 7%, transparent); }
.ac-seg-active { color: var(--ac-text); background: var(--ac-layer2); box-shadow: 0 1px 2px rgba(0,0,0,.18); }
.ac-toolbar-spacer { flex: 1; }
.ac-toolbar-actions { display: flex; align-items: center; gap: 6px; }
.ac-status-dot { font-family: var(--ac-mono); font-size: 9px; letter-spacing: .4px; padding: 2px 5px; border-radius: 5px; border: 1px solid var(--ac-border); color: var(--ac-muted); }
.ac-ok { color: var(--ac-add); border-color: color-mix(in srgb, var(--ac-add) 40%, transparent); }
.ac-bad { color: var(--ac-del); border-color: color-mix(in srgb, var(--ac-del) 40%, transparent); }
.ac-icon-btn { border: 1px solid transparent; background: transparent; border-radius: 7px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; color: var(--ac-muted); }
.ac-icon-btn:hover { color: var(--ac-text); background: color-mix(in srgb, var(--ac-text) 8%, transparent); }
.ac-icon-btn-on { color: var(--ac-accent); background: color-mix(in srgb, var(--ac-accent) 12%, transparent); border-color: color-mix(in srgb, var(--ac-accent) 28%, transparent); }
.ac-icon-btn-sm { width: 24px; height: 24px; }
.ac-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 7px; padding: 6px 11px; border: 1px solid transparent; background: transparent; color: var(--ac-text); font-size: 12px; white-space: nowrap; }
.ac-btn-ghost { color: var(--ac-muted); border-color: transparent; }
.ac-btn-ghost:hover { color: var(--ac-text); background: color-mix(in srgb, var(--ac-text) 8%, transparent); }
.ac-btn-primary { background: var(--ac-accent); color: #fff; border-color: color-mix(in srgb, var(--ac-accent) 70%, #000 10%); }
.ac-root .ac-btn-primary { color: #fff; }
.ac-btn-primary:hover { filter: brightness(1.08); }
.ac-btn-on { color: var(--ac-accent); background: color-mix(in srgb, var(--ac-accent) 12%, transparent); }
.ac-mini { padding: 3px 7px; font-size: 11px; }

.ac-paths { display: flex; align-items: flex-end; gap: 8px; padding: 9px 14px; border-bottom: 1px solid var(--ac-border); background: var(--ac-bg); flex: 0 0 auto; }
.ac-field { display: flex; flex-direction: column; gap: 4px; flex: 1 1 0; min-width: 0; }
.ac-field-base { flex: 0 0 150px; }
.ac-field-label { color: var(--ac-muted); font-size: 10px; text-transform: uppercase; letter-spacing: .5px; }
.ac-input-group { display: flex; align-items: center; }
.ac-input { width: 100%; height: 32px; border: 1px solid var(--ac-border); border-right: 0; border-radius: 7px 0 0 7px; background: var(--ac-layer); padding: 0 9px; outline: none; font-family: var(--ac-mono); font-size: 11.5px; min-width: 0; }
.ac-field-base .ac-input { border-right: 1px solid var(--ac-border); border-radius: 7px; }
.ac-input:focus { border-color: color-mix(in srgb, var(--ac-accent) 65%, transparent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ac-accent) 15%, transparent); }
.ac-input-btn { height: 32px; width: 32px; border: 1px solid var(--ac-border); border-radius: 0 7px 7px 0; background: var(--ac-layer); color: var(--ac-muted); display: flex; align-items: center; justify-content: center; }
.ac-input-btn:hover { color: var(--ac-text); background: var(--ac-layer2); }
.ac-swap-btn { height: 32px; width: 32px; flex: 0 0 32px; border-radius: 7px; border: 1px solid var(--ac-border); background: var(--ac-layer); color: var(--ac-muted); display: flex; align-items: center; justify-content: center; margin-bottom: 0; }
.ac-swap-btn:hover { color: var(--ac-text); background: var(--ac-layer2); }
.ac-path-actions { display: flex; align-items: center; gap: 8px; margin-bottom: 0; }
.ac-hint { color: var(--ac-muted); font-size: 11px; max-width: 220px; }

.ac-banner { display: flex; align-items: center; gap: 8px; padding: 7px 14px; border-bottom: 1px solid var(--ac-border); font-size: 12px; flex: 0 0 auto; }
.ac-banner span { flex: 1; min-width: 0; }
.ac-banner-error { background: color-mix(in srgb, var(--ac-del) 12%, transparent); color: var(--ac-del); }
.ac-banner-info { background: color-mix(in srgb, var(--ac-accent) 10%, transparent); color: var(--ac-text); }
.ac-banner-warn { background: color-mix(in srgb, var(--ac-warn) 10%, transparent); color: var(--ac-warn); }

.ac-body { position: relative; display: flex; flex: 1 1 auto; min-height: 0; }
.ac-scan-overlay { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: color-mix(in srgb, var(--ac-bg) 78%, transparent); backdrop-filter: blur(3px); color: var(--ac-muted); font-size: 13px; }

.ac-hero-wrap { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; padding: 28px; overflow: auto; }
.ac-hero { width: 100%; max-width: 760px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.ac-hero-mark { width: 76px; height: 76px; border-radius: 22px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--ac-accent) 12%, transparent); color: var(--ac-accent); margin-bottom: 18px; border: 1px solid color-mix(in srgb, var(--ac-accent) 22%, transparent); }
.ac-hero-title { font-size: 26px; letter-spacing: -.4px; margin: 0 0 8px; font-weight: 700; }
.ac-hero-desc { margin: 0 0 24px; color: var(--ac-muted); max-width: 560px; line-height: 1.7; font-size: 13px; }
.ac-hero-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; width: 100%; }
.ac-hero-card { text-align: left; border: 1px solid var(--ac-border); background: var(--ac-layer); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; transition: border-color .15s, transform .15s; }
.ac-hero-card:hover { border-color: color-mix(in srgb, var(--ac-accent) 45%, var(--ac-border)); transform: translateY(-1px); }
.ac-hero-card-active { border-color: var(--ac-accent); background: color-mix(in srgb, var(--ac-accent) 7%, var(--ac-layer)); }
.ac-hero-card-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--ac-accent) 12%, transparent); color: var(--ac-accent); }
.ac-hero-card-title { font-weight: 650; font-size: 13px; }
.ac-hero-card-desc { color: var(--ac-muted); font-size: 11.5px; line-height: 1.55; }
.ac-hero-tip { display: flex; align-items: center; gap: 7px; margin-top: 22px; padding: 9px 12px; border-radius: 9px; background: var(--ac-layer); border: 1px solid var(--ac-border); color: var(--ac-muted); font-size: 11.5px; text-align: left; }
.ac-hero-tip svg { color: var(--ac-accent); flex: 0 0 auto; }

.ac-sidebar { width: 310px; flex: 0 0 310px; min-width: 0; border-right: 1px solid var(--ac-border); display: flex; flex-direction: column; background: var(--ac-bg); }
.ac-project { padding: 12px 12px 10px; border-bottom: 1px solid var(--ac-border); }
.ac-project-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.ac-project-name { font-weight: 650; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.ac-git-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--ac-muted); border: 1px solid var(--ac-border); border-radius: 5px; padding: 1px 5px; max-width: 100px; overflow: hidden; white-space: nowrap; }
.ac-project-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 10px; }
.ac-stat { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; border-bottom: 1px dashed color-mix(in srgb, var(--ac-border) 60%, transparent); padding-bottom: 4px; }
.ac-stat-label { color: var(--ac-muted); font-size: 10.5px; }
.ac-stat-value { font-family: var(--ac-mono); font-size: 12px; font-weight: 650; }
.ac-add-text { color: var(--ac-add) !important; }
.ac-del-text { color: var(--ac-del) !important; }
.ac-warn-text { color: var(--ac-warn) !important; }
.ac-langs { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
.ac-lang { font-size: 10px; border: 1px solid var(--ac-border); border-radius: 5px; padding: 1px 5px; color: var(--ac-muted); display: inline-flex; gap: 4px; align-items: center; }
.ac-lang b { color: var(--ac-text); font-weight: 600; }
.ac-sidebar-head { padding: 10px 12px 6px; }
.ac-sidebar-title { display: flex; align-items: center; gap: 7px; font-weight: 650; font-size: 12px; margin-bottom: 7px; }
.ac-count { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 16px; padding: 0 5px; border-radius: 9px; background: color-mix(in srgb, var(--ac-text) 8%, transparent); color: var(--ac-muted); font-size: 10px; font-weight: 500; }
.ac-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.ac-chip { border: 1px solid var(--ac-border); background: transparent; border-radius: 999px; color: var(--ac-muted); font-size: 10.5px; padding: 2px 7px; display: inline-flex; align-items: center; gap: 4px; }
.ac-chip b { color: var(--ac-muted); font-weight: 500; }
.ac-chip:hover { color: var(--ac-text); border-color: var(--ac-border2); }
.ac-chip-active { color: var(--ac-text); background: color-mix(in srgb, var(--ac-accent) 12%, transparent); border-color: color-mix(in srgb, var(--ac-accent) 40%, transparent); }
.ac-search { display: flex; align-items: center; gap: 7px; margin: 4px 12px 8px; padding: 0 9px; height: 30px; border: 1px solid var(--ac-border); border-radius: 7px; background: var(--ac-layer); color: var(--ac-muted); }
.ac-search:focus-within { border-color: color-mix(in srgb, var(--ac-accent) 60%, transparent); }
.ac-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 11.5px; color: var(--ac-text); }
.ac-search-clear { border: 0; background: transparent; color: var(--ac-muted); padding: 0; line-height: 1; }
.ac-search-small { margin: 6px 0; height: 27px; }
.ac-file-list { flex: 1; min-height: 0; overflow: auto; padding: 2px 6px 10px; }
.ac-file { display: flex; align-items: center; gap: 8px; width: 100%; border: 0; border-radius: 7px; background: transparent; padding: 5px 7px; text-align: left; color: var(--ac-text); }
.ac-file:hover { background: color-mix(in srgb, var(--ac-text) 6%, transparent); }
.ac-file-active { background: color-mix(in srgb, var(--ac-accent) 14%, transparent); }
.ac-file-icon { width: 16px; height: 16px; flex: 0 0 16px; border-radius: 4px; font-family: var(--ac-mono); font-size: 10px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--ac-muted) 14%, transparent); color: var(--ac-muted); }
.ac-file-added { color: var(--ac-add); background: color-mix(in srgb, var(--ac-add) 14%, transparent); }
.ac-file-removed { color: var(--ac-del); background: color-mix(in srgb, var(--ac-del) 14%, transparent); }
.ac-file-modified { color: var(--ac-warn); background: color-mix(in srgb, var(--ac-warn) 14%, transparent); }
.ac-file-main { min-width: 0; flex: 1; }
.ac-file-name { font-size: 11.5px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ac-file-dir { font-size: 9.5px; color: var(--ac-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left; }
.ac-file-meta { display: flex; align-items: center; gap: 5px; flex: 0 0 auto; }
.ac-file-lines { display: inline-flex; gap: 4px; font-family: var(--ac-mono); font-size: 9.5px; }
.ac-file-lines i { font-style: normal; }
.ac-risk-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.ac-risk-high { background: var(--ac-del); }
.ac-risk-medium { background: var(--ac-warn); }
.ac-risk-low { background: var(--ac-muted); }
.ac-empty-small { padding: 22px 12px; text-align: center; color: var(--ac-muted); font-size: 11.5px; }

.ac-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.ac-diff { flex: 1; min-height: 0; display: flex; flex-direction: column; background: var(--ac-bg); }
.ac-diff-loading, .ac-diff-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--ac-muted); font-size: 12px; }
.ac-empty-title { color: var(--ac-text); font-size: 14px; font-weight: 600; }
.ac-diff-head { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid var(--ac-border); background: var(--ac-layer); flex: 0 0 auto; }
.ac-diff-file { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.ac-diff-path { font-family: var(--ac-mono); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ac-diff-lang { color: var(--ac-muted); font-size: 10px; border: 1px solid var(--ac-border); border-radius: 5px; padding: 1px 5px; flex: 0 0 auto; }
.ac-diff-counts { color: var(--ac-muted); font-size: 10.5px; flex: 0 0 auto; }
.ac-diff-actions { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
.ac-status-badge { font-size: 10px; padding: 2px 6px; border-radius: 5px; flex: 0 0 auto; }
.ac-status-added { color: var(--ac-add); background: color-mix(in srgb, var(--ac-add) 14%, transparent); }
.ac-status-removed { color: var(--ac-del); background: color-mix(in srgb, var(--ac-del) 14%, transparent); }
.ac-status-modified { color: var(--ac-warn); background: color-mix(in srgb, var(--ac-warn) 14%, transparent); }
.ac-status-unchanged { color: var(--ac-muted); background: color-mix(in srgb, var(--ac-muted) 14%, transparent); }
.ac-identical-banner { display: flex; align-items: center; gap: 7px; padding: 6px 12px; color: var(--ac-muted); font-size: 11px; border-bottom: 1px solid var(--ac-border); background: color-mix(in srgb, var(--ac-text) 3%, transparent); }
.ac-risk-bar { display: flex; flex-wrap: wrap; gap: 5px; padding: 5px 12px; border-bottom: 1px solid var(--ac-border); background: var(--ac-layer); }
.ac-risk { display: inline-flex; align-items: center; gap: 4px; border-radius: 5px; padding: 1px 6px; font-size: 10px; border: 1px solid var(--ac-border); }
.ac-risk.ac-risk-high { color: var(--ac-del); background: color-mix(in srgb, var(--ac-del) 10%, transparent); border-color: color-mix(in srgb, var(--ac-del) 25%, transparent); }
.ac-risk.ac-risk-medium { color: var(--ac-warn); background: color-mix(in srgb, var(--ac-warn) 10%, transparent); border-color: color-mix(in srgb, var(--ac-warn) 25%, transparent); }
.ac-risk.ac-risk-low { color: var(--ac-muted); background: color-mix(in srgb, var(--ac-muted) 10%, transparent); }
.ac-diff-columns { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--ac-border); background: var(--ac-layer2); flex: 0 0 auto; }
.ac-col-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 10px; font-size: 10.5px; color: var(--ac-muted); border-right: 1px solid var(--ac-border); }
.ac-col-head small { font-family: var(--ac-mono); font-size: 9.5px; }
.ac-col-right { border-right: 0; }
.ac-diff-scroll { flex: 1; min-height: 0; overflow: auto; background: var(--ac-bg); }
.ac-diff-content { min-width: 100%; }
.ac-code-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid color-mix(in srgb, var(--ac-border) 45%, transparent); cursor: pointer; }
.ac-code-row:hover { background: color-mix(in srgb, var(--ac-text) 3%, transparent); }
.ac-cell { display: flex; align-items: flex-start; min-width: 0; border-right: 1px solid var(--ac-border); }
.ac-cell.ac-right { border-right: 0; }
.ac-cell-del { background: color-mix(in srgb, var(--ac-del) 11%, transparent); }
.ac-cell-add { background: color-mix(in srgb, var(--ac-add) 11%, transparent); }
.ac-ln { width: 46px; flex: 0 0 46px; text-align: right; padding: 1px 10px 1px 0; color: var(--ac-muted); font-family: var(--ac-mono); font-size: 10px; line-height: 20px; user-select: none; opacity: .62; }
.ac-code { flex: 1; min-width: 0; padding: 1px 0; font-family: var(--ac-mono); font-size: 11.5px; line-height: 20px; white-space: pre; overflow: hidden; }
.ac-diff-scroll.ac-wrap .ac-code { white-space: pre-wrap; overflow-wrap: anywhere; }
.ac-word { background: color-mix(in srgb, var(--ac-accent) 30%, transparent); border-radius: 2px; }
.ac-row-mod .ac-word { background: color-mix(in srgb, var(--ac-warn) 28%, transparent); }
.ac-row-focus { outline: 1px solid var(--ac-accent); outline-offset: -1px; background: color-mix(in srgb, var(--ac-accent) 8%, transparent); }
.ac-hunk-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 10px; background: var(--ac-layer2); color: var(--ac-muted); border-top: 1px solid var(--ac-border); border-bottom: 1px solid var(--ac-border); font-family: var(--ac-mono); font-size: 10px; }
.ac-hunk-btn { border: 1px solid var(--ac-border); background: var(--ac-layer); color: var(--ac-accent); border-radius: 5px; width: 22px; height: 18px; display: inline-flex; align-items: center; justify-content: center; }
.ac-gap { display: flex; justify-content: center; padding: 2px 0; background: var(--ac-layer); border-bottom: 1px solid color-mix(in srgb, var(--ac-border) 45%, transparent); }
.ac-gap button { border: 0; background: transparent; color: var(--ac-muted); font-size: 10.5px; display: inline-flex; align-items: center; gap: 4px; }
.ac-gap button:hover { color: var(--ac-text); }
.ac-truncated { padding: 10px; text-align: center; color: var(--ac-warn); font-size: 11px; }

.ac-agent { width: 340px; flex: 0 0 340px; min-width: 0; border-left: 1px solid var(--ac-border); display: flex; flex-direction: column; background: var(--ac-layer); }
.ac-agent-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 11px; border-bottom: 1px solid var(--ac-border); }
.ac-agent-title { display: flex; align-items: center; gap: 7px; font-weight: 650; font-size: 12px; color: var(--ac-text); }
.ac-agent-title svg { color: var(--ac-accent); }
.ac-agent-head-actions { display: flex; align-items: center; gap: 2px; }
.ac-agent-scroll { flex: 1; min-height: 0; overflow: auto; padding: 12px; }
.ac-agent-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 30px 10px; color: var(--ac-muted); text-align: center; font-size: 11.5px; }
.ac-agent-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 26px 8px; text-align: center; color: var(--ac-muted); }
.ac-agent-empty svg { color: var(--ac-accent); opacity: .8; }
.ac-agent-empty p { margin: 0; font-size: 11.5px; line-height: 1.65; }
.ac-agent-note { font-size: 10px; max-width: 240px; }
.ac-agent-footer { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; border-top: 1px solid var(--ac-border); margin-top: 12px; padding-top: 8px; color: var(--ac-muted); font-size: 10px; }
.ac-score-block { display: flex; align-items: center; gap: 12px; }
.ac-score-ring { width: 78px; height: 78px; flex: 0 0 78px; border-radius: 50%; padding: 5px; background: conic-gradient(var(--ac-accent) var(--ac-score, 0%), color-mix(in srgb, var(--ac-border) 75%, transparent) 0); }
.ac-score-inner { width: 100%; height: 100%; border-radius: 50%; background: var(--ac-layer); display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.1; }
.ac-score-inner b { font-size: 21px; font-weight: 700; }
.ac-score-inner span { font-size: 9px; color: var(--ac-muted); }
.ac-score-meta { min-width: 0; }
.ac-coverage { display: inline-flex; align-items: center; font-size: 10px; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--ac-border); color: var(--ac-muted); }
.ac-coverage-full { color: var(--ac-add); border-color: color-mix(in srgb, var(--ac-add) 35%, transparent); background: color-mix(in srgb, var(--ac-add) 10%, transparent); }
.ac-coverage-partial { color: var(--ac-warn); border-color: color-mix(in srgb, var(--ac-warn) 35%, transparent); background: color-mix(in srgb, var(--ac-warn) 10%, transparent); }
.ac-coverage-none { color: var(--ac-del); border-color: color-mix(in srgb, var(--ac-del) 35%, transparent); background: color-mix(in srgb, var(--ac-del) 10%, transparent); }
.ac-coverage-uncertain { color: var(--ac-muted); background: color-mix(in srgb, var(--ac-muted) 10%, transparent); }
.ac-score-reason { color: var(--ac-muted); font-size: 10.5px; margin-top: 6px; line-height: 1.5; }
.ac-verdict { margin: 14px 0 6px; font-size: 13px; font-weight: 600; line-height: 1.5; }
.ac-coverage-reason { color: var(--ac-muted); font-size: 11px; line-height: 1.6; border-left: 2px solid var(--ac-border2); padding-left: 8px; }
.ac-section { margin-top: 14px; }
.ac-section-title { display: flex; align-items: center; gap: 6px; color: var(--ac-muted); font-size: 10px; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.ac-section ul { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 4px; }
.ac-section li { font-size: 11.5px; line-height: 1.55; }
.ac-strengths li::marker { color: var(--ac-add); }
.ac-suggestions li::marker { color: var(--ac-accent); }
.ac-removed li::marker { color: var(--ac-del); }
.ac-issues { display: flex; flex-direction: column; gap: 7px; }
.ac-issue { border: 1px solid var(--ac-border); border-radius: 8px; padding: 7px 8px; background: var(--ac-bg); }
.ac-issue-head { display: flex; align-items: center; gap: 6px; font-size: 11.5px; }
.ac-issue-head b { font-weight: 600; }
.ac-issue-detail { color: var(--ac-muted); font-size: 10.5px; line-height: 1.55; margin-top: 4px; }
.ac-issue-line { color: var(--ac-muted); font-family: var(--ac-mono); font-size: 9.5px; margin-top: 3px; }
.ac-muted { color: var(--ac-muted); }

.ac-hover { position: fixed; z-index: 900; border: 1px solid var(--ac-border2); border-radius: 12px; background: var(--ac-layer); box-shadow: 0 18px 50px rgba(0,0,0,.42); overflow: hidden; }
.ac-hover-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid var(--ac-border); }
.ac-hover-title { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 650; }
.ac-hover-title svg { color: var(--ac-accent); }
.ac-hover-body { padding: 10px 12px 12px; }
.ac-hover-loading-body { display: flex; align-items: center; gap: 10px; padding: 20px 14px; color: var(--ac-muted); font-size: 11.5px; }
.ac-hover-scoreline { display: flex; align-items: center; gap: 8px; }
.ac-hover-score { font-size: 24px; font-weight: 700; line-height: 1; }
.ac-hover-score small { font-size: 10px; color: var(--ac-muted); font-weight: 400; margin-left: 2px; }
.ac-hover-source { margin-left: auto; color: var(--ac-muted); font-size: 9px; text-transform: uppercase; letter-spacing: .4px; }
.ac-hover-verdict { margin: 8px 0; font-size: 12px; line-height: 1.5; }
.ac-hover-issue { display: flex; align-items: flex-start; gap: 6px; font-size: 10.5px; color: var(--ac-muted); border-top: 1px solid var(--ac-border); padding-top: 7px; }

.ac-float { position: fixed; z-index: 800; width: 320px; max-height: min(620px, 76vh); display: flex; flex-direction: column; border: 1px solid var(--ac-border2); border-radius: 12px; background: var(--ac-layer); box-shadow: 0 20px 60px rgba(0,0,0,.45); overflow: hidden; }
.ac-float-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--ac-border); cursor: grab; user-select: none; }
.ac-float-head:active { cursor: grabbing; }
.ac-float-title { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 650; }
.ac-float-body { display: flex; flex-direction: column; min-height: 0; padding: 8px 10px 10px; }
.ac-float-stats { display: flex; align-items: center; gap: 8px; font-family: var(--ac-mono); font-size: 10px; color: var(--ac-muted); margin-bottom: 4px; }
.ac-float-list { overflow: auto; min-height: 80px; max-height: 360px; display: flex; flex-direction: column; gap: 1px; }
.ac-float-file { border: 0; background: transparent; border-radius: 6px; display: flex; align-items: center; gap: 6px; padding: 3px 5px; text-align: left; width: 100%; }
.ac-float-file:hover { background: color-mix(in srgb, var(--ac-text) 8%, transparent); }
.ac-float-name { font-family: var(--ac-mono); font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ac-float-hint { color: var(--ac-muted); font-size: 9.5px; margin-top: 6px; border-top: 1px solid var(--ac-border); padding-top: 6px; }

.ac-modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.42); display: flex; align-items: center; justify-content: center; padding: 24px; }
.ac-modal { width: min(680px, 100%); max-height: 78vh; display: flex; flex-direction: column; background: var(--ac-layer); border: 1px solid var(--ac-border2); border-radius: 13px; box-shadow: 0 28px 80px rgba(0,0,0,.5); overflow: hidden; }
.ac-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 13px; border-bottom: 1px solid var(--ac-border); }
.ac-modal-title { font-weight: 650; font-size: 13px; }
.ac-modal-path { display: flex; align-items: center; gap: 8px; padding: 7px 13px; border-bottom: 1px solid var(--ac-border); font-size: 11px; }
.ac-modal-path-label { color: var(--ac-muted); flex: 0 0 auto; }
.ac-modal-path code { font-family: var(--ac-mono); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ac-modal-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 6px 13px; border-bottom: 1px solid var(--ac-border); }
.ac-modal-hint { color: var(--ac-muted); font-size: 10px; }
.ac-modal-error { color: var(--ac-del); padding: 8px 13px; font-size: 11px; }
.ac-modal-list { flex: 1; min-height: 160px; overflow: auto; padding: 5px 7px; }
.ac-modal-entry { display: flex; align-items: center; gap: 8px; width: 100%; border: 0; border-radius: 6px; background: transparent; padding: 5px 7px; text-align: left; font-size: 11.5px; }
.ac-modal-entry:hover { background: color-mix(in srgb, var(--ac-text) 8%, transparent); }
.ac-modal-entry svg { color: var(--ac-muted); flex: 0 0 auto; }
.ac-modal-entry-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ac-modal-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 9px 13px; border-top: 1px solid var(--ac-border); }

.ac-spinner { display: inline-block; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--ac-muted) 28%, transparent); border-top-color: var(--ac-accent); animation: ac-spin .75s linear infinite; flex: 0 0 auto; }
@keyframes ac-spin { to { transform: rotate(360deg); } }
.ac-toast { position: fixed; right: 18px; bottom: 38px; z-index: 1200; padding: 8px 12px; border-radius: 8px; background: var(--ac-layer2); border: 1px solid var(--ac-border2); color: var(--ac-text); font-size: 11.5px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.ac-crash { height: 100%; overflow: auto; padding: 32px; }
.ac-crash h2 { margin: 0 0 8px; font-size: 18px; }
.ac-crash p { color: var(--ac-muted); font-size: 12px; }
.ac-crash pre { margin: 16px 0; padding: 14px; border-radius: 8px; background: var(--ac-layer); border: 1px solid var(--ac-border); color: var(--ac-del); font-family: var(--ac-mono); font-size: 11px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.ac-statusbar { display: flex; align-items: center; gap: 12px; padding: 3px 12px; border-top: 1px solid var(--ac-border); background: var(--ac-layer); color: var(--ac-muted); font-size: 9.5px; flex: 0 0 auto; min-height: 22px; }
.ac-status-item { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 42%; }
.ac-status-spacer { flex: 1; }
@media (max-width: 1120px) {
  .ac-agent { width: 300px; flex-basis: 300px; }
  .ac-sidebar { width: 270px; flex-basis: 270px; }
  .ac-subtitle { display: none; }
}
@media (max-width: 900px) {
  .ac-agent { display: none; }
  .ac-sidebar { width: 240px; flex-basis: 240px; }
  .ac-hero-cards { grid-template-columns: 1fr; }
}
`

    const inject = ['slots', 'locale', 'uiWorkspace']

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'agent-compare: dictionaries')
      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: 'agent-compare',
        order: 20,
        locale: NS,
        inject: () => ({
          pickDirectory: () => ctx.uiWorkspace.pickDirectory(),
        }),
      }, AgentCompareRoot)), 'agent-compare: main panel')
      ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: 'agent-compare',
        order: 20,
        locale: NS,
        label: () => t('panel'),
      }, PanelIcon)), 'agent-compare: sidebar entry')
    }

    return { inject, apply }
  },
})
