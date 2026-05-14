'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Trash2, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { conversationsApi, type ConversationSummary } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface ChatHistorySidebarProps {
  activeId: number | null
  refreshKey: number
  onSelect: (id: number) => void
  onNewChat: () => void
}

export function ChatHistorySidebar({ activeId, refreshKey, onSelect, onNewChat }: ChatHistorySidebarProps) {
  const { user, logout } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const list = await conversationsApi.list()
      setConversations(list)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    setDeletingId(id)
    try {
      await conversationsApi.remove(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (id === activeId) onNewChat()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-card/40 flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <Button onClick={onNewChat} className="w-full gap-2" variant="secondary">
          <Plus className="w-4 h-4" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="text-center text-sm text-muted-foreground p-6">
            No conversations yet. Start a new chat to begin.
          </div>
        )}

        <AnimatePresence initial={false}>
          {conversations.map((conv) => {
            const isActive = conv.id === activeId
            return (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'group w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-secondary/60 text-foreground/80'
                )}
              >
                <MessageSquare className={cn('w-4 h-4 mt-0.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className="flex-1 text-sm truncate">{conv.title}</span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, conv.id)}
                  className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive',
                    deletingId === conv.id && 'opacity-100'
                  )}
                  aria-label="Delete conversation"
                >
                  {deletingId === conv.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {user && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      )}
    </aside>
  )
}
