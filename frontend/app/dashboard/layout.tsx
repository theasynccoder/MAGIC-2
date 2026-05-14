'use client'

import { AppSidebar } from '@/components/app-sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-[72px] md:pl-[256px] transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
