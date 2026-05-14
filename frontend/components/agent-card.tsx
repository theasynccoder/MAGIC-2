'use client'

import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  FileSearch, 
  Globe, 
  Brain, 
  Scan, 
  Microscope,
  ArrowRight,
  type LucideIcon
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  FileSearch,
  Globe,
  Brain,
  Scan,
  Microscope,
}

interface AgentCardProps {
  id: string
  name: string
  description: string
  icon: string
  type: 'chat' | 'rag' | 'search' | 'vision'
  href?: string
  onClick?: () => void
  isActive?: boolean
  className?: string
}

export function AgentCard({
  id,
  name,
  description,
  icon,
  type,
  href,
  onClick,
  isActive,
  className,
}: AgentCardProps) {
  const Icon = iconMap[icon] || MessageSquare
  
  const typeColors = {
    chat: 'from-primary/20 to-primary/5 border-primary/30 hover:border-primary/50',
    rag: 'from-accent/20 to-accent/5 border-accent/30 hover:border-accent/50',
    search: 'from-chart-3/20 to-chart-3/5 border-chart-3/30 hover:border-chart-3/50',
    vision: 'from-chart-4/20 to-chart-4/5 border-chart-4/30 hover:border-chart-4/50',
  }

  const iconColors = {
    chat: 'text-primary bg-primary/20',
    rag: 'text-accent bg-accent/20',
    search: 'text-chart-3 bg-chart-3/20',
    vision: 'text-chart-4 bg-chart-4/20',
  }

  const content = (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border p-6 transition-all duration-300',
        'bg-gradient-to-br cursor-pointer',
        typeColors[type],
        isActive && 'ring-2 ring-primary',
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className={cn('p-3 rounded-lg', iconColors[type])}>
            <Icon className="h-6 w-6" />
          </div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>

        <h3 className="mt-4 text-lg font-semibold text-foreground">{name}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>

        <div className="mt-4 flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            iconColors[type]
          )}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return <div onClick={onClick}>{content}</div>
}
