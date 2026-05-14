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
  Mic,
  Square,
  X,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage, TypingIndicator } from '@/components/chat-message'
import { ChatHistorySidebar } from '@/components/chat-history-sidebar'
import { cn } from '@/lib/utils'
import {
  chatApi,
  uploadApi,
  audioApi,
  validationApi,
  conversationsApi,
  type ChatMessage as ChatMessageType,
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const toAbsoluteUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialAgent = searchParams.get('agent') || 'medical-chat'
  const { user, loading: authLoading } = useAuth()

  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(initialAgent)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/chat')
    }
  }, [authLoading, user, router])

  const loadConversation = useCallback(async (id: number) => {
    try {
      setLoadingConversation(true)
      setError(null)
      const conv = await conversationsApi.get(id)
      const loaded: ChatMessageType[] = conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        agentType: m.agentType || undefined,
        imageUrl: toAbsoluteUrl(m.imageUrl ?? undefined),
        resultImage: toAbsoluteUrl(m.resultImage ?? undefined),
      }))
      setMessages(loaded)
      setConversationId(conv.id)
    } catch (err) {
      console.error('Load conversation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conversation')
    } finally {
      setLoadingConversation(false)
    }
  }, [])

  const startNewChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setInput('')
    setError(null)
    setSelectedFile(null)
    setFilePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Unsupported file type. Use PNG, JPG, or JPEG.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.')
      return
    }

    setSelectedFile(file)
    setFilePreview(URL.createObjectURL(file))
    setError(null)
  }

  const clearSelectedFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (audioBlob.size === 0) {
          setError('No audio captured. Try again.')
          return
        }
        try {
          setIsTranscribing(true)
          const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type })
          const result = await audioApi.transcribe(file)
          if (result?.transcript) {
            setInput((prev) => (prev ? `${prev} ${result.transcript}` : result.transcript))
            textareaRef.current?.focus()
          } else {
            setError('Transcription returned no text.')
          }
        } catch (err) {
          console.error('Transcription error:', err)
          setError(err instanceof Error ? err.message : 'Transcription failed.')
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Microphone permission denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const toggleRecording = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isLoading) return
    if (!input.trim() && !selectedFile) return

    const fileToSend = selectedFile
    const previewToShow = filePreview
    const textToSend = input.trim()

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend || (fileToSend ? '(image attached)' : ''),
      timestamp: new Date(),
      imageUrl: previewToShow || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsLoading(true)
    setError(null)

    try {
      const response = fileToSend
        ? await uploadApi.uploadAndAnalyze(fileToSend, textToSend, conversationId ?? undefined)
        : await chatApi.sendMessage(textToSend, messages, conversationId ?? undefined)

      const needsValidation = response.agent?.includes('HUMAN_VALIDATION') ?? false
      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        agentType: response.agent,
        resultImage: toAbsoluteUrl(response.result_image),
        needsValidation,
        validationState: needsValidation ? 'pending' : undefined,
      }

      if (response.user_image_url) {
        const persistentUrl = toAbsoluteUrl(response.user_image_url)
        setMessages((prev) => {
          const updated = [...prev]
          const lastUserIdx = [...updated].reverse().findIndex((m) => m.role === 'user')
          if (lastUserIdx >= 0) {
            const idx = updated.length - 1 - lastUserIdx
            updated[idx] = { ...updated[idx], imageUrl: persistentUrl }
          }
          return updated
        })
      }

      setMessages((prev) => [...prev, aiMessage])

      if (response.conversation_id !== undefined) {
        const isNew = conversationId === null
        setConversationId(response.conversation_id)
        if (isNew) setHistoryRefreshKey((k) => k + 1)
        else setHistoryRefreshKey((k) => k + 1)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
      console.error('Chat API error:', err)
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidate = async (messageId: string, result: 'yes' | 'no', comments?: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, validationState: 'submitting' } : m))
    )
    setError(null)
    try {
      const validationResponse = await validationApi.submitValidation(result === 'yes' ? 'yes' : 'no', comments)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, validationState: result === 'yes' ? 'validated' : 'rejected' }
            : m
        )
      )
      const followUp: ChatMessageType = {
        id: `${messageId}-validated-${Date.now()}`,
        role: 'assistant',
        content: validationResponse.response || validationResponse.message || 'Validation recorded.',
        timestamp: new Date(),
        agentType: validationResponse.agent || (result === 'yes' ? 'Validated' : 'Review requested'),
      }
      setMessages((prev) => [...prev, followUp])
    } catch (err) {
      console.error('Validation error:', err)
      setError(err instanceof Error ? err.message : 'Validation failed')
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, validationState: 'pending' } : m))
      )
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
    startNewChat()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen">
      <ChatHistorySidebar
        activeId={conversationId}
        refreshKey={historyRefreshKey}
        onSelect={(id) => loadConversation(id)}
        onNewChat={startNewChat}
      />
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
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
                  agentType={message.agentType}
                  imageUrl={message.imageUrl}
                  resultImage={message.resultImage}
                  needsValidation={message.needsValidation}
                  validationState={message.validationState}
                  onValidate={(r, c) => handleValidate(message.id, r, c)}
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
            {filePreview && (
              <div className="mb-2 flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border border-border">
                <Image
                  src={filePreview}
                  alt="Selected"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded object-cover"
                  unoptimized
                />
                <span className="text-sm text-foreground/80 flex-1 truncate">
                  {selectedFile?.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearSelectedFile}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {isRecording && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                Recording... tap the stop button to transcribe.
              </div>
            )}
            {isTranscribing && (
              <div className="mb-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm text-primary">
                Transcribing audio...
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? 'Listening...' : 'Ask a medical question...'}
                className="min-h-[60px] max-h-[200px] pr-32 resize-none bg-secondary/50 border-border focus:border-primary"
                disabled={isLoading || isRecording}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isRecording}
                  className="text-muted-foreground"
                  title="Attach image"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleRecording}
                  disabled={isLoading || isTranscribing}
                  className={cn(
                    'text-muted-foreground',
                    isRecording && 'text-destructive bg-destructive/10 hover:bg-destructive/20'
                  )}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={(!input.trim() && !selectedFile) || isLoading || isRecording}
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
