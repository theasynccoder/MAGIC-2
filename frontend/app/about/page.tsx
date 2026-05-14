'use client'

import { motion } from 'framer-motion'
import {
  Brain,
  MessageSquare,
  FileSearch,
  Globe,
  Scan,
  Microscope,
  Cpu,
  Database,
  Shield,
  Zap,
  GitBranch,
  Layers,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const agents = [
  {
    icon: MessageSquare,
    name: 'Medical Conversation Agent',
    description: 'Natural language understanding for medical Q&A with context-aware responses and medical terminology support.',
    tech: 'LLM, NLP, Medical Embeddings',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: FileSearch,
    name: 'Medical RAG Agent',
    description: 'Retrieval-Augmented Generation combining medical literature with AI reasoning for evidence-based answers.',
    tech: 'Vector DB, RAG Pipeline, Citation',
    color: 'text-accent bg-accent/10',
  },
  {
    icon: Globe,
    name: 'Web Search Agent',
    description: 'Real-time medical web search with source verification from trusted healthcare databases and journals.',
    tech: 'Web Scraping, Source Ranking',
    color: 'text-chart-3 bg-chart-3/10',
  },
  {
    icon: Brain,
    name: 'Brain Tumor Detection',
    description: 'Deep learning model for MRI scan analysis, tumor detection, and classification with confidence scoring.',
    tech: 'CNN, Transfer Learning, ResNet',
    color: 'text-chart-4 bg-chart-4/10',
  },
  {
    icon: Scan,
    name: 'Chest X-Ray Analysis',
    description: 'Computer vision model for COVID-19 and pneumonia detection from chest radiographs.',
    tech: 'CNN, DenseNet, Image Classification',
    color: 'text-chart-5 bg-chart-5/10',
  },
  {
    icon: Microscope,
    name: 'Skin Lesion Segmentation',
    description: 'U-Net based segmentation model for dermatology image analysis and lesion boundary detection.',
    tech: 'U-Net, Segmentation, Dermatology AI',
    color: 'text-primary bg-primary/10',
  },
]

const architecture = [
  {
    icon: Layers,
    title: 'Multi-Agent Orchestration',
    description: 'Intelligent routing system that selects the optimal AI agent based on user queries and context.',
  },
  {
    icon: Database,
    title: 'RAG Pipeline',
    description: 'Vector database integration with medical literature for accurate, source-backed responses.',
  },
  {
    icon: Cpu,
    title: 'ML Model Serving',
    description: 'Optimized inference pipeline for real-time medical image analysis and predictions.',
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'End-to-end encryption with no data persistence. HIPAA-compliant architecture design.',
  },
]

const techStack = {
  frontend: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Framer Motion', 'shadcn/ui'],
  backend: ['Python', 'Flask', 'FastAPI', 'REST APIs'],
  ai: ['PyTorch', 'TensorFlow', 'Transformers', 'LangChain'],
  infra: ['Docker', 'AWS', 'Vercel', 'PostgreSQL'],
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 animated-gradient opacity-50" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <GitBranch className="w-4 h-4" />
                Open Source Project
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-balance">
                About <span className="gradient-text">MAGIC</span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Multi-Agent Generative Intelligent Care is an advanced AI-powered medical 
                assistant platform that combines cutting-edge machine learning with 
                comprehensive healthcare knowledge.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground">System Architecture</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Built with a modular, scalable architecture designed for real-world medical applications.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {architecture.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 border-border h-full">
                    <CardContent className="pt-6">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Agents */}
        <section className="py-20 bg-card/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground">AI Agent Network</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Six specialized AI agents working together to provide comprehensive medical assistance.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 border-border h-full hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={cn('p-3 rounded-lg', agent.color)}>
                          <agent.icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {agent.tech.split(', ').map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground">Technology Stack</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Built with modern, production-ready technologies for performance and scalability.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(techStack).map(([category, technologies], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 border-border">
                    <CardHeader>
                      <CardTitle className="text-base capitalize">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1.5 text-sm rounded-lg bg-secondary/50 text-foreground border border-border"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance Stats */}
        <section className="py-20 bg-card/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 lg:p-12"
            >
              <div className="text-center mb-10">
                <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground">Performance Metrics</h2>
              </div>
              
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { value: '< 2s', label: 'Avg Response Time' },
                  { value: '98.2%', label: 'Model Accuracy' },
                  { value: '99.9%', label: 'Uptime SLA' },
                  { value: '6+', label: 'AI Agents' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-4xl font-bold gradient-text">{stat.value}</div>
                    <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
              <h3 className="text-lg font-semibold text-yellow-500 mb-2">Important Notice</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                MAGIC is an educational project demonstrating AI capabilities in healthcare. 
                It is not intended for actual medical diagnosis or treatment. Always consult 
                qualified healthcare professionals for medical advice. The AI models provide 
                informational insights only and should not replace professional medical judgment.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
