'use client'

import { useState, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, Shield, Palette, LogOut, Mail, User, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'

const settingsSections = [
  {
    id: 'account',
    name: 'Account',
    icon: User,
    description: 'Manage your account settings and profile',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    description: 'Control notification preferences',
  },
  {
    id: 'privacy',
    name: 'Privacy & Security',
    icon: Shield,
    description: 'Manage privacy and security settings',
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: Palette,
    description: 'Customize how MAGIC looks',
  },
]

function SettingsContent() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/settings')
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your MAGIC account and preferences.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1"
        >
          <div className="space-y-2">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <section.icon className="w-4 h-4" />
                  <span className="font-medium">{section.name}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3 space-y-6"
        >
          {/* Account Settings */}
          {activeTab === 'account' && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{user?.email || 'Loading...'}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your email address is used for login and notifications.
                  </p>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-foreground mb-4">Account Actions</h3>
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-medium text-foreground">Analysis Complete</p>
                    <p className="text-sm text-muted-foreground">Get notified when image analysis finishes</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-medium text-foreground">Chat Replies</p>
                    <p className="text-sm text-muted-foreground">Get notified when medical AI responds</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-medium text-foreground">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">Learn about new features and updates</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy & Security */}
          {activeTab === 'privacy' && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Manage your privacy and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-sm font-medium text-foreground mb-2">🔒 Your data is secure</p>
                  <p className="text-sm text-muted-foreground">
                    All medical data is encrypted and stored securely. We comply with HIPAA standards.
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground mb-3">Privacy Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <div>
                        <p className="font-medium text-foreground">Data Collection</p>
                        <p className="text-sm text-muted-foreground">Allow MAGIC to improve with your data</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <div>
                        <p className="font-medium text-foreground">Analytics Tracking</p>
                        <p className="text-sm text-muted-foreground">Help us understand feature usage</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize MAGIC's appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="font-medium text-foreground mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="p-4 rounded-lg border-2 border-primary bg-card/50">
                      <div className="mb-2 text-sm font-medium text-foreground">Dark</div>
                      <div className="text-xs text-muted-foreground">System default</div>
                    </button>
                    <button className="p-4 rounded-lg border border-border hover:border-primary bg-card/50">
                      <div className="mb-2 text-sm font-medium text-foreground">Light</div>
                      <div className="text-xs text-muted-foreground">Light mode</div>
                    </button>
                    <button className="p-4 rounded-lg border border-border hover:border-primary bg-card/50">
                      <div className="mb-2 text-sm font-medium text-foreground">Auto</div>
                      <div className="text-xs text-muted-foreground">Match system</div>
                    </button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <p className="font-medium text-foreground mb-3">Accessibility</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="font-medium text-foreground">Reduce Motion</p>
                      <input type="checkbox" className="w-5 h-5 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="font-medium text-foreground">High Contrast</p>
                      <input type="checkbox" className="w-5 h-5 rounded" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  )
}
