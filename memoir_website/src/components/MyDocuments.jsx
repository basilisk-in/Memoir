import { useState, useEffect } from 'react'
import { apiService } from '../services/api'

export default function MyDocuments() {
  const [documents, setDocuments] = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState({})
  const [error, setError] = useState('')
  const [expandedDocs, setExpandedDocs] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

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
    
    setExpandedDocs(prev => ({
      ...prev,
      [documentId]: isExpanding
    }))

    // Load summary when expanding if not already loaded
    if (isExpanding && !summaries[documentId]) {
      await loadSummary(documentId)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
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
                className="theme-bg-secondary rounded-lg shadow-sm border border-gray-200 overflow-hidden"
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
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md theme-text-primary theme-bg-primary hover:bg-gray-50 transition-colors"
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
                            Hide Summary
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
                {expandedDocs[doc.id] && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
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
                        <div className="theme-text-primary whitespace-pre-line bg-white p-4 rounded-lg border">
                          {summaries[doc.id]}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => loadSummary(doc.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            🔄 Regenerate Markdown
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 