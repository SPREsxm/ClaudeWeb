import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot } from 'lucide-react';
import { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const isUser = message.role === 'user';

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} px-3 py-1.5`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={13} className="text-white" />
        </div>
      )}

      <div
        className={`
          max-w-[85%] rounded-xl px-3 py-2 overflow-hidden
          ${isUser ? 'bg-accent-primary/20 border border-accent-primary/30' : 'bg-surface-800 border border-surface-700/50'}
        `}
      >
        {/* Markdown content */}
        <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-relaxed [&_pre]:!my-2 [&_p]:!my-1 [&_ul]:!my-1 [&_ol]:!my-1 [&_h1]:!text-base [&_h2]:!text-sm [&_h3]:!text-sm [&_table]:!text-xs">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeStr = String(children).replace(/\n$/, '');
                const isInline = !match;

                if (isInline) {
                  return (
                    <code className="bg-surface-700 px-1 py-0.5 rounded text-[12px] font-mono text-accent-secondary" {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <div className="relative group my-2">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-surface-700/50 rounded-t-lg border-b border-surface-700">
                      <span className="text-[10px] text-surface-400 uppercase font-mono">
                        {match[1]}
                      </span>
                      <button
                        onClick={() => handleCopy(codeStr)}
                        className="p-1 rounded hover:bg-surface-600 transition-colors text-surface-400 hover:text-white"
                      >
                        {copiedCode === codeStr ? (
                          <Check size={12} className="text-terminal-green" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomLeftRadius: '0.5rem',
                        borderBottomRightRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    >
                      {codeStr}
                    </SyntaxHighlighter>
                  </div>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full border-collapse border border-surface-700 text-[11px]">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="border border-surface-700 px-2 py-1 bg-surface-700/50 text-left font-medium text-surface-300">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return <td className="border border-surface-700 px-2 py-1">{children}</td>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Timestamp */}
        <div className={`text-[9px] text-surface-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-6 h-6 rounded-md bg-surface-700 flex items-center justify-center shrink-0 mt-0.5">
          <User size={13} className="text-surface-400" />
        </div>
      )}
    </motion.div>
  );
}
