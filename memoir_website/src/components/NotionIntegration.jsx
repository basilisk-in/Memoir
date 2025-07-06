import { useState, useEffect } from 'react'
import { apiService } from '../services/api'

export default function NotionIntegration() {
  const [notionStatus, setNotionStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotionStatus()
  }, [])

  const loadNotionStatus = async () => {
    try {
      setLoading(true)
      const status = await apiService.getNotionStatus()
      setNotionStatus(status)
      setError('')
    } catch (err) {
      console.error('❌ Error loading Notion status:', err)
      setError('Failed to load Notion status')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectNotion = () => {
    apiService.connectNotion()
  }

  const handleDisconnectNotion = async () => {
    try {
      await apiService.disconnectNotion()
      setNotionStatus({ is_connected: false })
      setError('')
    } catch (err) {
      console.error('❌ Error disconnecting Notion:', err)
      setError('Failed to disconnect Notion')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="theme-text-secondary text-sm">Checking Notion status...</span>
      </div>
    )
  }

  return (
    <div className="theme-bg-secondary rounded-lg border theme-border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium theme-text-primary">Notion Integration</span>
          </div>
          
          {notionStatus?.is_connected ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              Not Connected
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {notionStatus?.is_connected ? (
            <>
              <span className="text-sm theme-text-secondary">
                {notionStatus.workspace_name || 'Connected to Notion'}
              </span>
              <button
                onClick={handleDisconnectNotion}
                className="inline-flex items-center px-3 py-1.5 border theme-border text-sm font-medium rounded-md theme-text-primary theme-bg-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectNotion}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect Notion
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
} 