'use client'

import { useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Activity, Loader2, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const redirect = search.get('redirect') || '/chat'
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setSubmitting(true)
    setError(null)
    try {
      await login(email.trim(), password)
      router.push(redirect)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur p-8 shadow-2xl"
    >
      <Link href="/" className="flex items-center gap-2 justify-center mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 glow-primary">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xl font-bold gradient-text">MAGIC</span>
      </Link>

      <h1 className="text-2xl font-bold text-foreground text-center mb-1">Welcome back</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Sign in to continue your medical conversations.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-9"
            />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
