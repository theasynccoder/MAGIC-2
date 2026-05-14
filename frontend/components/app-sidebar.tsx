'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  LayoutDashboard,
  MessageSquare,
  Brain,
  Scan,
  Microscope,
  FileSearch,
  Globe,
  TestTube,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'AI Chat',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'Medical RAG',
    href: '/chat?agent=rag',
    icon: FileSearch,
  },
  {
    title: 'Web Search',
    href: '/chat?agent=web-search',
    icon: Globe,
  },
  {
    title: 'Brain Tumor Detection',
    href: '/imaging?type=brain',
    icon: Brain,
  },
  {
    title: 'Chest X-Ray Analysis',
    href: '/imaging?type=chest',
    icon: Scan,
  },
  {
    title: 'Skin Lesion Analysis',
    href: '/imaging?type=skin',
    icon: Microscope,
  },
  {
    title: 'Blood & Tissue Pathology',
    href: '/imaging?type=pathology',
    icon: TestTube,
  },
]

const bottomItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Help',
    href: '/help',
    icon: HelpCircle,
  },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 glow-primary">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-lg font-bold gradient-text"
              >
                MAGIC
              </motion.span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href.split('?')[0])
            
            const content = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-sidebar-accent',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.title}
                  </motion.span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return content
          })}
        </nav>

        {/* Bottom items */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {bottomItems.map((item) => {
            const content = (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.title}
                  </motion.span>
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return content
          })}
        </div>

        {/* Status */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
              All systems operational
            </div>
          </div>
        )}
      </motion.aside>
    </TooltipProvider>
  )
}
