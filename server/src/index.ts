import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import { fileRouter } from './routes/files.js';
import { chatRouter } from './routes/chat.js';
import { commandRouter } from './routes/command.js';
import { gitRouter } from './routes/git.js';
import { workspaceRouter } from './routes/workspace.js';
import { sessionsRouter } from './routes/sessions.js';
import { claudeSessionsRouter } from './routes/claudeSessions.js';
import { setupWebSocket } from './services/wsHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isRealAI, getAIMode } from './services/chatService.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: ['http://localhost:3000'] }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/files', fileRouter);
app.use('/api/chat', chatRouter);
app.use('/api/command', commandRouter);
app.use('/api/git', gitRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/claude-sessions', claudeSessionsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket setup
setupWebSocket(io);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Claude Web Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
  const mode = getAIMode();
  if (mode === 'cli') {
    console.log(`🖥️  Claude CLI mode — 消息将转发到本地 Claude Code`);
  } else if (mode === 'sdk') {
    console.log(`🧠 Claude API mode (model: ${process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'})`);
  } else {
    console.log(`⚠️  Offline mode — 请配置 ANTHROPIC_API_KEY 或确保 Claude CLI 可用`);
  }
});
