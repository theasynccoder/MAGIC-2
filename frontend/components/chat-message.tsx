'use client'

import { motion } from 'framer-motion'
import { Bot, User, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  isStreaming?: boolean
}

export function ChatMessage({ role, content, timestamp, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group flex gap-4 p-4 rounded-xl',
        isUser ? 'bg-secondary/50' : 'bg-card'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
        isUser ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? 'You' : 'MAGIC AI'}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
              Typing...
            </span>
          )}
        </div>

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground/90">{children}</p>,
              code: ({ className, children, ...props }) => {
                const isInline = !className
                return isInline ? (
                  <code className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-sm" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="block p-4 rounded-lg bg-secondary/80 text-foreground font-mono text-sm overflow-x-auto" {...props}>
                    {children}
                  </code>
                )
              },
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-foreground/90">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-foreground/90">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-foreground">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-foreground">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-bold mb-2 text-foreground">{children}</h3>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Actions */}
      {!isUser && !isStreaming && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 p-4 rounded-xl bg-card"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-accent/20 text-accent">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-1 pt-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
