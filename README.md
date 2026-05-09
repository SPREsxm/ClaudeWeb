# Claude Web — AI-Powered Development Interface

A modern graphical web interface for Claude Code, inspired by Openclaw's design language. Transforms command-line Claude Code into a professional IDE-like experience with integrated AI chat, code editing, terminal, and project management.

## Features

### Core Interface
- **Dark-themed professional UI** with purple accent color scheme
- **Resizable panels** — File explorer, code editor, AI chat, and terminal
- **Responsive design** — Adapts to different screen sizes
- **Smooth animations** — Micro-interactions via Framer Motion

### Code Editor
- **Monaco Editor** — The same editor that powers VS Code
- **Multi-tab support** — Open and switch between multiple files
- **Syntax highlighting** — 30+ languages supported
- **Diff viewer** — Side-by-side code comparison with LCS algorithm
- **Auto-save** and dirty state indicators

### AI Chat
- **Markdown rendering** — Rich responses with code syntax highlighting
- **Streaming responses** — Real-time AI response streaming via WebSocket
- **Prompt templates** — 10 built-in templates for common coding tasks
- **Chat history** — Multiple sessions with full message history
- **Code block copy** — One-click copy for code snippets

### Terminal
- **Command execution** — Run shell commands directly from the UI
- **Real-time output** — Stream stdout/stderr with color coding
- **Command history** — Navigate previous commands with arrow keys
- **Error highlighting** — Errors shown in red, warnings in yellow

### Project Management
- **File tree explorer** — Browse project files with nested folders
- **Git integration** — Branch display, change count, ahead/behind indicators
- **File operations** — Create, read, write, delete files via REST API
- **Workspace configuration** — Configurable project root directory

## Architecture

```
claudeweb/
├── client/                          # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/                # AI chat panel & components
│   │   │   ├── Diff/                # Side-by-side diff viewer
│   │   │   ├── Editor/              # Monaco editor & welcome screen
│   │   │   ├── FileTree/            # File explorer panel
│   │   │   ├── Layout/              # StatusBar, ResizeHandle
│   │   │   ├── Settings/            # Settings slide-over panel
│   │   │   ├── Terminal/            # Terminal output & command input
│   │   │   ├── Toolbar/             # Top toolbar
│   │   │   └── common/              # Reusable UI primitives
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API & WebSocket clients
│   │   ├── store/                   # Zustand state management
│   │   └── types/                   # TypeScript type definitions
│   └── public/                      # Static assets
├── server/                          # Express + WebSocket Backend
│   └── src/
│       ├── routes/                  # REST API endpoints
│       │   ├── files.ts             # File CRUD operations
│       │   ├── chat.ts              # Chat & AI endpoints
│       │   ├── command.ts           # Command execution
│       │   └── git.ts               # Git status
│       ├── services/                # Business logic layer
│       │   ├── chatService.ts       # AI response generation
│       │   ├── commandService.ts    # Shell execution
│       │   ├── fileService.ts       # File system operations
│       │   └── wsHandler.ts         # WebSocket event handling
│       ├── middleware/              # Express middleware
│       └── utils/                   # Utility functions
├── start.bat                        # Windows quick start
├── start.sh                         # Unix/macOS quick start
└── package.json                     # Root workspace scripts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Code Editor | Monaco Editor |
| Markdown | react-markdown + remark-gfm |
| Syntax Highlighting | react-syntax-highlighter (Prism) |
| Animations | Framer Motion 11 |
| Icons | Lucide React |
| State Management | Zustand |
| Real-time | Socket.IO |
| Backend | Express + Node.js |
| Terminal Output | Real-time WebSocket streaming |

## Prerequisites

- **Node.js** >= 18.x (v22 recommended)
- **npm** >= 9.x
- **Git** (for version control features)

## Quick Start

### Windows
```bash
# Double-click start.bat
# OR in terminal:
.\start.bat
```

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

### Manual Setup
```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

The application will open at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health

## Usage Guide

### Opening Files
1. Use the file explorer on the left to browse your project
2. Click any file to open it in the editor
3. Open multiple files — they appear as tabs

### Using AI Chat
1. The chat panel is on the right side
2. Type a message and press Enter to send
3. Use `Shift+Enter` for multi-line messages
4. Click the lightbulb icon to use prompt templates
5. Code blocks in responses have syntax highlighting and copy buttons

### Terminal Commands
1. The terminal is at the bottom (collapsible)
2. Type commands after the `$` prompt
3. Press Enter to execute
4. Use Up/Down arrows for command history

### Git Integration
- Git status appears in the toolbar and status bar
- Branch name, change count, and sync status are shown

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/list?path=...` | List directory contents |
| GET | `/api/files/read?path=...` | Read file content |
| POST | `/api/files/write` | Write file content |
| DELETE | `/api/files/delete?path=...` | Delete file |
| POST | `/api/chat/send` | Send chat message |
| GET | `/api/chat/templates` | Get prompt templates |
| POST | `/api/command/execute` | Execute shell command |
| GET | `/api/command/history` | Get command history |
| GET | `/api/git/status?path=...` | Get git status |
| GET | `/api/health` | Health check |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | Client → Server | Send chat message |
| `chat:chunk` | Server → Client | Streaming response chunk |
| `chat:done` | Server → Client | Response complete |
| `terminal:command` | Client → Server | Execute command |
| `terminal:output` | Server → Client | Real-time output |
| `terminal:done` | Server → Client | Command complete |
| `file:watch` | Client → Server | Watch file changes |
| `file:changed` | Server → Client | File modified notification |

## Configuration

Environment variables (optional):
- `PORT` — Backend server port (default: 4000)
- `WORKSPACE_ROOT` — Default workspace path
- `NODE_ENV` — Set to `development` for detailed error stacks

## Development

```bash
# Start frontend only
npm run dev:client

# Start backend only
npm run dev:server

# Type checking
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit

# Linting
npm run lint
```

## License

MIT
