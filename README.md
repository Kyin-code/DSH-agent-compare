# Agent Compare for DSH

一个带左侧栏入口的 DSH 插件：文件 / 文件夹 / Git 工作区比对，并在你聚焦某段差异时，让 Agent 结合工程上下文给出**覆盖性判断、优劣分析与 1–10 分质量评分**。

界面参考专业比对工具的组织方式：左右并排、同步滚动、行内词级高亮、上一处/下一处差异、上下文折叠、可浮动的工程目录窗，以及跟随聚焦行的 Agent 悬停提示。

> 这是第一版。UI 使用 DSH 原生 Web Slot，Rust 负责扫描与 diff 内核。GPUI 无法嵌入 DSH 的 Electron 页面，因此没有把 GPUI 作为第一版主界面；`engine/` 是独立 CLI，后续可以复用它做 GPUI 原生外壳。

## 功能

- **三种比对模式**
  - 文件夹 vs 文件夹：逐文件比较完整工程。
  - 文件 vs 文件：单文件并排差异。
  - Git 工作区：任意提交 / `HEAD` vs 当前工作区，适合评审 Agent 的未提交改动。
- **专业差异视图**
  - 左右并排、统一滚动容器，天然同步滚动。
  - 行级增删、替换高亮，替换行内再做词级高亮。
  - `F7` / `F8` 或工具栏按钮在差异块之间跳转。
  - 大段未改动内容自动折叠，可展开。
  - 软换行开关、二进制文件提示、超大文件提示。
- **浮动目录窗**
  - 可拖动、可搜索，显示工程概览与文件状态。
  - 双击文件直接打开。
- **Agent 聚焦评审**
  - 只分析**你已经打开并聚焦**的文件/差异块；未打开的文件不会被评价。
  - 先判断新代码是否完全覆盖旧代码功能：`full` / `partial` / `none` / `uncertain`；不能覆盖时列出缺失能力。
  - 能覆盖时比较新旧代码优劣；不能覆盖时指出具体问题。
  - 对新代码评分 1–10，并给出正确性、可维护性、可读性、性能、安全、测试与边界方面的简短理由。
  - 结果用悬停浮卡展示，右侧面板可查看完整问题、优势与建议。
  - 支持 `F7/F8` 切换差异、`Ctrl+Enter` 分析当前片段。
- **确定性风险提示（不依赖模型）**
  - 旧代码中消失的导出符号。
  - 文件/测试删除、疑似硬编码凭据、新增调试输出、TODO/FIXME 增加。
  - Rust `unwrap/expect` 增加、大规模删减。
  - 这些线索会同时展示在 UI 中，并作为 Agent 的辅助证据。
- **工程扫描细节**
  - 自动跳过 `.git`、`node_modules`、`target`、`dist`、`build`、`.venv` 等目录。
  - 二进制检测、单文件大小上限、扫描数量上限。
  - 语言分布、文件数、增删行统计。

## 架构

```
┌────────────────────────────────────────────────────────────┐
│ DSH Web UI                                                 │
│  sidebar.panellist  →  main keyed slot                     │
│  React 页面：文件树、并排 diff、浮动目录、Agent 浮卡          │
└───────────────▲──────────────────────────────┬─────────────┘
                │ same-origin fetch            │
┌───────────────┴──────────────────────────────▼─────────────┐
│ Host plugin (index.js)                                     │
│  /agent-compare/api/health | scan | diff | browse | analyze │
│  ├─ 调用 Rust engine CLI，返回 JSON                          │
│  └─ ctx.llm.stream(...) 生成结构化评审 JSON                  │
└───────────────▲────────────────────────────────────────────┘
                │
┌───────────────┴────────────────────────────────────────────┐
│ Rust engine (engine/)                                      │
│  walkdir + similar + blake3 + regex                        │
│  scan folders / files / git；逐行 diff；词级高亮；符号/风险   │
└────────────────────────────────────────────────────────────┘
```

- `index.js`：Host 半，注册 HTTP 路由；调用引擎；调用当前默认模型；模型不可用时退回本地启发式，并明确标记 `source: heuristic`。
- `client.js`：Client 半，纯 React（通过 ModuleLoader 加载，无构建步骤）；注册左侧栏图标与主面板。
- `engine/`：Rust 二进制。`engine/bin/agent-compare-engine.exe` 是 Windows x64 构建；其他平台运行 `scripts/build-engine.sh`。
- `locale/`：Plugin Manager 使用的标题与描述；UI 文案在 `client.js` 内注册到 DSH locale 服务。

## 安装

前提：DSH Desktop，Rust 1.80+（只有重新编译引擎时需要）。

### 1. 构建 Rust 引擎

Windows：

```powershell
./scripts/build-engine.ps1
```

macOS / Linux：

```bash
./scripts/build-engine.sh
```

脚本会把二进制放到 `engine/bin/`。仓库中已带 Windows x64 版本；其他平台需要自己构建。

### 2. 安装插件

在 DSH Desktop 的插件管理中选择“本地目录 / 从目录安装”，指向本仓库根目录；或调用 Plugin Manager 的 `install_bundle`，target 为仓库绝对路径。

安装后，左侧栏会出现“代码比对”图标，主区域出现比对页面。

> 如果是在已运行 Harness 中替换同版本插件，可能需要重启 Harness 才会加载新的 Host 模块。这是 DSH 的模块缓存行为，不是插件逻辑。

## 使用

1. 点击左侧栏的“代码比对”。
2. 选择模式：
   - 文件夹：填两个目录，点“开始比对”。
   - 文件：填两个文件路径，或点输入框右侧的目录按钮浏览。
   - Git 工作区：填仓库路径，基线默认 `HEAD`；可选任意 commit / branch。
3. 扫描完成后，左侧会出现工程概览和文件列表。点击文件打开差异。
4. 点击任意差异行，Agent 浮卡会出现；右侧面板展示完整评审。
5. 浮动目录窗：工具栏的目录图标；拖标题栏移动，双击文件打开。
6. 快捷键：
   - `F7` 上一处差异
   - `F8` 下一处差异
   - `Ctrl+Enter` 分析当前聚焦片段
   - `Esc` 关闭浮层/弹窗

## Agent 评审协议

Host 发给模型的系统提示固定要求：

1. 先判断新代码是否完全覆盖旧代码功能，输出 `coverage`。
2. 不能完全覆盖时，`removedCapabilities` 必须逐条列出缺失功能/行为/边界。
3. 能覆盖时，比较新旧代码优劣；仍存在的问题放进 `issues`。
4. 对新代码评分 1–10（一位小数），理由精简。
5. 只评价用户已打开并聚焦的文件/片段；项目概览只用于判断影响范围。
6. 只输出严格 JSON。

模型返回后 Host 会做一次 clamp / 结构校验；解析失败或模型不可用时退回本地启发式，并在 UI 中标记为“本地规则建议”。

## 第一版额外加入的点

这些不在原始需求里，但第一版先做了：

- Git 工作区模式（HEAD / 任意 revision vs 工作区）。
- 旧符号消失检测：直接支撑“新代码是否覆盖旧功能”的甲类判断。
- 硬编码凭据、调试输出、TODO、拼写错误、Rust panic、大删减等确定性风险线索。
- 软换行、上下文折叠、差异块跳转、分析结果缓存与防抖。
- **状态保持与懒加载**：切换 DSH 面板再回来不会重新扫描或重新拉 diff；同一文件只计算一次差异，不同行复用同一差异块的分析结果。
- **分层视觉**：独立的面板/画布/代码区层级、弱化行号与元信息、强调代码正文和变更块，并加入变更密度条。
- 可拖动/可搜索的浮动目录窗。
- 主题 token 适配，自动跟随 DSH 明暗主题。
- 扫描时跳过构建产物目录，二进制/超大文件降级提示。
- 文件浏览弹窗（在原生目录选择器之外提供兜底）。

## 已知限制

- 第一版未实现 GPUI 原生窗口；原因见上文。Rust 引擎已是独立 CLI，可作为未来 GPUI 壳的后端。
- 不做重命名检测；Git 模式使用 `--no-renames`，重命名会表现为一个删除 + 一个新增。
- 只处理 UTF-8 文本；其他编码按 UTF-8 lossy 解码。
- 单文件默认上限 2 MB，扫描文件上限 20,000；超出会截断或跳过内容分析。
- 扫描与 diff 在 Host 进程内同步调用引擎，超大仓库首次扫描可能需要数秒。
- 状态保持使用当前页面会话的内存缓存；整页刷新或重启 Harness 后仍需要重新扫描。
- HTTP 路由仅监听 DSH 已绑定的本地地址，并按同源页面使用；没有额外的跨域开放。
- 已在当前 DSH Desktop 窗口中实际验证：左侧栏入口、空态、扫描、左右 diff、浮动目录窗、Agent 悬停卡与右侧完整评审；仓库不附带截图。

## 开发

```bash
# 引擎
cargo test --manifest-path engine/Cargo.toml
cargo build --release --manifest-path engine/Cargo.toml

# 插件 JS 语法
node --check index.js
node --check client.js
```

目录：

```
.
├── index.js                 # Host 半：HTTP 路由、引擎调用、LLM 调用
├── client.js                # Client 半：React 页面 + 左侧栏注册
├── cordis.patch.yml         # 插入 Host 行
├── locale/                  # Plugin Manager 元数据
├── icon.svg
├── engine/
│   ├── Cargo.toml
│   ├── src/                 # Rust 扫描 / diff / git / 符号分析
│   └── bin/                 # 构建产物
├── samples/                 # 可手动试跑的示例目录
└── scripts/                 # 构建引擎
```

## License

Apache-2.0
