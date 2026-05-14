import { useState, useRef, useCallback } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const webhookURL = import.meta.env.VITE_N8N_WEBHOOK_URL

  const validateAndSetFile = (selected) => {
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
      setStatus('idle')
      setErrorMessage('')
    } else {
      setStatus('error')
      setErrorMessage('Only PDF files are accepted.')
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    validateAndSetFile(selected)
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    validateAndSetFile(dropped)
  }, [])

  const handleSubmit = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    setStatus('uploading')

    try {
      const response = await fetch(webhookURL, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (response.ok && data.success !== false) {
        setStatus('success')
        setFile(null)
      } else {
        setStatus('error')
        setErrorMessage(data.message || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Could not reach the server.')
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div className="logo-mark" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="currentColor" className="logo-bg" />
              <path d="M8 20L14 8L20 20M10.5 15.5H17.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="title">Statement Processor</h1>
            <p className="subtitle">Upload a Visa PDF — we'll push it straight to Google Sheets.</p>
          </div>
        </div>

        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload PDF file"
          onKeyDown={(e) => e.key === 'Enter' && !file && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden-input"
            aria-hidden="true"
          />

          {file ? (
            <div className="file-preview">
              <div className="file-icon-wrap">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="var(--accent-soft)"/>
                  <path d="M10 8h8l6 6v12a2 2 0 01-2 2H10a2 2 0 01-2-2V10a2 2 0 012-2z" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 8v6h6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 18h6M13 22h4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <button
                className="remove-btn"
                onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
                aria-label="Remove file"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="drop-prompt">
              <div className="upload-icon" aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M18 24V12M12 18l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 27a12 12 0 0124 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".4"/>
                </svg>
              </div>
              <p className="drop-label">
                {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
              </p>
              <p className="drop-hint">or <span className="browse-link">browse files</span></p>
            </div>
          )}
        </div>

        <button
          className={`submit-btn ${status === 'uploading' ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={!file || status === 'uploading'}
        >
          {status === 'uploading' ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
                <path d="M8.5 2v10M4 6.5l4.5-4.5 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 13.5h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
              Send to n8n
            </>
          )}
        </button>

        {status === 'success' && (
          <div className="status-banner success" role="status">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Statement sent successfully!
          </div>
        )}
        {status === 'error' && errorMessage && (
          <div className="status-banner error" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
