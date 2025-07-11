import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  ArrowDownTrayIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline'
import apiService from '../services/api'
import { markdownToBlocks } from '@tryfabric/martian'

function Upload() {
  const [file, setFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [uploadedNote, setUploadedNote] = useState(null)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileSelected, setFileSelected] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [processingInfo, setProcessingInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  
  const dropZoneRef = useRef(null)
  const summaryRef = useRef(null)
  const uploadButtonRef = useRef(null)
  const processingRef = useRef(null)
  const progressBarRef = useRef(null)
  const fileIconRef = useRef(null)
  const successIconRef = useRef(null)
  const processButtonRef = useRef(null)
  const processingBarRef = useRef(null)
  const buttonContainerRef = useRef(null)
  const aiIconRef = useRef(null)

  useEffect(() => {
    // Hydration guard - ensures theme is properly loaded
    setIsHydrated(true)
    
    // Force theme variables to be applied
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    
    // Check if theme variables are loaded, if not, apply fallbacks
    if (!computedStyle.getPropertyValue('--bg-primary').trim()) {
      root.style.setProperty('--bg-primary', '#fdf6e3')
      root.style.setProperty('--bg-secondary', '#f9f5d7')
      root.style.setProperty('--bg-tertiary', '#f2e5bc')
      root.style.setProperty('--text-primary', '#282828')
      root.style.setProperty('--text-secondary', '#3c3836')
      root.style.setProperty('--text-muted', '#504945')
      root.style.setProperty('--border-color', '#d5c4a1')
      root.style.setProperty('--accent-color', '#b57614')
      root.style.setProperty('--shadow', 'rgba(40, 40, 40, 0.12)')
    }
  }, [])

  useEffect(() => {
    if (!isHydrated || !dropZoneRef.current) return

    // Use GSAP context for proper cleanup
    const ctx = gsap.context(() => {
      // Initial animations - only after hydration
      gsap.from(dropZoneRef.current, {
        duration: 0.8,
        y: 50,
        opacity: 0,
        ease: "power3.out"
      })
    })

    // Cleanup function
    return () => ctx.revert()
  }, [isHydrated])

  // Animate button appearance when file is uploaded
  useEffect(() => {
    if (!file || isUploading || !buttonContainerRef.current) return

    // Add a small delay to ensure DOM is fully rendered after state change
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        animateButtonAppearance()
      })

      return () => ctx.revert()
    }, 50) // Small delay to ensure DOM is updated after state change

    // Cleanup timeout if component unmounts or dependencies change
    return () => {
      clearTimeout(timeoutId)
    }
  }, [file, isUploading])

  // Component cleanup - kill GSAP animations for this component on unmount
  useEffect(() => {
    return () => {
      // Kill GSAP animations for specific component elements
      const elementsToCleanup = [
        dropZoneRef.current,
        summaryRef.current,
        uploadButtonRef.current,
        processingRef.current,
        progressBarRef.current,
        fileIconRef.current,
        successIconRef.current,
        processButtonRef.current,
        processingBarRef.current,
        buttonContainerRef.current,
        aiIconRef.current
      ].filter(Boolean) // Remove null/undefined refs

      elementsToCleanup.forEach(element => {
        if (element) {
          gsap.killTweensOf(element)
        }
      })

      // Also kill any tweens on child elements
      elementsToCleanup.forEach(element => {
        if (element) {
          const children = element.querySelectorAll('*')
          gsap.killTweensOf(Array.from(children))
        }
      })

      console.log('Upload component cleanup: GSAP animations killed for component elements')
    }
  }, [])

  // Don't render until hydrated to prevent FOUC
  if (!isHydrated) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ 
        backgroundColor: '#fdf6e3', 
        color: '#282828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#b57614' }}></div>
      </div>
    )
  }

  const animateButtonAppearance = () => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Comprehensive null checks for all required refs
      if (!buttonContainerRef.current || !processButtonRef.current) {
        console.warn('Required button refs not available, skipping button appearance animation')
        return
      }

      // Use GSAP context for proper cleanup
      const ctx = gsap.context(() => {
        const tl = gsap.timeline()

        // Initial setup
        gsap.set(buttonContainerRef.current, { 
          opacity: 0, 
          y: 50, 
          scale: 0.8 
        })

        // Animate container appearance with bounce
        tl.to(buttonContainerRef.current, {
          duration: 0.6,
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "back.out(1.7)"
        })

        // Animate button with pulsing effect
        tl.to(processButtonRef.current, {
          duration: 0.4,
          scale: 1.05,
          ease: "power2.out"
        })
        .to(processButtonRef.current, {
          duration: 0.4,
          scale: 1,
          ease: "power2.out"
        })

        // Animate AI icon only if it exists
        if (aiIconRef.current) {
          tl.fromTo(aiIconRef.current, 
            { rotation: -45, scale: 0 },
            { 
              rotation: 0, 
              scale: 1, 
              duration: 0.5, 
              ease: "back.out(2)" 
            },
            "-=0.6"
          )
        }
      })

      // Return cleanup function
      return () => ctx.revert()
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
    
    // Animate drag over state only if element exists
    if (dropZoneRef.current) {
      gsap.to(dropZoneRef.current, {
        duration: 0.3,
        scale: 1.02,
        boxShadow: '0 12px 30px var(--shadow)',
        ease: "power2.out"
      })
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    // Animate drag leave state only if element exists
    if (dropZoneRef.current) {
      gsap.to(dropZoneRef.current, {
        duration: 0.3,
        scale: 1,
        boxShadow: '0 4px 12px var(--shadow)',
        ease: "power2.out"
      })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setFileSelected(true)
      setFileName(droppedFile.name.replace(/\.[^/.]+$/, "")) // Set default name without extension
      setError('')
      // Don't upload yet - wait for user to confirm name
    }
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileSelected(true)
      setFileName(selectedFile.name.replace(/\.[^/.]+$/, "")) // Set default name without extension
      setError('')
      // Don't upload yet - wait for user to confirm name
    }
  }

  const handleUploadClick = async () => {
    if (!file) {
      setError('No file selected.')
      return
    }

    if (!fileName.trim()) {
      setError('Please enter a name for your note.')
      return
    }

    await animateFileUpload(file)
  }

  const animateFileUpload = async (uploadedFile) => {
    setIsUploading(true)
    setError('')
    
    try {
      // Use the fileName from state (already validated in handleUploadClick)
      const name = fileName.trim()
      
      // Upload file to backend
      const uploadResult = await apiService.uploadFiles([uploadedFile], [name])
      console.log('✅ Upload successful:', uploadResult)
      
      // Store the uploaded note (first one in the array)
      if (uploadResult && uploadResult.length > 0) {
        setUploadedNote(uploadResult[0])
      }

      // Use multiple requestAnimationFrame calls to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Comprehensive null checks for all required refs
            if (!progressBarRef.current) {
              console.warn('progressBarRef.current is null, skipping upload animation')
              setIsUploading(false)
              return
            }

            // Use GSAP context for proper cleanup
            const ctx = gsap.context(() => {
              // Reset and show progress elements
              gsap.set(progressBarRef.current, { width: '0%', opacity: 1 })

              // Create upload timeline
              const tl = gsap.timeline({
                onComplete: () => {
                  setIsUploading(false)
                  // Animate success state only if element exists
                  if (successIconRef.current) {
                    gsap.fromTo(successIconRef.current, 
                      { scale: 0, opacity: 0, rotation: -180 },
                      { 
                        scale: 1, 
                        opacity: 1, 
                        rotation: 0,
                        duration: 0.6, 
                        ease: "back.out(2)",
                        delay: 0.2
                      }
                    )
                  }
                }
              })

              // Animate file icon only if it exists
              if (fileIconRef.current) {
                tl.to(fileIconRef.current, {
                  duration: 0.4,
                  scale: 1.1,
                  y: -10,
                  ease: "power2.out"
                })
              }

              // Animate progress bar (already checked for null above)
              tl.to(progressBarRef.current, {
                duration: 1.5,
                width: '100%',
                ease: "power2.inOut",
                onUpdate: function() {
                  const progress = Math.round(this.progress() * 100)
                  setUploadProgress(progress)
                }
              }, fileIconRef.current ? "-=0.2" : 0)

              // Scale down file icon only if it exists
              if (fileIconRef.current) {
                tl.to(fileIconRef.current, {
                  duration: 0.3,
                  scale: 1,
                  y: 0,
                  ease: "power2.out"
                }, "-=0.5")
              }

              // Animate drop zone back to normal only if it exists
              if (dropZoneRef.current) {
                tl.to(dropZoneRef.current, {
                  duration: 0.4,
                  scale: 1,
                  boxShadow: '0 8px 25px var(--shadow)',
                  ease: "power2.out"
                }, "-=1")
              }
            })

            // Return cleanup function
            return () => ctx.revert()
          }, 100)
        })
      })
    } catch (error) {
      console.error('❌ Upload failed:', error)
      setError(`Upload failed: ${error.message}`)
      setIsUploading(false)
    }
  }

  const processFile = async () => {
    if (!file || !uploadedNote) {
      setError('No file uploaded. Please upload a file first.')
      return
    }

    setError('')
    setIsProcessing(true)
    setShowSummary(false)

    try {
      if (!processButtonRef.current) {
        // Fallback: go directly to processing without animation
        const startTime = Date.now()
        const ocrResult = await apiService.getOCRResult(uploadedNote.id)
        const summaryResult = await apiService.getSummary(uploadedNote.id)
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
        setAiSummary(summaryResult.summary_text)
        setOcrText(ocrResult.extracted_text)
        setProcessingInfo({
          fileSize: (file.size / 1024).toFixed(2),
          processingTime,
          ocrProcessed: ocrResult.processed_at,
          summaryGenerated: summaryResult.generated_at,
          docType: 'PDF',
        })
        setIsProcessing(false)
        setShowSummary(true)
        setActiveTab('summary')
        setTimeout(() => {
          animateSummaryReveal()
        }, 50)
        return
      }

      // Run button animation first, BEFORE changing state
      const ctx = gsap.context(() => {
        // Enhanced button click animation
        const clickTl = gsap.timeline({
          onComplete: async () => {
            // Add a small delay to ensure DOM updates, then animate processing element in
            setTimeout(() => {
              if (processingRef.current) {
                // Animate processing element entrance
                gsap.to(processingRef.current, {
                  duration: 0.6,
                  opacity: 1,
                  y: 0,
                  ease: "back.out(1.5)"
                })

                // Animate processing bar after element is visible
                if (processingBarRef.current) {
                  gsap.fromTo(processingBarRef.current,
                    { width: '0%' },
                    {
                      width: '100%',
                      duration: 3.5,
                      ease: "power2.inOut",
                      onUpdate: function() {
                        const progress = Math.round(this.progress() * 99)
                        setProcessingProgress(progress)
                      }
                    }
                  )
                }
              }
            }, 100)
            
            // Start real API processing
            const startTime = Date.now()
            
            try {
              const ocrResult = await apiService.getOCRResult(uploadedNote.id)
              const summaryResult = await apiService.getSummary(uploadedNote.id)
              const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
              setAiSummary(summaryResult.summary_text)
              setOcrText(ocrResult.extracted_text)
              setProcessingInfo({
                fileSize: (file.size / 1024).toFixed(2),
                processingTime,
                ocrProcessed: ocrResult.processed_at,
                summaryGenerated: summaryResult.generated_at,
                docType: 'PDF',
              })
              setIsProcessing(false)
              setShowSummary(true)
              setActiveTab('summary')
              setTimeout(() => {
                if (processingRef.current) {
                  gsap.to(processingRef.current, {
                    duration: 0.5,
                    opacity: 0,
                    y: -20,
                    scale: 0.95,
                    ease: "power2.in",
                    onComplete: () => {
                      setTimeout(() => {
                        animateSummaryReveal()
                      }, 50)
                    }
                  })
                } else {
                  setTimeout(() => {
                    animateSummaryReveal()
                  }, 50)
                }
              }, 100)
            } catch (error) {
              console.error('❌ Processing failed:', error)
              setError(`Processing failed: ${error.message}`)
              setIsProcessing(false)
            }
          }
        })

        // Button press effect
        clickTl.to(processButtonRef.current, {
          duration: 0.1,
          scale: 0.95,
          ease: "power2.out"
        })

        // Button morphing sequence
        clickTl.to(processButtonRef.current, {
          duration: 0.4,
          scaleX: 1.2,
          scaleY: 0.7,
          ease: "power2.inOut"
        })
        .to(processButtonRef.current, {
          duration: 0.6,
          width: '240px',
          borderRadius: '30px',
          backgroundColor: 'var(--bg-secondary)',
          ease: "power3.out"
        })
        .to(processButtonRef.current, {
          duration: 0.4,
          scaleX: 1,
          scaleY: 1,
          ease: "elastic.out(1, 0.3)"
        })

        // Hide original button content and show processing
        const buttonSpan = processButtonRef.current.querySelector('span')
        if (buttonSpan) {
          clickTl.to(buttonSpan, {
            duration: 0.3,
            opacity: 0,
            y: -20,
            ease: "power2.in"
          }, "-=0.8")
        }
      })

      // Return cleanup function
      return () => ctx.revert()
    } catch (error) {
      console.error('❌ Processing failed:', error)
      setError(`Processing failed: ${error.message}`)
      setIsProcessing(false)
    }
  }

  const animateSummaryReveal = () => {
    // Use requestAnimationFrame to properly wait for DOM elements to be available
    const waitForElements = () => {
      if (!summaryRef.current) {
        console.warn('summaryRef.current not ready, waiting for next frame...')
        requestAnimationFrame(waitForElements)
        return
      }

      // Elements are ready, proceed with simple fade-in animation
      console.log('Elements ready, starting simple summary fade-in')
      
      // Use GSAP context for proper cleanup
      const ctx = gsap.context(() => {
        // Simple fade-in animation - no complex effects
        gsap.fromTo(summaryRef.current, 
          {
            opacity: 0,
            visibility: 'visible' // Override CSS hiding
          },
          {
            opacity: 1,
            duration: 0.6,
            ease: "power2.out"
          }
        )
      })

      // Return cleanup function
      return () => ctx.revert()
    }

    // Start waiting for elements
    waitForElements()
  }

  const downloadSummary = () => {
    // Enhanced download animation
    const button = event.target.closest('button')
    if (!button) {
      console.warn('Download button not found, proceeding with download without animation')
      // Fallback to direct download
      const element = document.createElement('a')
      const file = new Blob([aiSummary], { type: 'text/markdown' })
      element.href = URL.createObjectURL(file)
      element.download = 'ai-summary.md'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      return
    }

    // Use GSAP context for proper cleanup
    const ctx = gsap.context(() => {
      gsap.timeline()
        .to(button, {
          duration: 0.2,
          y: -8,
          scale: 1.05,
          ease: "power2.out"
        })
        .to(button, {
          duration: 0.6,
          y: 0,
          scale: 1,
          ease: "bounce.out"
        })
        .to(button, {
          duration: 0.3,
          backgroundColor: 'var(--accent-color)',
          color: 'var(--bg-primary)',
          ease: "power2.out"
        }, "-=0.4")
        .to(button, {
          duration: 0.5,
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          ease: "power2.out"
        })
    })

    const element = document.createElement('a')
    const file = new Blob([aiSummary], { type: 'text/markdown' })
    element.href = URL.createObjectURL(file)
    element.download = 'ai-summary.md'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    // Return cleanup function
    return () => ctx.revert()
  }

  const resetUpload = () => {
    // Scroll to upload component immediately so user can see the animations
    if (dropZoneRef.current) {
      dropZoneRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      })
    }

    // Enhanced reset animation with comprehensive null checks
    if (!summaryRef.current && !dropZoneRef.current) {
      console.warn('Required refs not available for reset animation, proceeding with state reset')
      // Fallback: just reset state without animation
      setFile(null)
      setShowSummary(false)
      setAiSummary('')
      setIsProcessing(false)
      setUploadProgress(0)
      setProcessingProgress(0)
      setUploadedNote(null)
      setError('')
      setFileName('')
      setFileSelected(false)
      return
    }

    // Use GSAP context for proper cleanup
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setFile(null)
          setShowSummary(false)
          setAiSummary('')
          setIsProcessing(false)
          setUploadProgress(0)
          setProcessingProgress(0)
          setUploadedNote(null)
          setError('')
          setFileName('')
          setFileSelected(false)
        }
      })

      // Fade out summary with 3D rotation only if it exists
      if (summaryRef.current) {
        tl.to(summaryRef.current, {
          duration: 0.6,
          opacity: 0,
          scale: 0.8,
          rotationY: 90,
          ease: "power2.in"
        })
      }

      // Reset drop zone with bounce only if it exists
      if (dropZoneRef.current) {
        tl.to(dropZoneRef.current, {
          duration: 0.8,
          scale: 0.9,
          ease: "power2.out"
        }, summaryRef.current ? undefined : 0) // Start immediately if no summary to animate
        .to(dropZoneRef.current, {
          duration: 0.6,
          scale: 1,
          ease: "elastic.out(1, 0.5)"
        })
      }
    })

    // Return cleanup function
    return () => ctx.revert()
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ 
      backgroundColor: 'var(--bg-primary)', 
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Document Processor
          </h1>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Upload your documents and get Notion-ready markdown files instantly
          </p>
        </div>

        {/* Upload Section */}
        <div 
          ref={dropZoneRef}
          className={`relative border-4 border-dashed rounded-xl p-12 mb-8 transition-all duration-300 upload-zone ${
            isDragOver ? 'drag-over' : ''
          }`}
          style={{
            backgroundColor: isDragOver ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            boxShadow: isDragOver ? '0 8px 25px var(--shadow)' : '0 4px 12px var(--shadow)',
            borderStyle: 'dashed',
            borderWidth: '4px'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div ref={fileIconRef}>
            <CloudArrowUpIcon 
              className="mx-auto h-20 w-20 mb-6" 
              style={{ color: 'var(--text-secondary)' }}
            />
            </div>
            <div className="flex justify-center text-xl font-medium mb-6" style={{ color: 'var(--text-primary)' }}>
              <label 
                htmlFor="file-upload" 
                className="relative cursor-pointer rounded-md font-bold hover:opacity-80 underline decoration-2"
                style={{ color: 'var(--accent-color)' }}
              >
                <span>Upload a file</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.md, .jpg, .jpeg, .png, .gif, .bmp, .tiff, .webp"
                  style={{ display: 'none !important' }}
                />
              </label>
              <p className="pl-2" style={{ color: 'var(--text-secondary)' }}>or drag and drop</p>
            </div>
            <p className="text-base font-medium" style={{ color: 'var(--text-muted)' }}>
              PDF, DOC, DOCX, TXT, MD, JPG, JPEG, PNG, WEBP up to 10MB
            </p>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div 
                    ref={progressBarRef}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: 'var(--accent-color)',
                      width: '0%'
                    }}
                  ></div>
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          {/* File Selected - Show Name Input and Upload Button */}
          {fileSelected && !uploadedNote && !isUploading && (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-3" style={{ color: 'var(--accent-color)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      File selected
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                </div>
              </div>

              {/* File Name Input */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <label htmlFor="file-name" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Note Name <span style={{ color: 'var(--accent-color)' }}>*</span>
                </label>
                <input
                  type="text"
                  id="file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter a name for your note"
                  className="w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    focusRingColor: 'var(--accent-color)'
                  }}
                  required
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  This name will be used to identify your note
                </p>
              </div>

              {/* Upload Button */}
              <div className="text-center">
                <button
                  onClick={handleUploadClick}
                  disabled={!fileName.trim()}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ 
                    backgroundColor: fileName.trim() ? 'var(--accent-color)' : 'var(--bg-tertiary)', 
                    color: fileName.trim() ? 'var(--bg-primary)' : 'var(--text-muted)'
                  }}
                >
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Upload Note
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 rounded-lg border" style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgb(239, 68, 68)',
                  color: 'rgb(239, 68, 68)'
                }}>
                  <p className="text-sm font-medium">
                    {error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* File Uploaded Successfully */}
          {uploadedNote && !isUploading && (
            <div className="mt-6">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex items-center">
                  <div ref={successIconRef} style={{ opacity: 0 }}>
                    <CheckCircleIcon className="h-6 w-6 mr-3" style={{ color: 'var(--accent-color)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      File uploaded successfully
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {uploadedNote.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Process Button */}
        {uploadedNote && !isProcessing && !showSummary && (
          <div ref={buttonContainerRef} className="text-center mb-8 relative" style={{ opacity: 0 }}>
            <button
              ref={processButtonRef}
              onClick={processFile}
              className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md hover:opacity-90 transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--accent-color)', 
                color: 'var(--bg-primary)' 
              }}
            >
              <span className="inline-flex items-center">
                <div ref={aiIconRef}>
              <SparklesIcon className="h-6 w-6 mr-2" />
                </div>
              Process with AI
              </span>
            </button>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div 
            ref={processingRef}
            className="text-center mb-8 opacity-0 translate-y-4"
          >
            <div className="inline-flex flex-col items-center px-8 py-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center mb-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-transparent mr-3" style={{ borderBottomColor: 'var(--accent-color)' }}></div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                AI is processing your document...
              </span>
              </div>
              
              {/* Processing Progress Bar */}
              <div className="w-48 bg-gray-200 rounded-full h-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div 
                  ref={processingBarRef}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: 'var(--accent-color)',
                    width: '0%'
                  }}
                ></div>
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                {processingProgress}% complete
              </p>
            </div>
          </div>
        )}

        {/* AI Summary with Tabs */}
        {showSummary && aiSummary && (
          <div 
            ref={summaryRef} 
            className="space-y-6 relative"
            style={{
              opacity: 0,
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              WebkitTransform: 'translateZ(0)',
              visibility: 'hidden'
            }}
          >
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)', boxShadow: '0 8px 25px var(--shadow)' }}>
              {/* Tab Bar */}
              <div className="flex justify-between items-center mb-4 border-b border-[color:var(--border-color)]">
                <div>
                  <button
                    className={`px-4 py-2 font-medium focus:outline-none transition-colors duration-200 ${activeTab === 'summary' ? 'border-b-2 border-[color:var(--accent-color)] text-[color:var(--accent-color)]' : 'text-[color:var(--text-secondary)]'}`}
                    style={{ background: 'none' }}
                    onClick={() => setActiveTab('summary')}
                  >
                    Summary
                  </button>
                  <button
                    className={`px-4 py-2 font-medium focus:outline-none transition-colors duration-200 ${activeTab === 'ocr' ? 'border-b-2 border-[color:var(--accent-color)] text-[color:var(--accent-color)]' : 'text-[color:var(--text-secondary)]'}`}
                    style={{ background: 'none' }}
                    onClick={() => setActiveTab('ocr')}
                  >
                    OCR
                  </button>
                  <button
                    className={`px-4 py-2 font-medium focus:outline-none transition-colors duration-200 ${activeTab === 'info' ? 'border-b-2 border-[color:var(--accent-color)] text-[color:var(--accent-color)]' : 'text-[color:var(--text-secondary)]'}`}
                    style={{ background: 'none' }}
                    onClick={() => setActiveTab('info')}
                  >
                    Info
                  </button>
                </div>
              </div>
              {/* Tab Content */}
              <div className="prose dark:prose-invert max-w-none">
                {activeTab === 'summary' && (
                  <pre className="whitespace-pre-wrap text-sm font-mono p-4 rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    {aiSummary}
                  </pre>
                )}
                {activeTab === 'ocr' && (
                  <pre className="whitespace-pre-wrap text-xs font-mono p-4 rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    {ocrText}
                  </pre>
                )}
                {activeTab === 'info' && processingInfo && (
                  <div className="text-sm p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    <div><b>Document Type:</b> {processingInfo.docType}</div>
                    <div><b>File Size:</b> {processingInfo.fileSize} KB</div>
                    <div><b>Processing Time:</b> {processingInfo.processingTime} seconds</div>
                    <div><b>OCR Processed:</b> {processingInfo.ocrProcessed ? new Date(processingInfo.ocrProcessed).toLocaleString() : ''}</div>
                    <div><b>Summary Generated:</b> {processingInfo.summaryGenerated ? new Date(processingInfo.summaryGenerated).toLocaleString() : ''}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reset */}
        {showSummary && (
          <div className="text-center mt-8">
            <button
              onClick={resetUpload}
              className="inline-flex items-center px-6 py-3 rounded-md text-base font-medium transition-all duration-200 hover:opacity-80"
              style={{ 
                borderWidth: '1px', 
                borderStyle: 'solid',
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              Process Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Upload 