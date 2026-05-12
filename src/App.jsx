import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const webhookURL = import.meta.env.VITE_N8N_WEBHOOK_URL;

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
      setStatus('idle')
    } else {
      alert('Please select a PDF file')
    }
  }

  const handleSubmit = async () => {
    if (!file) return alert('Please select a PDF first')

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
        setErrorMessage(data.message || 'Something went wrong')
      }
    } catch (err) {
      setStatus('error')
      setErrorMessage('Could not reach the server')
    }
  }

  return (
    <div className="container">
      <h1>Statement Processor</h1>
      <p>Upload your visa statement PDF to process it into Google Sheets.</p>

      <div className="upload-box">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        {file && <p className="file-name">📄 {file.name}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || status === 'uploading'}
      >
        {status === 'uploading' ? 'Uploading...' : 'Send to n8n'}
      </button>

      {status === 'success' && <p className="success">Statement sent successfully!</p>}
      {status === 'error' && <p className="error">{errorMessage}</p>}
    </div>
  )
}

export default App