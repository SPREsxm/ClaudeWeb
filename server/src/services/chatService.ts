import Anthropic from '@anthropic-ai/sdk';
import { streamClaudeResponse, sendToClaude, isClaudeCliAvailable, getOrCreateSession } from './claudeCliService.js';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are Claude, an AI coding assistant integrated into Claude Web — a graphical web IDE. You help users with software engineering tasks.

Your capabilities:
- Explain code in detail, breaking down logic and patterns
- Find and fix bugs with specific, actionable corrections
- Refactor code for readability, performance, and maintainability
- Write comprehensive tests covering edge cases
- Review code for security, performance, and best practices
- Debug errors with step-by-step solutions
- Answer technical questions with concrete examples

Guidelines:
- Use Markdown formatting for structured responses
- Put code in fenced code blocks with language tags
- Be concise but thorough — prefer actionable specifics over general advice
- When analyzing user code, reference specific lines or patterns
- Match the user's language (Chinese questions get Chinese answers, English gets English)`;

// Lazy-initialized Anthropic client
let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export type AIMode = 'cli' | 'sdk' | 'offline';

export function getAIMode(): AIMode {
  if (isClaudeCliAvailable()) return 'cli';
  if (!!process.env.ANTHROPIC_API_KEY) return 'sdk';
  return 'offline';
}

export function isRealAI(): boolean {
  return getAIMode() !== 'offline';
}

// Active session ID for CLI mode (maintained per workspace)
let activeCliSessionId: string | null = null;

export function getActiveCliSessionId(): string | null {
  return activeCliSessionId;
}

export function setActiveCliSessionId(id: string): void {
  activeCliSessionId = id;
}

export function getPromptTemplates(): PromptTemplate[] {
  return [
    { id: 'explain', title: '解释代码', description: '详细分析代码逻辑和结构', prompt: '请详细解释以下代码。分解每个部分的作用、整体目的以及使用的重要模式或概念。' },
    { id: 'fix', title: '修复 Bug', description: '找出并修复代码中的问题', prompt: '请审查以下代码中的 bug、潜在问题和边界情况。找出所有问题并提供修正后的代码，附上问题原因说明。' },
    { id: 'refactor', title: '重构优化', description: '改善代码结构和可读性', prompt: '请重构以下代码，提高可读性、可维护性，并遵循最佳实践。解释你的改动及其原因。' },
    { id: 'comments', title: '添加注释', description: '为代码添加文档和注释', prompt: '请为以下代码添加清晰简洁的注释。包含函数的 JSDoc/docstring、复杂逻辑的行内注释，以及文件顶部的概述。' },
    { id: 'tests', title: '编写测试', description: '生成全面的单元测试', prompt: '请为以下代码编写全面的单元测试。覆盖正常情况、边界情况和错误条件。使用适合该语言的测试框架。' },
    { id: 'optimize', title: '性能优化', description: '分析并提升运行效率', prompt: '请分析以下代码的性能瓶颈并提出优化建议。考虑时间复杂度、内存使用和算法改进。如适用，提供优化后的代码。' },
    { id: 'review', title: '代码审查', description: '全面的代码质量评审', prompt: '请对以下代码进行全面审查。从以下维度评估：正确性、安全性、性能、可维护性和最佳实践。提供具体可行的反馈。' },
    { id: 'error', title: '解释错误', description: '分析错误信息并给出修复方案', prompt: '请分析这个错误信息和堆栈跟踪。解释错误原因、为什么会发生，并提供逐步修复指南。' },
    { id: 'api', title: '设计 API', description: '设计 RESTful API 接口', prompt: '请帮我根据以下需求设计 RESTful API 端点。考虑 HTTP 方法、状态码、请求/响应格式、错误处理和最佳实践。' },
    { id: 'sql', title: '编写 SQL', description: '根据描述生成 SQL 查询', prompt: '请根据以下描述编写优化的 SQL 查询。包含索引建议、考虑查询性能并处理边界情况。' },
  ];
}

// Streaming: primary used by WebSocket
export async function* streamResponse(
  message: string,
  history: ChatMessage[],
  options?: {
    cliSessionId?: string;
    workspacePath?: string;
  },
): AsyncGenerator<string> {
  const mode = getAIMode();

  // Mode 1: Claude CLI (best — full Claude Code experience)
  if (mode === 'cli') {
    // Use the active CLI session if available, otherwise create a new one
    const sessionId = options?.cliSessionId || activeCliSessionId || getOrCreateSession(options?.workspacePath);
    if (!activeCliSessionId && options?.cliSessionId) {
      activeCliSessionId = options.cliSessionId;
    } else if (!activeCliSessionId) {
      activeCliSessionId = sessionId;
    }

    const isContinue = history.length > 0;
    for await (const chunk of streamClaudeResponse(message, {
      sessionId,
      continueSession: isContinue,
      cwd: options?.workspacePath,
      model: process.env.CLAUDE_MODEL,
    })) {
      yield chunk;
    }
    return;
  }

  // Mode 2: Anthropic SDK
  if (mode === 'sdk') {
    const anthropic = getClient()!;
    const messages: Anthropic.MessageParam[] = [
      ...history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    try {
      const stream = anthropic.messages.stream({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    } catch (error: any) {
      console.error('SDK streaming error:', error.message);
      yield `\n\n**API 错误**: ${error.message}`;
    }
    return;
  }

  // Mode 3: Offline
  yield generateFallbackResponse(message);
}

// Non-streaming: used by REST endpoint
export async function generateResponse(
  message: string,
  history: ChatMessage[],
  options?: {
    cliSessionId?: string;
    workspacePath?: string;
  },
): Promise<string> {
  const mode = getAIMode();

  // CLI mode: collect streaming output
  if (mode === 'cli') {
    let full = '';
    for await (const chunk of streamResponse(message, history, options)) {
      full += chunk;
    }
    return full;
  }

  // SDK mode
  if (mode === 'sdk') {
    const anthropic = getClient()!;
    const messages: Anthropic.MessageParam[] = [
      ...history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    try {
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      });
      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock?.text || 'No response generated.';
    } catch (error: any) {
      console.error('SDK error:', error.message);
      return `**API 错误**: ${error.message}`;
    }
  }

  // Offline
  return generateFallbackResponse(message);
}

function generateFallbackResponse(message: string): string {
  const lines = [
    '**⚠️ 未配置 AI 后端**',
    '',
    '当前无法连接到任何 AI 服务。请选择以下方式之一来启用 AI：',
    '',
    '**方式一：Claude CLI（推荐）**',
    '- Claude Code CLI 已自动检测，但当前连接失败',
    '- 请确认 `claude` 命令在终端中可用',
    '',
    '**方式二：API Key**',
    '- 在 `server/.env` 文件中添加：',
    '```',
    'ANTHROPIC_API_KEY=sk-ant-xxxxx',
    '```',
    '- 然后重启服务器',
    '',
    '---',
    '',
    '**你刚才的问题**: ' + (message.length > 200 ? message.slice(0, 200) + '...' : message),
  ];
  return lines.join('\n');
}
