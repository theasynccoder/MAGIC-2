'use client'

import { useState, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, HelpCircle, MessageSquare, Mail, Phone, FileText, ChevronDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'

const faqs = [
  {
    question: 'What medical conditions can MAGIC analyze?',
    answer: 'MAGIC specializes in analyzing brain MRI scans for tumor detection, chest X-rays for COVID-19 and pneumonia detection, and skin lesion images for dermatology analysis. Our AI models are trained on extensive medical datasets.',
  },
  {
    question: 'How accurate is the AI analysis?',
    answer: 'Our models achieve high accuracy rates, but results are always provided as diagnostic support only. Please consult with qualified medical professionals for final diagnosis and treatment decisions.',
  },
  {
    question: 'Is my medical data secure and private?',
    answer: 'Yes, all medical data is encrypted in transit and at rest. We comply with HIPAA regulations and maintain strict data privacy standards. Images are processed securely and can be deleted anytime.',
  },
  {
    question: 'What image formats are supported?',
    answer: 'We support JPEG, PNG, and DICOM formats. Images should be clear and properly oriented for best results. Maximum file size is 10MB.',
  },
  {
    question: 'How long does analysis take?',
    answer: 'Most analyses complete within 30-60 seconds. Complex cases may take longer. You can close the page and check results later in your chat history.',
  },
  {
    question: 'Can I download my analysis results?',
    answer: 'Yes, analysis results can be viewed, shared, and exported directly from the imaging page or your chat history.',
  },
  {
    question: 'What if I disagree with the AI result?',
    answer: 'AI is a support tool, not a replacement for professional medical judgment. Always verify results with qualified healthcare providers.',
  },
  {
    question: 'Is there a cost to use MAGIC?',
    answer: 'MAGIC offers different pricing tiers. Check our pricing page for details on free tier limitations and premium features.',
  },
]

const supportChannels = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help via email',
    contact: 'support@magic.ai',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team',
    contact: 'Available 24/7',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Call us for urgent issues',
    contact: '+1 (555) 123-4567',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
]

function HelpContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/help')
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
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
            <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
            <p className="mt-1 text-muted-foreground">
              Find answers and get support for MAGIC.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Support Channels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-6 md:grid-cols-3 mb-12"
      >
        {supportChannels.map((channel, idx) => (
          <Card key={idx} className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className={`${channel.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <channel.icon className={`w-6 h-6 ${channel.color}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{channel.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{channel.description}</p>
              <p className="text-sm font-medium text-primary">{channel.contact}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Documentation Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-12"
      >
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Documentation & Resources</CardTitle>
            </div>
            <CardDescription>Learn more about using MAGIC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href="/docs/getting-started"
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">Getting Started Guide</p>
                <p className="text-sm text-muted-foreground">Learn how to use MAGIC's features</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-270" />
            </a>

            <a
              href="/docs/image-analysis"
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">Image Analysis Guide</p>
                <p className="text-sm text-muted-foreground">Best practices for medical image uploads</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-270" />
            </a>

            <a
              href="/docs/ai-chat"
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">AI Chat Guide</p>
                <p className="text-sm text-muted-foreground">Tips for asking medical questions</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-270" />
            </a>

            <a
              href="/docs/privacy"
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">Privacy & Security</p>
                <p className="text-sm text-muted-foreground">Understand how your data is protected</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-270" />
            </a>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <CardTitle>Frequently Asked Questions</CardTitle>
            </div>
            <CardDescription>Find answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg overflow-hidden transition-colors hover:border-primary/50"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-foreground">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-4 py-3 bg-secondary/30 border-t border-border text-sm text-muted-foreground">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 p-8 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 text-center"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">Still need help?</h2>
        <p className="text-muted-foreground mb-4">
          Our support team is here to help you get the most out of MAGIC.
        </p>
        <Button asChild>
          <a href="mailto:support@magic.ai">Contact Support</a>
        </Button>
      </motion.div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <HelpContent />
    </Suspense>
  )
}
