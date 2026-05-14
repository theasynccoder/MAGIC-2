'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { Suspense } from 'react'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-[72px] md:pl-[256px] transition-all duration-300">
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
