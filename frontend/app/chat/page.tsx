'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Paperclip,
  Sparkles,
  Bot,
  MessageSquare,
  FileSearch,
  Globe,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage, TypingIndicator } from '@/components/chat-message'
import { cn } from '@/lib/utils'
import { chatApi, type ChatMessage as ChatMessageType } from '@/lib/api'

const agents = [
  { id: 'medical-chat', name: 'Medical Chat', icon: MessageSquare, color: 'text-primary' },
  { id: 'medical-rag', name: 'Medical RAG', icon: FileSearch, color: 'text-accent' },
  { id: 'web-search', name: 'Web Search', icon: Globe, color: 'text-chart-3' },
]

const suggestedPrompts = [
  'What are the symptoms of diabetes?',
  'Explain how MRI scans work',
  'What is the difference between CT and MRI?',
  'How does the immune system fight viruses?',
  'What are common side effects of antibiotics?',
  'Explain the cardiovascular system',
]

export default function ChatPage() {
  const searchParams = useSearchParams()
  const initialAgent = searchParams.get('agent') || 'medical-chat'
  
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(initialAgent)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // Call the real API
      const response = await chatApi.sendMessage(userMessage.content, messages)
      
      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
      console.error('Chat API error:', err)
      
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="flex h-screen">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">AI Medical Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by MAGIC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={clearChat}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Agent Selector */}
        <div className="px-6 py-3 border-b border-border bg-card/30">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Agent:</span>
            <div className="flex gap-2">
              {agents.map((agent) => (
                <Button
                  key={agent.id}
                  variant={selectedAgent === agent.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedAgent(agent.id)}
                  className={cn(
                    'gap-2',
                    selectedAgent === agent.id && 'bg-primary/10 text-primary'
                  )}
                >
                  <agent.icon className={cn('w-4 h-4', agent.color)} />
                  {agent.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Error notification */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">{error}</p>
                  <p className="text-sm text-destructive/80 mt-1">Please try again or contact support if the problem persists.</p>
                </div>
              </motion.div>
            )}

            {/* Welcome message */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome to MAGIC Chat
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Ask me anything about medical topics. I can help with symptoms, 
                  conditions, treatments, and medical knowledge.
                </p>

                {/* Suggested prompts */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-w-2xl mx-auto">
                  {suggestedPrompts.map((prompt, index) => (
                    <motion.button
                      key={prompt}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handlePromptClick(prompt)}
                      className="p-3 text-left text-sm rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-colors"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chat messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 border-t border-border bg-card/50">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a medical question..."
                className="min-h-[60px] max-h-[200px] pr-24 resize-none bg-secondary/50 border-border focus:border-primary"
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={!input.trim() || isLoading}
                  className="glow-primary"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-center text-muted-foreground">
              MAGIC can make mistakes. Always verify important medical information.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
