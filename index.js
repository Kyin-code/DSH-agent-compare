import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENGINE_NAME = process.platform === 'win32' ? 'agent-compare-engine.exe' : 'agent-compare-engine'
const ENGINE_CANDIDATES = [
  path.join(__dirname, 'engine', 'bin', ENGINE_NAME),
  path.join(__dirname, 'engine', 'target', 'release', ENGINE_NAME),
  path.join(__dirname, 'engine', 'target', 'debug', ENGINE_NAME),
]

export const inject = ['webServer']

export function apply(ctx, config = {}) {
  const route = {
    kind: 'prefix',
    path: '/agent-compare/api',
    handler: (req, res) => handle(ctx, config, req, res).catch((error) => {
      sendJson(res, 500, { ok: false, error: String(error?.stack ?? error) })
    }),
  }
  ctx.effect(() => ctx.webServer.register(route), 'agent-compare: http routes')

  // Warm the engine lookup once so a missing binary is visible in the log and
  // the health endpoint can report it without spawning a process.
  const engine = resolveEngine()
  if (!engine) {
    console.warn('[agent-compare] engine binary not found; run scripts/build-engine.ps1')
  }
}

function resolveEngine() {
  for (const candidate of ENGINE_CANDIDATES) {
    try {
      if (fs.existsSync(candidate)) return candidate
    } catch {
      // Ignore and try the next location.
    }
  }
  return null
}

async function handle(ctx, config, req, res) {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  const endpoint = url.pathname.replace(/^\/agent-compare\/api\/?/, '').replace(/\/$/, '')
  const method = req.method ?? 'GET'

  if (method === 'GET' && (endpoint === 'health' || endpoint === '')) {
    const engine = resolveEngine()
    const selection = readSelection(ctx)
    sendJson(res, 200, {
      ok: true,
      version: '0.1.0',
      engine: engine ?? null,
      engineReady: Boolean(engine),
      llm: Boolean(ctx.get('llm')),
      model: selection,
      platform: process.platform,
    })
    return
  }

  if (method === 'GET' && endpoint === 'defaults') {
    sendJson(res, 200, {
      ok: true,
      cwd: process.cwd(),
      platform: process.platform,
      home: process.env.USERPROFILE ?? process.env.HOME ?? '',
      engine: resolveEngine(),
      model: readSelection(ctx),
    })
    return
  }

  if (method === 'GET' && endpoint === 'browse') {
    sendJson(res, 200, browse(url.searchParams.get('path') ?? '', url.searchParams.get('files') === '1'))
    return
  }

  if (method === 'POST' && endpoint === 'scan') {
    const body = await readJson(req)
    const args = ['scan', '--mode', clean(body.mode) ?? 'folders']
    pushArg(args, 'left', body.left)
    pushArg(args, 'right', body.right)
    pushArg(args, 'repo', body.repo)
    pushArg(args, 'base', body.base)
    if (body.maxFileBytes) pushArg(args, 'max-file-bytes', Math.max(1024, Number(body.maxFileBytes) | 0))
    const result = await runEngine(args)
    sendJson(res, 200, result)
    return
  }

  if (method === 'POST' && endpoint === 'diff') {
    const body = await readJson(req)
    const mode = clean(body.mode) ?? 'folders'
    const args = ['diff', '--mode', mode]
    if (mode === 'folders') {
      // Folder comparisons address one file relative to both roots.
      pushArg(args, 'left', body.left && body.path ? path.join(body.left, body.path) : body.left)
      pushArg(args, 'right', body.right && body.path ? path.join(body.right, body.path) : body.right)
    } else {
      pushArg(args, 'left', body.left)
      pushArg(args, 'right', body.right)
      pushArg(args, 'repo', body.repo)
      pushArg(args, 'base', body.base)
      pushArg(args, 'path', body.path)
    }
    if (body.maxFileBytes) pushArg(args, 'max-file-bytes', Math.max(1024, Number(body.maxFileBytes) | 0))
    sendJson(res, 200, await runEngine(args))
    return
  }

  if (method === 'POST' && endpoint === 'analyze') {
    const body = await readJson(req)
    const analysis = await analyze(ctx, config, body)
    sendJson(res, 200, analysis)
    return
  }

  sendJson(res, 404, { ok: false, error: `unknown endpoint: ${endpoint}` })
}

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function pushArg(args, key, value) {
  if (value === undefined || value === null || value === '') return
  args.push(`--${key}`, String(value))
}

function readSelection(ctx) {
  try {
    const selection = ctx.get('agentDefaultModel')?.currentSelection?.()
    if (!selection || !selection.provider || !selection.model) return null
    return {
      provider: selection.provider,
      model: selection.model,
      ...(selection.reasoningEffort ? { reasoningEffort: selection.reasoningEffort } : {}),
    }
  } catch {
    return null
  }
}

function runEngine(args) {
  const engine = resolveEngine()
  if (!engine) {
    return Promise.resolve({
      ok: false,
      error:
        'Rust engine binary is missing. Build it with `cargo build --release` in engine/ and copy it to engine/bin/.',
    })
  }
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let settled = false
    const child = spawn(engine, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { child.kill() } catch {}
      resolve({ ok: false, error: `engine timed out after 120s: ${args.join(' ')}` })
    }, 120_000)
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
      if (stdout.length > 32 * 1024 * 1024) {
        try { child.kill() } catch {}
      }
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ok: false, error: `failed to start engine: ${error.message}` })
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const text = stdout.trim()
      if (text) {
        try {
          const parsed = JSON.parse(text)
          if (parsed && parsed.ok === false) {
            resolve({ ok: false, error: parsed.error ?? stderr.trim() ?? 'engine failed' })
            return
          }
          resolve(parsed)
          return
        } catch {
          // Fall through to a diagnostic below.
        }
      }
      resolve({
        ok: false,
        error: `engine exited with code ${code}: ${stderr.trim() || stdout.slice(0, 2000) || 'no output'}`,
      })
    })
  })
}

function sendJson(res, status, payload) {
  const text = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  })
  res.end(text)
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 24 * 1024 * 1024) throw new Error('request body too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  const text = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`invalid JSON body: ${error.message}`)
  }
}

function browse(input, includeFiles) {
  let target = input
  if (!target) target = process.cwd()
  try {
    const stat = fs.statSync(target)
    if (stat.isFile()) target = path.dirname(target)
  } catch {
    return { ok: false, error: `目录不存在: ${target}` }
  }
  try {
    const entries = fs.readdirSync(target, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith('.'))
      .map((entry) => {
        const full = path.join(target, entry.name)
        let size
        try { size = entry.isFile() ? fs.statSync(full).size : undefined } catch {}
        return {
          name: entry.name,
          path: full,
          type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other',
          size,
        }
      })
      .filter((entry) => entry.type === 'directory' || (includeFiles && entry.type === 'file'))
      .sort((left, right) => {
        if (left.type !== right.type) return left.type === 'directory' ? -1 : 1
        return left.name.localeCompare(right.name, 'zh-CN')
      })
      .slice(0, 2000)
    const parent = path.dirname(target)
    return {
      ok: true,
      path: target,
      parent: parent === target ? null : parent,
      entries,
      truncated: entries.length >= 2000,
    }
  } catch (error) {
    return { ok: false, error: `无法读取目录: ${error.message}` }
  }
}

const SYSTEM_PROMPT = `你是一位严谨的资深代码评审专家，服务于 DSH（DeepSeek Harness）的代码比对工具。
你会收到旧代码（左侧）、新代码（右侧）、用户当前聚焦的差异片段、项目概览，以及比对引擎给出的确定性线索。
必须遵守以下规则：
1. 先判断新代码是否完全覆盖旧代码的功能，coverage 只能是 full / partial / none / uncertain。若不能完全覆盖，必须在 removedCapabilities 中逐条指出缺失的功能、行为或边界条件。
2. 若新代码能完全覆盖旧代码，比较新旧代码的优劣（strengths 写新代码的优点，issues 写仍然存在的问题）；若不能完全覆盖，优先指出功能缺失与回归风险。
3. 对新代码评分（1-10，允许一位小数），scoreReason 必须精简，评分维度包含正确性、可维护性、可读性、性能、安全、测试与边界。
4. 只评价用户已经打开并聚焦的文件或片段；不要假设未打开文件的内容。项目概览仅用于判断影响范围。
5. 引擎线索（如“旧符号消失”“疑似密钥”）只是启发式证据，不能替代你的判断；若与代码事实冲突，以代码为准。
6. 只输出一个 JSON 对象，不要 Markdown 代码块，不要输出任何额外文字。

JSON 结构：
{
  "coverage": "full | partial | none | uncertain",
  "coverageReason": "一句话说明覆盖判断的依据",
  "verdict": "一句话结论",
  "score": 1.0,
  "scoreReason": "1-2 句评分理由",
  "strengths": ["新代码的优点"],
  "issues": [{"severity": "high | medium | low", "title": "问题标题", "detail": "具体说明", "line": 12, "side": "left | right | both"}],
  "suggestions": ["可执行的修改建议"],
  "removedCapabilities": ["无法覆盖的旧功能"],
  "reviewScope": "file | hunk"
}`

function clip(text, max) {
  if (typeof text !== 'string') return ''
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n… [内容已截断，当前片段共 ${text.length} 字符]`
}

function buildPrompt(body) {
  const file = body.file ?? {}
  const project = body.project ?? {}
  const focus = body.focus ?? null
  const risk = Array.isArray(file.risk) ? file.risk : []
  const languages = Array.isArray(project.languages)
    ? project.languages.map((item) => `${item.name}:${item.files}`).join(', ')
    : ''
  const focusText = focus?.text
    ? clip(focus.text, 16000)
    : '（用户没有选中具体差异区间，请对已打开的整个文件给出结论）'

  const parts = []
  parts.push('## 项目概览')
  parts.push(`- 项目：${project.name ?? 'unknown'}`)
  parts.push(`- 文件总数：${project.totalFiles ?? '?'}，本次改动文件：${project.changedFiles ?? '?'}`)
  if (languages) parts.push(`- 语言分布：${languages}`)
  if (project.git) parts.push(`- Git：分支 ${project.git.branch}，基线 ${project.git.base}`)
  parts.push('')
  parts.push('## 当前打开的文件')
  parts.push(`- 路径：${file.path ?? 'unknown'}`)
  parts.push(`- 状态：${file.status ?? 'modified'}；语言：${file.language ?? 'Text'}`)
  parts.push(`- 行数变化：+${file.added ?? 0} / -${file.deleted ?? 0}`)
  if (risk.length) {
    parts.push('- 引擎线索：')
    for (const item of risk.slice(0, 8)) {
      parts.push(`  - [${item.severity}] ${item.title}：${item.detail}`)
    }
  }
  if (Array.isArray(file.symbolsRemoved) && file.symbolsRemoved.length) {
    parts.push(`- 旧代码中消失的符号：${file.symbolsRemoved.slice(0, 20).join(', ')}`)
  }
  if (Array.isArray(file.symbolsAdded) && file.symbolsAdded.length) {
    parts.push(`- 新代码新增的符号：${file.symbolsAdded.slice(0, 20).join(', ')}`)
  }
  parts.push('')
  parts.push('## 用户当前聚焦的差异片段')
  parts.push('```')
  parts.push(focusText)
  parts.push('```')
  parts.push('')
  parts.push('## 旧代码（左侧）')
  parts.push('```')
  parts.push(clip(file.leftText, 30000))
  parts.push('```')
  parts.push('')
  parts.push('## 新代码（右侧）')
  parts.push('```')
  parts.push(clip(file.rightText, 30000))
  parts.push('```')
  if (body.userNote) {
    parts.push('')
    parts.push('## 用户补充说明')
    parts.push(clip(String(body.userNote), 2000))
  }
  parts.push('')
  parts.push('请只输出 JSON。')
  return parts.join('\n')
}

async function analyze(ctx, config, body) {
  const started = Date.now()
  const file = body.file ?? {}
  const focus = body.focus ?? null
  const prompt = buildPrompt(body)
  const llm = ctx.get('llm')
  const selection = readSelection(ctx)
  const provider = clean(config.provider) ?? selection?.provider ?? 'deepseek-official'
  const model = clean(config.model) ?? selection?.model ?? 'deepseek-flash'

  if (!llm) {
    return {
      ok: true,
      analysis: heuristicAnalysis(body),
      meta: {
        engine: 'heuristic',
        reason: 'LLM service unavailable',
        elapsedMs: Date.now() - started,
      },
    }
  }

  const attempts = [
    {
      provider,
      model,
      ...(selection?.reasoningEffort ? { reasoningEffort: selection.reasoningEffort } : {}),
    },
    { provider, model },
  ]
  let lastError = null
  for (const target of attempts) {
    try {
      const text = await streamAnalysis(llm, target, prompt)
      const parsed = parseAnalysis(text)
      return {
        ok: true,
        analysis: sanitizeAnalysis(parsed, body),
        meta: {
          engine: 'llm',
          provider: target.provider,
          model: target.model,
          elapsedMs: Date.now() - started,
        },
      }
    } catch (error) {
      lastError = error
    }
  }

  return {
    ok: true,
    analysis: heuristicAnalysis(body),
    meta: {
      engine: 'heuristic',
      reason: lastError ? String(lastError.message ?? lastError) : 'analysis failed',
      provider,
      model,
      elapsedMs: Date.now() - started,
    },
  }
}

async function streamAnalysis(llm, target, prompt) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90_000)
  try {
    const stream = llm.stream({
      provider: target.provider,
      model: target.model,
      ...(target.reasoningEffort ? { reasoningEffort: target.reasoningEffort } : {}),
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      temperature: 0.2,
      maxTokens: 2400,
      signal: controller.signal,
    })
    let text = ''
    let failure = null
    for await (const chunk of stream) {
      if (chunk.type === 'text-delta') text += chunk.text
      if (chunk.type === 'finish') {
        if (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted') {
          failure = chunk.reason.failure
        }
      }
    }
    if (failure) throw new Error(`${failure.code}: ${failure.message}`)
    if (!text.trim()) throw new Error('model returned no text')
    return text
  } finally {
    clearTimeout(timer)
  }
}

function parseAnalysis(text) {
  const cleaned = String(text)
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('model response contains no JSON object')
  return JSON.parse(cleaned.slice(start, end + 1))
}

function sanitizeAnalysis(value, body) {
  const file = body.file ?? {}
  const coverage = ['full', 'partial', 'none', 'uncertain'].includes(value?.coverage)
    ? value.coverage
    : 'uncertain'
  const score = Number(value?.score)
  const issues = Array.isArray(value?.issues)
    ? value.issues.slice(0, 12).map((issue) => ({
        severity: ['high', 'medium', 'low'].includes(issue?.severity) ? issue.severity : 'medium',
        title: String(issue?.title ?? '问题'),
        detail: String(issue?.detail ?? ''),
        ...(Number.isFinite(Number(issue?.line)) ? { line: Number(issue.line) } : {}),
        ...(issue?.side === 'left' || issue?.side === 'right' || issue?.side === 'both'
          ? { side: issue.side }
          : {}),
      }))
    : []
  return {
    coverage,
    coverageReason: String(value?.coverageReason ?? ''),
    verdict: String(value?.verdict ?? '已完成分析'),
    score: Number.isFinite(score) ? Math.min(10, Math.max(1, Math.round(score * 10) / 10)) : 5,
    scoreReason: String(value?.scoreReason ?? ''),
    strengths: Array.isArray(value?.strengths) ? value.strengths.slice(0, 10).map(String) : [],
    issues,
    suggestions: Array.isArray(value?.suggestions) ? value.suggestions.slice(0, 10).map(String) : [],
    removedCapabilities: Array.isArray(value?.removedCapabilities)
      ? value.removedCapabilities.slice(0, 10).map(String)
      : [],
    reviewScope: value?.reviewScope === 'file' ? 'file' : 'hunk',
    source: 'llm',
    path: file.path,
  }
}

function heuristicAnalysis(body) {
  const file = body.file ?? {}
  const risk = Array.isArray(file.risk) ? file.risk : []
  const high = risk.filter((item) => item.severity === 'high')
  const medium = risk.filter((item) => item.severity === 'medium')
  const low = risk.filter((item) => item.severity === 'low')
  const removed = Array.isArray(file.symbolsRemoved) ? file.symbolsRemoved : []
  const coverage = file.status === 'removed' || high.length > 0 || removed.length > 0
    ? 'partial'
    : 'uncertain'
  let score = 7.4
  score -= high.length * 1.2
  score -= medium.length * 0.5
  score -= low.length * 0.15
  if (file.status === 'added') score += 0.2
  score = Math.min(9.2, Math.max(2, Math.round(score * 10) / 10))
  const issues = risk.slice(0, 8).map((item) => ({
    severity: item.severity,
    title: item.title,
    detail: item.detail,
  }))
  return {
    coverage,
    coverageReason:
      coverage === 'partial'
        ? '本地规则发现可能的功能删除线索，需要人工确认。'
        : '本地规则未发现明确的覆盖缺口，但无法替代模型级语义判断。',
    verdict:
      high.length > 0
        ? '存在需要优先确认的功能覆盖风险。'
        : '未发现明确的高风险线索，建议结合聚焦片段进一步确认。',
    score,
    scoreReason: `基于新增/删除行数、旧符号消失、调试输出等待办线索的启发式评分（未调用模型）。`,
    strengths: [
      file.status === 'added' ? '新增文件，结构完整。' : '改动集中，建议继续保持小步提交。',
    ],
    issues,
    suggestions: high.length > 0
      ? ['优先确认旧功能是否迁移，并补充对应回归测试。', '对删除的公开符号搜索调用方。']
      : ['补充边界条件测试。', '确认错误处理与空值分支。'],
    removedCapabilities: removed.slice(0, 10),
    reviewScope: body.focus ? 'hunk' : 'file',
    source: 'heuristic',
    path: file.path,
  }
}
