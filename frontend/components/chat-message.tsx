'use client'

import { motion } from 'framer-motion'
import { Bot, User, Copy, Check, Volume2, Pause, Play, RotateCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { audioApi } from '@/lib/api'

type SpeechLang = 'en' | 'hi' | 'kn'
type AudioState = 'idle' | 'fetching' | 'playing' | 'paused'

const LANG_LABEL: Record<SpeechLang, string> = {
  en: 'EN',
  hi: 'हि',
  kn: 'ಕ',
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  isStreaming?: boolean
  agentType?: string
  resultImage?: string
  imageUrl?: string
  needsValidation?: boolean
  validationState?: 'pending' | 'validated' | 'rejected' | 'submitting'
  onValidate?: (result: 'yes' | 'no', comments?: string) => void
}

export function ChatMessage({ role, content, timestamp, isStreaming, agentType, resultImage, imageUrl, needsValidation, validationState, onValidate }: ChatMessageProps) {
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [copied, setCopied] = useState(false)
  const [audioState, setAudioState] = useState<AudioState>('idle')
  const [language, setLanguage] = useState<SpeechLang>('en')
  const [translations, setTranslations] = useState<Partial<Record<SpeechLang, string>>>({})
  const [translating, setTranslating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const isUser = role === 'user'

  const displayContent =
    language === 'en' ? content : translations[language] ?? content

  // Fetch translation lazily on language switch (cached per language).
  useEffect(() => {
    if (isUser) return
    if (language === 'en') return
    if (translations[language]) return
    if (!content.trim()) return

    let cancelled = false
    setTranslating(true)
    audioApi
      .translate(content, language)
      .then((text) => {
        if (!cancelled && text) {
          setTranslations((prev) => ({ ...prev, [language]: text }))
        }
      })
      .catch((err) => {
        console.error('Translate error:', err)
      })
      .finally(() => {
        if (!cancelled) setTranslating(false)
      })

    return () => {
      cancelled = true
    }
  }, [language, content, translations, isUser])

  // Stop and clean up any in-flight audio when the component unmounts.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setAudioState('idle')
  }

  const handleLanguageChange = (lang: SpeechLang) => {
    if (lang === language) return
    resetAudio()
    setLanguage(lang)
  }

  const handlePlayPause = async () => {
    // Already playing → pause
    if (audioState === 'playing' && audioRef.current) {
      audioRef.current.pause()
      setAudioState('paused')
      return
    }
    // Paused → resume
    if (audioState === 'paused' && audioRef.current) {
      try {
        await audioRef.current.play()
        setAudioState('playing')
      } catch (e) {
        console.error('Audio resume error:', e)
        setAudioState('idle')
      }
      return
    }
    if (audioState === 'fetching') return

    // Idle → fetch fresh audio. Backend handles translation when language !== 'en'.
    try {
      setAudioState('fetching')
      const audioBlob = await audioApi.generateSpeech(content, undefined, language)
      const url = URL.createObjectURL(audioBlob)
      audioUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setAudioState('idle')
      await audio.play()
      setAudioState('playing')
    } catch (error) {
      console.error('Error generating speech:', error)
      setAudioState('idle')
    }
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
        'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
        isUser ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? 'You' : agentType ? `${agentType}` : 'MAGIC AI'}
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
          {!isUser && translating && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <RotateCw className="w-3 h-3 animate-spin" />
              Translating to {language === 'hi' ? 'Hindi' : 'Kannada'}...
            </span>
          )}
          {!isUser && language !== 'en' && translations[language] && !translating && (
            <span className="text-xs text-muted-foreground">
              · Translated · <button type="button" onClick={() => handleLanguageChange('en')} className="text-primary hover:underline">Show English</button>
            </span>
          )}
        </div>

        {imageUrl && isUser && (
          <div className="mb-3 rounded-lg overflow-hidden bg-secondary/30 p-2 inline-block">
            <Image
              src={imageUrl}
              alt="Uploaded image"
              width={320}
              height={320}
              className="max-w-xs max-h-64 w-auto h-auto rounded object-contain"
              unoptimized
            />
          </div>
        )}

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
            {displayContent}
          </ReactMarkdown>
        </div>

        {/* Result Image Display */}
        {resultImage && !isUser && (
          <div className="mt-3 rounded-lg overflow-hidden bg-secondary/30 p-2">
            <div className="relative w-full max-w-sm h-auto">
              <Image
                src={resultImage}
                alt="Analysis result"
                width={400}
                height={400}
                className="w-full h-auto rounded"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Human Validation UI */}
        {needsValidation && !isUser && onValidate && (
          <div className="mt-4 p-3 rounded-lg border border-border bg-secondary/30">
            {validationState === 'pending' && !showCommentBox && (
              <div className="space-y-3">
                <p className="text-sm text-foreground/80">
                  Please validate this result:
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onValidate('yes')}
                    className="gap-2 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Yes, confirm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCommentBox(true)}
                    className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    No, needs review
                  </Button>
                </div>
              </div>
            )}

            {validationState === 'pending' && showCommentBox && (
              <div className="space-y-3">
                <p className="text-sm text-foreground/80">
                  Please describe the issue or concern:
                </p>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your comments..."
                  className="min-h-[80px] resize-none bg-background/50"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onValidate('no', commentText.trim() || undefined)}
                    className="bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30"
                  >
                    Submit feedback
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCommentBox(false)
                      setCommentText('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {validationState === 'submitting' && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <RotateCw className="w-3 h-3 animate-spin" />
                Submitting validation...
              </p>
            )}

            {validationState === 'validated' && (
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Confirmed by validator.
              </p>
            )}

            {validationState === 'rejected' && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" />
                Marked for further review.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isUser && !isStreaming && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-end">
          <div className="flex items-center gap-1 rounded-md bg-secondary/40 p-0.5">
            {(['en', 'hi', 'kn'] as SpeechLang[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors',
                  language === lang
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={
                  lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'ಕನ್ನಡ (Kannada)'
                }
              >
                {LANG_LABEL[lang]}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handlePlayPause}
            disabled={audioState === 'fetching'}
            className={cn(
              'text-muted-foreground hover:text-foreground',
              audioState === 'playing' && 'text-primary'
            )}
            title={
              audioState === 'playing'
                ? 'Pause'
                : audioState === 'paused'
                  ? 'Resume'
                  : audioState === 'fetching'
                    ? 'Generating audio...'
                    : 'Read aloud'
            }
          >
            {audioState === 'fetching' ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : audioState === 'playing' ? (
              <Pause className="w-4 h-4" />
            ) : audioState === 'paused' ? (
              <Play className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground"
            title="Copy message"
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
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-accent/20 text-accent">
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
