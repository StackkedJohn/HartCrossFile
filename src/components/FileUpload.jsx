import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import './FileUpload.css'

function FileUpload({ onFileUpload, uploadedFile }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const processFile = async (file) => {
    if (!file) return

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    const isValidExtension = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
    
    if (!validTypes.includes(file.type) && !isValidExtension) {
      setError('Please upload a valid Excel file (.xlsx or .xls)')
      return
    }

    setError(null)
    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      // Filter out empty rows
      const filteredData = data.filter(row => row.some(cell => cell !== undefined && cell !== ''))
      
      setTimeout(() => {
        setIsProcessing(false)
        onFileUpload(file, filteredData)
      }, 800) // Small delay for UX
      
    } catch (err) {
      console.error('Error processing file:', err)
      setError('Failed to process file. Please ensure it\'s a valid Excel file.')
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = (e) => {
    e.stopPropagation()
    onFileUpload(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Upload Usage Report</h1>
        <p>Import your McKesson usage report to begin product matching</p>
      </div>

      <div
        className={`dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="file-input"
        />

        {isProcessing ? (
          <div className="processing-state">
            <div className="spinner"></div>
            <p>Processing file...</p>
          </div>
        ) : uploadedFile ? (
          <div className="file-preview">
            <div className="file-icon">
              <i className="fa-solid fa-file-excel"></i>
            </div>
            <div className="file-info">
              <span className="file-name">{uploadedFile.name}</span>
              <span className="file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
            </div>
            <button className="remove-btn" onClick={handleRemoveFile}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div className="upload-text">
              <p className="primary-text">
                <span className="highlight">Click to upload</span> or drag and drop
              </p>
              <p className="secondary-text">Excel files only (.xlsx, .xls)</p>
            </div>
          </div>
        )}

        {isDragging && (
          <div className="drag-overlay">
            <i className="fa-solid fa-file-import"></i>
            <p>Drop file here</p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="upload-tips">
        <h4><i className="fa-solid fa-lightbulb"></i> Tips</h4>
        <ul>
          <li>Export your usage report from McKesson as an Excel file</li>
          <li>Ensure the file contains product SKUs and quantities</li>
          <li>Headers should be in the first row</li>
        </ul>
      </div>
    </div>
  )
}

export default FileUpload
