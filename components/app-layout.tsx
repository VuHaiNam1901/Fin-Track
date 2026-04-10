"use client"

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useFinance } from '@/lib/finance-context'
import { AppSidebar } from './app-sidebar'
import { Wallet } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { auth } = useFinance()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push('/')
    }
  }, [auth.isAuthenticated, auth.isLoading, router])

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2">
          <Wallet className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
