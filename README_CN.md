# Claude Web — AI 驱动的智能开发平台

将命令行式的 Claude Code 工具改造为现代化的图形化 Web 应用。参考 Openclaw 的精致 UI 设计风格，提供专业级 IDE 体验，集成 AI 对话、代码编辑、终端操作和项目管理功能。

---

## 目录

- [功能概览](#功能概览)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
- [系统架构](#系统架构)
- [API 参考](#api-参考)
- [配置说明](#配置说明)
- [开发指南](#开发指南)

---

## 功能概览

### 主界面布局

整个界面采用经典的 IDE 四分区布局，所有面板均可自由调整大小：

- **顶部工具栏** — 项目导航、标签页管理、连接状态、Git 分支信息
- **左侧文件树** — 项目文件浏览，支持嵌套目录展开/折叠
- **中央编辑器** — Monaco Editor，支持多标签页、语法高亮、代码 Diff
- **右侧 AI 对话** — 聊天式交互，Markdown 渲染，流式响应
- **底部终端** — 命令执行、实时输出、历史记录

### 代码编辑

- **Monaco Editor 集成** — 与 VS Code 同源的编辑器内核，支持 30+ 种编程语言的语法高亮
- **多标签页管理** — 可同时打开多个文件，一键切换，修改状态实时提示
- **实时代码对比** — 基于 LCS（最长公共子序列）算法的双栏 Diff 视图，新增/删除行高亮
- **智能编辑体验** — 括号自动配对、代码折叠、缩进引导线、小地图
- **自动保存** — 可配置的自动保存机制，未保存文件有状态标记

### AI 智能对话

- **Markdown 富文本渲染** — AI 回复支持 Markdown 格式，代码块自动语法高亮
- **流式响应展示** — 通过 WebSocket 实时接收 AI 回复，逐字显示，体验流畅
- **提示词模板库** — 内置 10 种常用模板：解释代码、修复 Bug、重构优化、编写测试、性能分析、代码审查等
- **多会话管理** — 支持创建/切换/删除多个对话会话，历史记录完整保存
- **代码一键复制** — 回复中的代码块带有复制按钮，点击即可复制

### 终端命令

- **可视化命令执行** — 在界面中直接输入 shell 命令，输出实时显示
- **彩色输出** — stdout 正常输出（白色）、stderr 错误输出（红色）、警告信息（黄色）
- **命令历史** — 使用 ↑↓ 方向键浏览历史命令，最多保留 100 条
- **安全检测** — 自动检测危险命令（如 `rm -rf /`），执行前发出警告

### 项目管理

- **文件操作** — 支持文件的创建、读取、写入、删除操作
- **Git 集成** — 显示当前分支、变更文件数量、领先/落后提交数
- **工作区配置** — 可自定义项目根目录路径
- **文件监控** — 通过 WebSocket 实时监听文件变化

---

## 环境要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | ≥ 18.x（推荐 v22） | JavaScript 运行时 |
| npm | ≥ 9.x | 包管理器（随 Node.js 安装） |
| Git | ≥ 2.x（可选） | 版本控制功能需要 |

---

## 快速开始

### 方式一：一键启动脚本

**Windows 系统：**
```bash
# 双击 start.bat 文件
# 或在终端中执行：
.\start.bat
```

**macOS / Linux 系统：**
```bash
chmod +x start.sh
./start.sh
```

启动脚本会自动完成以下步骤：
1. 安装根目录依赖
2. 安装前端（client）依赖
3. 安装后端（server）依赖
4. 同时启动前后端开发服务器

### 方式二：手动启动

```bash
# 1. 进入项目目录
cd claudeweb

# 2. 安装所有依赖
npm run install:all

# 3. 启动开发服务器（前后端同时启动）
npm run dev
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端界面 | http://localhost:3000 | React 开发服务器，支持热更新 |
| 后端 API | http://localhost:4000 | Express 服务器 |
| 健康检查 | http://localhost:4000/api/health | 用于确认后端是否正常运行 |

### 验证安装

在浏览器中打开 http://localhost:3000，你应该看到：
- 深色主题的专业 IDE 界面
- 顶部 "Claude Web" 工具栏
- 左侧文件资源管理器面板
- 中央编辑区（显示欢迎页）
- 右侧 AI 对话面板
- 底部终端面板

---

## 使用指南

### 1. 文件浏览与编辑

**浏览项目文件：**
- 左侧「EXPLORER」面板显示项目文件树
- 点击文件夹图标展开/折叠子目录（带有旋转动画）
- 文件名前有彩色图标标识文件类型（TypeScript 蓝色、JSON 黄色、Markdown 灰色等）

**打开文件：**
- 单击文件名即可在编辑器中打开
- 文件会在中央编辑区以新标签页形式打开
- 每个标签页显示文件名、语言类型和修改状态

**编辑文件：**
- 编辑器支持语法高亮、代码折叠、括号匹配
- 修改后的文件标签页会显示紫色圆点标记
- 按 `Ctrl+S` 保存文件（底部状态栏有提示）
- 右键标签页可关闭文件

**关闭文件：**
- 点击标签页上的 × 按钮关闭文件
- 关闭所有文件后，编辑器回到欢迎页

### 2. AI 对话使用

**开始对话：**
- 右侧「CHAT」面板是 AI 对话区
- 在底部输入框输入问题，按 `Enter` 发送
- `Shift+Enter` 可以输入多行内容

**使用提示词模板：**
- 点击输入框左侧的💡灯泡图标
- 弹出模板选择面板，按类别显示 10 种模板
- 点击模板自动填充到输入框

可用的提示词模板：

| 模板名称 | 用途 | 示例场景 |
|---------|------|---------|
| 解释代码 | 详细分析代码逻辑和结构 | 阅读陌生代码库时 |
| 修复 Bug | 找出并修复代码中的问题 | 遇到报错或异常行为 |
| 重构优化 | 改善代码结构和可读性 | 代码臃肿、难以维护 |
| 添加注释 | 为代码添加文档和说明 | 准备提交代码审查 |
| 编写测试 | 生成全面的单元测试 | 提高代码测试覆盖率 |
| 性能优化 | 分析并提升代码运行效率 | 程序运行缓慢 |
| 代码审查 | 全面的代码质量评审 | 合并代码前检查 |
| 解释错误 | 分析错误信息和堆栈跟踪 | 遇到不理解的报错 |
| 设计 API | 设计 RESTful API 接口 | 新建后端服务 |
| 编写 SQL | 根据描述生成 SQL 查询 | 数据库查询需求 |

**对话管理：**
- 点击标题栏 + 号创建新对话
- 使用下拉菜单切换历史对话
- 点击垃圾桶图标清空当前对话

**AI 回复特点：**
- 回复内容以 Markdown 格式渲染，支持标题、列表、表格
- 代码块自动语法高亮，右上角有复制按钮
- 回复带有时间戳
- 流式响应时显示动画思考指示器

### 3. 终端操作

**打开终端：**
- 终端面板默认在底部显示
- 点击「TERMINAL」标题栏可折叠/展开
- 折叠时显示简洁的标题栏

**执行命令：**
- 在 `$` 提示符后输入命令
- 按 `Enter` 执行
- 命令输出实时显示在上方区域

**命令历史：**
- 按 `↑` 方向键浏览上一条命令
- 按 `↓` 方向键浏览下一条命令
- 命令历史自动保存（最多 100 条）

**输出颜色说明：**

| 颜色 | 含义 |
|------|------|
| 绿色 `$` | 命令提示符 |
| 白色文本 | 正常输出 (stdout) |
| 红色文本 | 错误输出 (stderr) |
| 黄色文本 | 警告信息 |

- 点击垃圾桶图标清空终端输出

### 4. Git 版本控制

Git 状态会在多个位置显示：

- **工具栏** — 显示当前分支名和变更文件数量徽标
- **状态栏中部** — 分支名、变更数、领先/落后提交数
- 变更数徽标为紫色高亮

### 5. 设置面板

点击工具栏右上角的齿轮图标打开设置面板：

- **外观** — 切换深色/更深色主题
- **编辑器** — 调整字体大小（12-20px）、Tab 缩进（2/4/8）、自动保存开关
- **工作区** — 设置项目根目录路径
- **关于** — 版本信息和技术栈说明

---

## 系统架构

### 整体架构图

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Port 3000)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ FileTree │  │  Editor  │  │   Chat   │  │   Terminal   │  │
│  │  Panel   │  │  Panel   │  │  Panel   │  │    Panel     │  │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│        │            │             │               │           │
│  ┌─────┴────────────┴─────────────┴───────────────┴───────┐  │
│  │              Zustand State Management                    │  │
│  │   useAppStore   useEditorStore   useChatStore           │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                    │
│  ┌────────────────────────┴────────────────────────────────┐  │
│  │              Service Layer                                │  │
│  │   api.ts (REST)          socket.ts (WebSocket)           │  │
│  └────────────────────────┬────────────────────────────────┘  │
└───────────────────────────┼───────────────────────────────────┘
                            │
              HTTP / WebSocket (Port 4000)
                            │
┌───────────────────────────┼───────────────────────────────────┐
│                    Express Server (Port 4000)                   │
│                           │                                    │
│  ┌────────────────────────┴────────────────────────────────┐  │
│  │              Route Layer                                  │  │
│  │   /api/files    /api/chat    /api/command    /api/git    │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                    │
│  ┌────────────────────────┴────────────────────────────────┐  │
│  │              Service Layer                                │  │
│  │   fileService   chatService   commandService             │  │
│  │                    wsHandler (Socket.IO)                  │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                    │
│  ┌────────────────────────┴────────────────────────────────┐  │
│  │              System Layer                                 │  │
│  │   fs/promises    child_process    chokidar    git CLI    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 前端架构详解

前端采用 **分层组件化架构**，遵循单一职责原则：

```
client/src/
├── components/          # UI 组件层（17个组件）
│   ├── Toolbar/         # 顶部工具栏
│   │   └── Toolbar.tsx  # Logo、标签栏、连接状态、Git 状态、设置入口
│   ├── Layout/          # 布局组件
│   │   ├── StatusBar.tsx     # 底部状态栏（连接状态、光标位置、Git 信息）
│   │   └── ResizeHandle.tsx  # 可拖拽面板分隔条
│   ├── FileTree/        # 文件树
│   │   ├── FileTreePanel.tsx  # 文件列表容器（加载、空状态、错误处理）
│   │   └── FileTreeNode.tsx   # 单个文件节点（图标、展开动画、点击打开）
│   ├── Editor/          # 代码编辑器
│   │   ├── EditorPanel.tsx    # Monaco Editor 封装、标签页管理
│   │   └── WelcomeScreen.tsx  # 空状态欢迎页（快捷操作、快捷键参考）
│   ├── Chat/            # AI 对话
│   │   ├── ChatPanel.tsx          # 对话主面板（消息列表、输入框）
│   │   ├── MessageBubble.tsx      # 消息气泡（Markdown渲染、代码复制）
│   │   ├── PromptTemplates.tsx    # 提示词模板选择器
│   │   └── StreamingIndicator.tsx # 流式响应动画指示器
│   ├── Terminal/        # 终端
│   │   └── TerminalPanel.tsx  # 命令输入、输出展示、历史导航
│   ├── Diff/            # 代码对比
│   │   └── DiffView.tsx  # 基于LCS算法的双栏对比视图
│   ├── Settings/        # 设置
│   │   └── SettingsPanel.tsx  # 侧滑设置面板
│   └── common/          # 通用组件
│       ├── ContextMenu.tsx  # 右键菜单
│       ├── Modal.tsx        # 模态对话框
│       └── Tooltip.tsx      # 悬浮提示
│
├── hooks/               # 自定义 Hooks 层
│   ├── useFileTree.ts   # 文件树数据加载、展开/折叠、刷新
│   └── useTerminal.ts   # 命令执行、输出管理、历史导航
│
├── store/               # 状态管理层（Zustand）
│   ├── useAppStore.ts   # 全局状态（主题、连接、面板大小、Git、工作区）
│   ├── useEditorStore.ts # 编辑器状态（标签页、内容、修改标记）
│   └── useChatStore.ts  # 对话状态（会话、消息、流式响应、模板）
│
├── services/            # 通信层
│   ├── api.ts           # REST API 客户端（fetch 封装，统一错误处理）
│   └── socket.ts        # Socket.IO 客户端（单例模式，自动重连）
│
├── types/               # 类型定义层
│   └── index.ts         # 完整 TypeScript 类型定义（12个接口）
│
├── App.tsx              # 根组件（布局组装、初始化连接）
├── main.tsx             # 应用入口
└── index.css            # 全局样式（Tailwind + 自定义组件类）
```

**数据流设计：**

```
用户操作 → 组件事件处理 → Zustand Store 更新 → 组件重新渲染
                ↓
        Service Layer (api.ts / socket.ts)
                ↓
        后端 REST API / WebSocket
                ↓
        Store 更新（响应数据）→ 组件重新渲染
```

**状态管理方案选择：**
- 选择 Zustand（而非 Redux）的原因：API 简洁、TypeScript 友好、无 Provider 嵌套、适合中小规模应用
- 三个独立 Store 按领域拆分，避免单一 Store 过于臃肿
- 组件通过选择器精准订阅所需状态，避免不必要的重新渲染

### 后端架构详解

后端采用 **分层架构**，路由层 → 服务层 → 系统层：

```
server/src/
├── index.ts              # 入口文件：Express + Socket.IO 服务器配置
├── routes/               # 路由层：处理 HTTP 请求/响应
│   ├── files.ts          # 文件 CRUD API（5个端点）
│   ├── chat.ts           # AI 对话 API（2个端点）
│   ├── command.ts        # 命令执行 API（2个端点）
│   └── git.ts            # Git 状态 API（1个端点）
├── services/             # 服务层：业务逻辑
│   ├── fileService.ts    # 文件系统操作（CRUD + 搜索）
│   ├── chatService.ts    # AI 响应生成（关键词匹配 + 模板引擎）
│   ├── commandService.ts # 命令执行（子进程管理 + 安全检查）
│   └── wsHandler.ts      # WebSocket 事件处理（实时通信）
├── middleware/            # 中间件
│   └── errorHandler.ts   # 统一错误处理
└── utils/                 # 工具函数
    └── pathUtils.ts      # 路径解析、校验、语言检测
```

**请求处理流程：**

```
HTTP 请求 → Express 路由匹配 → 参数校验
    → Service 层处理业务逻辑
    → 文件系统/子进程/Git CLI 操作
    → JSON 响应返回
    → 错误由 errorHandler 中间件统一捕获
```

**WebSocket 通信流程：**

```
客户端连接 → Socket.IO 握手
    → 事件路由：chat:message / terminal:command / file:watch
    → 服务端处理：
        • chat:message → chatService 生成回复 → 分块发送 chat:chunk → 完成发送 chat:done
        • terminal:command → commandService 执行命令 → 实时发送 terminal:output → 完成发送 terminal:done
        • file:watch → chokidar 监控文件 → 变更时发送 file:changed
```

### 通信协议设计

系统采用 **REST API + WebSocket** 双通道通信方案：

| 场景 | 协议 | 原因 |
|------|------|------|
| 文件读写、Git状态查询 | REST API | 请求-响应模式，语义清晰，便于缓存 |
| AI 对话流式响应 | WebSocket | 需要服务端主动推送数据，低延迟 |
| 终端命令实时输出 | WebSocket | 长时任务需要实时反馈 |
| 文件变更监控 | WebSocket | 服务端主动通知客户端 |

**REST API 设计规范：**
- 统一前缀 `/api/`
- 资源名称使用复数名词
- 查询参数传递路径等信息
- POST body 使用 JSON 格式
- 统一错误响应格式：`{ error: { message, status, code } }`

**WebSocket 事件命名规范：**
- 使用 `domain:action` 格式（如 `chat:message`、`terminal:output`）
- 请求事件与响应事件成对出现（如 `chat:message` → `chat:chunk` → `chat:done`）

### 关键设计决策

**1. 为什么选择 Monaco Editor？**
- VS Code 同款编辑器内核，开发者熟悉度高
- 支持 30+ 语言语法高亮，无需额外配置
- 内置代码折叠、括号匹配、小地图等专业功能
- React 封装包 `@monaco-editor/react` 支持懒加载

**2. 为什么 AI 响应使用关键词匹配而非真实 API？**
- 当前版本使用内置的智能关键词分析和模板引擎
- 可根据消息内容（解释/修复/重构/测试等）生成针对性的回复
- 架构已预留 `chatService.ts` 作为接口层，后续可无缝替换为 Claude API

**3. 为什么使用 Zustand 而非 Redux？**
- Zustand API 更简洁，减少样板代码
- 天然支持 TypeScript 类型推导
- 无需 Provider 包裹组件树
- 支持选择性订阅，性能更优

**4. 安全设计：**
- `pathUtils.ts` 校验所有文件路径必须在工作区范围内，防止路径遍历攻击
- `commandService.ts` 检测危险命令模式（`rm -rf /`、fork 炸弹等），执行前告警
- CORS 限制仅允许 localhost:3000 访问
- 命令执行设置 30 秒超时和 10MB 输出上限

---

## API 参考

### REST API 端点

#### 文件操作

| 方法 | 端点 | 参数 | 说明 |
|------|------|------|------|
| GET | `/api/files/list` | `?path=相对路径` | 列出目录内容 |
| GET | `/api/files/read` | `?path=文件路径` | 读取文件内容 |
| POST | `/api/files/write` | `{ path, content }` | 写入文件内容 |
| POST | `/api/files/upload` | `{ path, content, encoding? }` | 上传/创建文件 |
| DELETE | `/api/files/delete` | `?path=文件路径` | 删除文件 |
| GET | `/api/files/search` | `?root=路径&q=关键词` | 搜索文件 |

**响应示例：**
```json
// GET /api/files/list?path=src
[
  {
    "name": "components",
    "path": "src/components",
    "type": "directory",
    "modifiedAt": "2026-05-08T10:30:00.000Z"
  },
  {
    "name": "App.tsx",
    "path": "src/App.tsx",
    "type": "file",
    "size": 1234,
    "modifiedAt": "2026-05-08T09:15:00.000Z"
  }
]
```

#### AI 对话

| 方法 | 端点 | 参数 | 说明 |
|------|------|------|------|
| POST | `/api/chat/send` | `{ message, history? }` | 发送消息获取 AI 回复 |
| GET | `/api/chat/templates` | — | 获取提示词模板列表 |

**请求示例：**
```json
// POST /api/chat/send
{
  "message": "请解释这段代码的功能",
  "history": [
    { "role": "user", "content": "我有一段代码需要帮助" }
  ]
}
```

#### 命令执行

| 方法 | 端点 | 参数 | 说明 |
|------|------|------|------|
| POST | `/api/command/execute` | `{ command, cwd? }` | 执行 Shell 命令 |
| GET | `/api/command/history` | — | 获取命令执行历史 |

#### Git 操作

| 方法 | 端点 | 参数 | 说明 |
|------|------|------|------|
| GET | `/api/git/status` | `?path=项目路径` | 获取 Git 仓库状态 |

**响应示例：**
```json
{
  "branch": "main",
  "changes": [
    { "status": "M", "file": "src/App.tsx" },
    { "status": "??", "file": "new-file.ts" }
  ],
  "ahead": 2,
  "behind": 0,
  "isRepo": true
}
```

#### 系统

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |

### WebSocket 事件

#### 聊天事件

| 事件名 | 方向 | 数据结构 | 说明 |
|--------|------|---------|------|
| `chat:message` | C→S | `{ message, history? }` | 发送聊天消息 |
| `chat:chunk` | S→C | `{ content, full }` | 流式响应片段 |
| `chat:done` | S→C | `{ content }` | 响应完成 |
| `chat:error` | S→C | `{ message }` | 错误通知 |

#### 终端事件

| 事件名 | 方向 | 数据结构 | 说明 |
|--------|------|---------|------|
| `terminal:command` | C→S | `{ command, cwd? }` | 执行命令 |
| `terminal:output` | S→C | `{ data, type }` | 实时输出（stdout/stderr/info/warning） |
| `terminal:done` | S→C | `{ exitCode }` | 命令执行完成 |

#### 文件监控事件

| 事件名 | 方向 | 数据结构 | 说明 |
|--------|------|---------|------|
| `file:watch` | C→S | `{ path }` | 开始监控文件 |
| `file:unwatch` | C→S | `{ path }` | 停止监控文件 |
| `file:changed` | S→C | `{ path, content, timestamp }` | 文件变更通知 |
| `file:watch:started` | S→C | `{ path }` | 监控已启动 |
| `file:watch:error` | S→C | `{ path, message }` | 监控出错 |

---

## 配置说明

### 环境变量

在项目根目录或 `server/` 目录创建 `.env` 文件：

```bash
# 后端服务端口（默认 4000）
PORT=4000

# 默认工作区路径
WORKSPACE_ROOT=/path/to/your/project

# 运行环境（development 时显示详细错误堆栈）
NODE_ENV=development
```

### 自定义设置

通过界面右上角齿轮图标进入设置面板，可调整：
- 编辑器字体大小（12-20px）
- Tab 缩进宽度（2/4/8 空格）
- 自动保存开关
- 小地图显示开关
- 自动换行开关
- 主题切换（深色/更深色）

---

## 开发指南

### 目录结构关系

```
claudeweb/
├── package.json              # 根工作区配置，定义 install:all / dev 等脚本
├── start.bat / start.sh      # 一键启动脚本
├── client/                   # 前端独立项目
│   ├── package.json          # 前端依赖（React, Monaco, Zustand 等）
│   ├── vite.config.ts        # Vite 构建配置（含 API 代理到 4000 端口）
│   ├── tsconfig.json         # TypeScript 前端配置
│   └── tailwind.config.js    # 自定义主题色、动画
├── server/                   # 后端独立项目
│   ├── package.json          # 后端依赖（Express, Socket.IO 等）
│   └── tsconfig.json         # TypeScript 后端配置
└── README.md                 # 英文文档
```

### 常用命令

```bash
# 安装所有依赖（根 + client + server）
npm run install:all

# 同时启动前后端开发服务器
npm run dev

# 单独启动前端
npm run dev:client

# 单独启动后端
npm run dev:server

# 生产构建
npm run build

# TypeScript 类型检查
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit

# 代码检查
npm run lint
```

### 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | React | 18.3 | UI 组件框架 |
| 类型系统 | TypeScript | 5.4 | 静态类型检查 |
| 构建工具 | Vite | 5.3 | 开发服务器 + 生产构建 |
| CSS 框架 | Tailwind CSS | 3.4 | 原子化样式 |
| 代码编辑器 | Monaco Editor | 0.47 | VS Code 同款编辑器 |
| Markdown | react-markdown | 9.0 | AI 回复渲染 |
| 代码高亮 | react-syntax-highlighter | 15.5 | 代码块着色 |
| 动画 | Framer Motion | 11.0 | 组件动画和过渡 |
| 图标 | Lucide React | 0.400 | SVG 图标库 |
| 状态管理 | Zustand | 4.5 | 轻量状态管理 |
| WebSocket | Socket.IO | 4.7 | 实时双向通信 |
| 后端框架 | Express | 4.19 | HTTP 服务器 |
| 文件监控 | Chokidar | 3.6 | 文件系统监听 |
| 运行时 | tsx | 4.15 | TypeScript 直接执行 |

---

## 常见问题

**Q: 启动后页面空白？**
A: 确保后端服务正常运行（检查 http://localhost:4000/api/health），前端通过 Vite 代理访问后端。

**Q: 文件树不显示？**
A: 确保 `WORKSPACE_ROOT` 环境变量指向有效目录，或使用设置面板配置工作区路径。

**Q: AI 对话无响应？**
A: 检查浏览器控制台是否有 WebSocket 连接错误。当前版本使用内置关键词匹配引擎，不需要外部 API Key。

**Q: 终端命令执行失败？**
A: Windows 系统使用 PowerShell 执行命令，确保命令兼容。危险命令会被拦截并显示警告。

**Q: 如何接入真实 Claude API？**
A: 修改 `server/src/services/chatService.ts` 中的 `generateResponse` 函数，替换为 Anthropic SDK 调用。WebSocket 流式响应架构已就绪，只需替换 AI 调用逻辑。

---

## 许可协议

MIT License
