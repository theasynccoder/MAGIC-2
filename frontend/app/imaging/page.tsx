'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Brain, Scan, Microscope, ArrowLeft, Info, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUpload } from '@/components/image-upload'
import { PredictionResult } from '@/components/prediction-result'
import { cn } from '@/lib/utils'
import { predictionApi, type PredictionResult as PredictionResultType } from '@/lib/api'

const analysisTypes = [
  {
    id: 'brain',
    name: 'Brain Tumor Detection',
    description: 'Upload MRI scans for AI-powered brain tumor detection and classification.',
    icon: Brain,
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
    accepts: '.jpg,.jpeg,.png',
    instructions: [
      'Upload a brain MRI scan image',
      'Supported formats: JPEG, PNG',
      'Ensure the image is clear and properly oriented',
      'AI will analyze for tumor presence and classification',
    ],
  },
  {
    id: 'chest',
    name: 'Chest X-Ray Analysis',
    description: 'Analyze chest X-rays for COVID-19 and pneumonia detection.',
    icon: Scan,
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
    accepts: '.jpg,.jpeg,.png',
    instructions: [
      'Upload a chest X-ray image',
      'Frontal PA or AP views work best',
      'Image should be properly exposed',
      'AI will classify as Normal, COVID-19, or Pneumonia',
    ],
  },
  {
    id: 'skin',
    name: 'Skin Lesion Analysis',
    description: 'Advanced dermatology image analysis with lesion segmentation.',
    icon: Microscope,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    accepts: '.jpg,.jpeg,.png',
    instructions: [
      'Upload a clear skin lesion image',
      'Ensure good lighting and focus',
      'Include the entire lesion in frame',
      'AI will segment and analyze the lesion',
    ],
  },
]

function ImagingContent() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || 'brain'
  
  const [selectedType, setSelectedType] = useState(initialType)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<PredictionResultType | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentType = analysisTypes.find((t) => t.id === selectedType)!

  const handleUpload = async (file: File) => {
    setIsAnalyzing(true)
    setResult(null)
    setError(null)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImage(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      // Call the real API
      const response = await predictionApi.predictMedical(file)
      
      if (response.error) {
        setError(response.error)
      } else {
        setResult(response)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image'
      setError(errorMessage)
      console.error('Prediction API error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleNewAnalysis = () => {
    setResult(null)
    setUploadedImage(null)
    setError(null)
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
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Medical Image Analysis</h1>
            <p className="mt-1 text-muted-foreground">
              Upload medical images for AI-powered analysis and diagnosis support.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Analysis Type Tabs */}
      <Tabs value={selectedType} onValueChange={(v) => { setSelectedType(v); handleNewAnalysis(); }}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid mb-8">
          {analysisTypes.map((type) => (
            <TabsTrigger
              key={type.id}
              value={type.id}
              className="gap-2"
            >
              <type.icon className={cn('w-4 h-4', type.color)} />
              <span className="hidden sm:inline">{type.name.split(' ')[0]}</span>
              <span className="sm:hidden">{type.name.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {analysisTypes.map((type) => (
          <TabsContent key={type.id} value={type.id}>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Upload Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', type.bgColor)}>
                        <type.icon className={cn('w-5 h-5', type.color)} />
                      </div>
                      <div>
                        <CardTitle>{type.name}</CardTitle>
                        <CardDescription>{type.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!result && !error ? (
                      <ImageUpload
                        onUpload={handleUpload}
                        isLoading={isAnalyzing}
                        accept={type.accepts}
                      />
                    ) : (
                      <div className="space-y-4">
                        {uploadedImage && !error && (
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-black/50">
                            <img
                              src={uploadedImage}
                              alt="Uploaded medical image"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        {error && (
                          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                            <p className="text-sm text-destructive font-medium">{error}</p>
                          </div>
                        )}
                        <Button onClick={handleNewAnalysis} className="w-full">
                          Analyze Another Image
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card className="mt-4 bg-card/50 border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base">Instructions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {type.instructions.map((instruction, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {instruction}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {isAnalyzing && (
                  <Card className="bg-card/50 border-border">
                    <CardContent className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <type.icon className={cn('w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', type.color)} />
                        </div>
                        <h3 className="mt-6 text-lg font-semibold text-foreground">
                          Analyzing Image...
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                          Our AI model is processing your medical image. This may take a few moments.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {error && !isAnalyzing && (
                  <Card className="bg-destructive/10 border-destructive/30">
                    <CardContent className="py-8">
                      <div className="flex flex-col items-center justify-center text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">
                          Analysis Failed
                        </h3>
                        <p className="mt-2 text-sm text-destructive max-w-xs">
                          {error}
                        </p>
                        <Button onClick={handleNewAnalysis} className="mt-4">
                          Try Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result && !error && (
                  <PredictionResult
                    prediction={result.prediction}
                    confidence={result.confidence}
                    category={result.category}
                    description={result.description}
                    originalImage={uploadedImage || undefined}
                  />
                )}

                {!isAnalyzing && !result && !error && (
                  <Card className="bg-card/50 border-border h-full min-h-[400px]">
                    <CardContent className="flex flex-col items-center justify-center h-full text-center py-16">
                      <div className={cn('p-4 rounded-2xl mb-4', type.bgColor)}>
                        <type.icon className={cn('w-8 h-8', type.color)} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Ready for Analysis
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                        Upload a medical image to start the AI-powered analysis. Results will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default function ImagingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <ImagingContent />
    </Suspense>
  )
}

