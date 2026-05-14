'use client'

import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Brain, 
  Search, 
  Scan, 
  Microscope, 
  FileSearch,
  Zap,
  Shield,
  Clock
} from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'Medical Conversation AI',
    description: 'Engage in natural conversations about medical topics with our advanced AI that understands context and provides accurate information.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: FileSearch,
    title: 'RAG-Powered Knowledge',
    description: 'Access a vast medical knowledge base with retrieval-augmented generation for document-based reasoning and citations.',
    color: 'text-accent bg-accent/10',
  },
  {
    icon: Search,
    title: 'Medical Web Search',
    description: 'Search trusted medical sources and retrieve up-to-date information from reputable healthcare databases.',
    color: 'text-chart-3 bg-chart-3/10',
  },
  {
    icon: Brain,
    title: 'Brain Tumor Detection',
    description: 'Upload MRI scans for AI-powered brain tumor detection with high accuracy and detailed confidence scores.',
    color: 'text-chart-4 bg-chart-4/10',
  },
  {
    icon: Scan,
    title: 'Chest X-Ray Analysis',
    description: 'Analyze chest X-rays for COVID-19 and pneumonia detection using state-of-the-art computer vision models.',
    color: 'text-chart-5 bg-chart-5/10',
  },
  {
    icon: Microscope,
    title: 'Skin Lesion Segmentation',
    description: 'Advanced dermatology image analysis with precise lesion segmentation and diagnostic support.',
    color: 'text-primary bg-primary/10',
  },
]

const capabilities = [
  {
    icon: Zap,
    title: 'Real-time Analysis',
    description: 'Get instant results with our optimized AI pipeline.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your medical data is encrypted and never stored.',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Access medical AI assistance anytime, anywhere.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase">
            Capabilities
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Powered by Advanced AI Agents
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Our multi-agent system combines specialized AI models to deliver comprehensive 
            medical assistance across various domains.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Additional capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20 p-8 rounded-2xl glass-card"
        >
          <div className="grid gap-8 md:grid-cols-3">
            {capabilities.map((cap, index) => (
              <div key={cap.title} className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <cap.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{cap.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
