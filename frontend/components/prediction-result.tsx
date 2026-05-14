'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Download, Info } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PredictionResultProps {
  prediction: string
  confidence: number
  probabilities?: Record<string, number>
  explanation?: string
  category?: string
  description?: string
  originalImage?: string
  resultImage?: string
  className?: string
}

export function PredictionResult({
  prediction,
  confidence,
  probabilities,
  explanation,
  category,
  description,
  originalImage,
  resultImage,
  className,
}: PredictionResultProps) {
  const confidenceLevel = confidence > 0.85 ? 'high' : confidence > 0.6 ? 'medium' : 'low'
  
  const confidenceConfig = {
    high: {
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      label: 'High Confidence',
    },
    medium: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      label: 'Medium Confidence',
    },
    low: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Low Confidence',
    },
  }

  const config = confidenceConfig[confidenceLevel]
  const ConfidenceIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('space-y-6', className)}
    >
      {/* Main Result Card */}
      <Card className={cn('border-2', config.border)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', config.bg)}>
                <ConfidenceIcon className={cn('w-6 h-6', config.color)} />
              </div>
              <div>
                <CardTitle className="text-xl">Analysis Result</CardTitle>
                <p className={cn('text-sm', config.color)}>{config.label}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn('grid gap-6', probabilities ? 'md:grid-cols-2' : '')}>
            {/* Prediction */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Prediction</h4>
                <p className="text-2xl font-bold text-foreground">{prediction}</p>
              </div>

              {category && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                  <p className="text-lg text-foreground">{category}</p>
                </div>
              )}
              
              {/* Confidence Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Confidence Score</h4>
                  <span className={cn('text-lg font-bold', config.color)}>
                    {(confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={confidence * 100} className="h-3" />
              </div>
            </div>

            {/* Probability Distribution */}
            {probabilities && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Probability Distribution</h4>
                <div className="space-y-3">
                  {Object.entries(probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([label, prob]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{label}</span>
                          <span className="text-muted-foreground">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={prob * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Comparison */}
      {(originalImage || resultImage) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Image Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {originalImage && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Original Image</h4>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-black/50">
                    <Image
                      src={originalImage}
                      alt="Original medical image"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
              {resultImage && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Analysis Result</h4>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-black/50">
                    <Image
                      src={resultImage}
                      alt="Analysis result"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      {(explanation || description) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">AI Explanation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{explanation || description}</p>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-yellow-500">Medical Disclaimer</p>
          <p className="text-muted-foreground mt-1">
            This AI analysis is for informational purposes only and should not be used as a substitute 
            for professional medical advice, diagnosis, or treatment. Always consult with a qualified 
            healthcare provider.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
