'use client'

import { motion } from 'framer-motion'
import { 
  Activity, 
  MessageSquare, 
  Brain, 
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { AgentCard } from '@/components/agent-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AGENTS } from '@/lib/api'

const stats = [
  {
    title: 'Total Analyses',
    value: '1,247',
    change: '+12%',
    icon: Activity,
    color: 'text-primary bg-primary/10',
  },
  {
    title: 'Conversations',
    value: '856',
    change: '+8%',
    icon: MessageSquare,
    color: 'text-accent bg-accent/10',
  },
  {
    title: 'Predictions Made',
    value: '391',
    change: '+23%',
    icon: Brain,
    color: 'text-chart-4 bg-chart-4/10',
  },
  {
    title: 'Accuracy Rate',
    value: '98.2%',
    change: '+0.5%',
    icon: TrendingUp,
    color: 'text-chart-3 bg-chart-3/10',
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'chat',
    title: 'Medical consultation completed',
    time: '5 minutes ago',
    status: 'completed',
  },
  {
    id: 2,
    type: 'analysis',
    title: 'Brain MRI scan analyzed',
    time: '1 hour ago',
    status: 'completed',
  },
  {
    id: 3,
    type: 'analysis',
    title: 'Chest X-ray processed',
    time: '2 hours ago',
    status: 'completed',
  },
  {
    id: 4,
    type: 'chat',
    title: 'RAG query answered',
    time: '3 hours ago',
    status: 'completed',
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to MAGIC. Select an AI agent to get started.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        {stats.map((stat, index) => (
          <Card key={stat.title} className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-green-500">{stat.change}</span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/chat">
              View All
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/chat">
              <MessageSquare className="mr-2 w-4 h-4" />
              Start Chat
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/imaging?type=brain">
              <Brain className="mr-2 w-4 h-4" />
              Analyze MRI
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/imaging?type=chest">
              Upload X-Ray
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* AI Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">AI Agents</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {AGENTS.map((agent) => (
              <AgentCard
                key={agent.id}
                {...agent}
                href={agent.type === 'vision' 
                  ? `/imaging?type=${agent.id}` 
                  : agent.type === 'chat' || agent.type === 'rag'
                    ? `/chat?agent=${agent.id}`
                    : '/chat'
                }
              />
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="mt-4 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Chat API', status: 'operational' },
                { name: 'Image Analysis', status: 'operational' },
                { name: 'RAG Pipeline', status: 'operational' },
                { name: 'Web Search', status: 'operational' },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-500 capitalize">{service.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
