'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  onUpload: (file: File) => void
  isLoading?: boolean
  accept?: string
  maxSize?: number
  className?: string
}

export function ImageUpload({
  onUpload,
  isLoading = false,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setSelectedFile(file)
  }, [maxSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleRemove = useCallback(() => {
    setPreview(null)
    setSelectedFile(null)
    setError(null)
  }, [])

  const handleAnalyze = useCallback(() => {
    if (selectedFile) {
      onUpload(selectedFile)
    }
  }, [selectedFile, onUpload])

  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'relative flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'border-border hover:border-primary/50 hover:bg-card/50'
            )}
          >
            <input
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <motion.div
              animate={{ scale: isDragging ? 1.1 : 1 }}
              className="mb-4 p-4 rounded-full bg-primary/10"
            >
              <Upload className="w-8 h-8 text-primary" />
            </motion.div>
            
            <p className="text-lg font-medium text-foreground mb-2">
              {isDragging ? 'Drop your image here' : 'Upload Medical Image'}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Drag and drop or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Supports JPEG, PNG, DICOM up to {maxSize / 1024 / 1024}MB
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden bg-card border border-border"
          >
            <div className="relative aspect-square max-h-[400px] w-full">
              <Image
                src={preview}
                alt="Medical image preview"
                fill
                className="object-contain bg-black/50"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Remove button */}
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={handleRemove}
                disabled={isLoading}
                className="absolute top-3 right-3"
              >
                <X className="w-4 h-4" />
              </Button>
              
              {/* File info and action */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-white/60">
                      {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="w-full glow-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Image'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 text-sm text-destructive text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
