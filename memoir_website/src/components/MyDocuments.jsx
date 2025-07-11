import { useState, useEffect, useRef } from 'react'
import { apiService } from '../services/api'
import NotionIntegration from './NotionIntegration'
import { markdownToBlocks } from '@tryfabric/martian'
import { gsap } from 'gsap'

export default function MyDocuments() {
  const [documents, setDocuments] = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState({})
  const [error, setError] = useState('')
  const [expandedDocs, setExpandedDocs] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [notionStatus, setNotionStatus] = useState(null)
  const [exportingToNotion, setExportingToNotion] = useState({})
  const [exportError, setExportError] = useState('')
  const containerRefs = useRef({})

  useEffect(() => {    
    loadDocuments()
    loadNotionStatus()
    
    // Handle OAuth callback messages
    const urlParams = new URLSearchParams(window.location.search)
    const notionConnected = urlParams.get('notion_connected')
    const notionError = urlParams.get('notion_error')
    
    if (notionConnected === 'true') {
      // Complete the Notion integration
      completeNotionIntegration()
    } else if (notionError) {
      setExportError(`Failed to connect to Notion: ${notionError}`)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const completeNotionIntegration = async () => {
    // Check if user is authenticated
    if (!apiService.isAuthenticated()) {
      setExportError('Please log in to complete the Notion integration.')
      return
    }
    
    try {
      const result = await apiService.completeNotionIntegration()
      alert('✅ Successfully connected to Notion! You can now export your documents.')
      // Reload Notion status
      await loadNotionStatus()
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (error) {
      setExportError(`Failed to complete Notion integration: ${error.message}`)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await apiService.getNotes()
      setDocuments(response.results || [])
      console.log('📋 Loaded documents:', response.results?.length || 0)
    } catch (error) {
      console.error('❌ Error loading documents:', error)
      setError('Failed to load documents. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadNotionStatus = async () => {
    try {
      const status = await apiService.getNotionStatus()
      setNotionStatus(status)
    } catch (error) {
      console.error('❌ Error loading Notion status:', error)
    }
  }

  const loadSummary = async (documentId) => {
    if (summaries[documentId]) return // Already loaded

    try {
      setLoadingSummary(prev => ({ ...prev, [documentId]: true }))
      const response = await apiService.getSummary(documentId)
      setSummaries(prev => ({
        ...prev,
        [documentId]: response.summary_text
      }))
      console.log('📝 Loaded summary for document:', documentId)
    } catch (error) {
      console.error('❌ Error loading summary:', error)
      setSummaries(prev => ({
        ...prev,
        [documentId]: 'Failed to load summary. Please try again.'
      }))
    } finally {
      setLoadingSummary(prev => ({ ...prev, [documentId]: false }))
    }
  }

  const toggleExpand = async (documentId) => {
    const isExpanding = !expandedDocs[documentId]
    const container = containerRefs.current[documentId]

    if (isExpanding) {
      setExpandedDocs(prev => ({ ...prev, [documentId]: true }))
      
      if (!summaries[documentId]) {
        await loadSummary(documentId)
      }
      
      gsap.to(container, { height: 'auto', duration: 0.5, ease: 'power2.inOut' })
    } else {
      gsap.to(container, {
        height: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          setExpandedDocs(prev => ({ ...prev, [documentId]: false }))
        },
      })
    }
  }

  const handleExportToNotion = async (documentId) => {
    if (!notionStatus?.is_connected) {
      setExportError('Please connect your Notion account first.')
      return
    }

    try {
      setExportingToNotion(prev => ({ ...prev, [documentId]: true }))
      setExportError('')
      
      // Get the markdown summary for this document
      const markdown = summaries[documentId];
      if (!markdown) {
        setExportError('No markdown summary found for this document. Please generate it first.')
        setExportingToNotion(prev => ({ ...prev, [documentId]: false }))
        return;
      }
      
      // Convert markdown to Notion blocks in the frontend
      let blocks;
      try {
        blocks = markdownToBlocks(markdown);
        console.log('✅ Converted markdown to Notion blocks:', blocks.length, 'blocks');
      } catch (conversionError) {
        console.error('❌ Error converting markdown to blocks:', conversionError);
        setExportError('Failed to convert markdown to Notion format. Please try regenerating the markdown.')
        setExportingToNotion(prev => ({ ...prev, [documentId]: false }))
        return;
      }
      
      // Send blocks to backend
      const result = await apiService.exportToNotionBlocks(documentId, blocks);
      // Show success message
      alert(`✅ Successfully exported "${result.note_name}" to Notion!\n\nPage URL: ${result.page_url}`)
      
    } catch (error) {
      console.error('❌ Error exporting to Notion:', error)
      setExportError(error.message || 'Failed to export to Notion')
    } finally {
      setExportingToNotion(prev => ({ ...prev, [documentId]: false }))
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileName = (filePath) => {
    return filePath.split('/').pop() || 'Unknown file'
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getFileName(doc.file).toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="theme-text-primary">Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen theme-bg-primary py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold theme-text-primary mb-4">
            My Documents
          </h1>
          <p className="text-xl theme-text-secondary">
            View and manage your uploaded documents and their Notion-ready markdown outputs
          </p>
        </div>

        {/* Notion Integration Status */}
        <NotionIntegration />

        {/* Export Error */}
        {exportError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {exportError}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 theme-bg-secondary theme-text-primary border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Documents Count */}
        <div className="mb-6">
          <p className="theme-text-secondary">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium theme-text-primary mb-2">
              {searchTerm ? 'No documents match your search' : 'No documents yet'}
            </h3>
            <p className="theme-text-secondary mb-4">
              {searchTerm ? 'Try searching for a different term' : 'Upload your first document to get started'}
            </p>
            {!searchTerm && (
              <a
                href="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Upload Document
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="theme-bg-secondary rounded-lg shadow-sm border theme-border overflow-hidden"
              >
                {/* Document Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold theme-text-primary mb-2">
                        {doc.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm theme-text-secondary">
                        <span>📄 {getFileName(doc.file)}</span>
                        <span>📅 {formatDate(doc.uploaded_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* View File Button */}
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border theme-border text-sm font-medium rounded-md theme-text-primary theme-bg-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View File
                      </a>
                      
                      {/* Toggle Summary Button */}
                      <button
                        onClick={() => toggleExpand(doc.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        {expandedDocs[doc.id] ? (
                          <>
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Hide Markdown
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            View Markdown
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div
                  ref={el => (containerRefs.current[doc.id] = el)}
                  className="overflow-hidden"
                  style={{ height: 0 }}
                >
                  {expandedDocs[doc.id] && (
                    <div className="border-t theme-border theme-bg-primary p-6">
                      <h4 className="text-lg font-medium theme-text-primary mb-3">
                        Markdown
                      </h4>
                      
                      {loadingSummary[doc.id] ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="theme-text-secondary">Generating markdown...</span>
                        </div>
                      ) : summaries[doc.id] ? (
                        <div className="prose max-w-none">
                          <div className="theme-text-primary whitespace-pre-line theme-bg-secondary p-4 rounded-lg border theme-border">
                            {summaries[doc.id]}
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <button
                              onClick={() => loadSummary(doc.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              🔄 Regenerate Markdown
                            </button>
                            
                            {/* Export to Notion Button */}
                            <button
                              onClick={() => handleExportToNotion(doc.id)}
                              disabled={!notionStatus?.is_connected || exportingToNotion[doc.id]}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md transition-colors ${
                                notionStatus?.is_connected 
                                  ? 'text-white bg-green-600 hover:bg-green-700' 
                                  : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                              }`}
                            >
                              {exportingToNotion[doc.id] ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Exporting...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Export to Notion
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="theme-text-secondary mb-2">Summary not generated yet</p>
                          <button
                            onClick={() => loadSummary(doc.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            Generate Markdown
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 