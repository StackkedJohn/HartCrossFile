import { useState } from 'react'
import Stepper from './components/Stepper'
import FileUpload from './components/FileUpload'
import ReviewApprove from './components/ReviewApprove'
import Comparison from './components/Comparison'
import Proposal from './components/Proposal'
import { processUpload } from './lib/matchingService'
import './App.css'

function App() {
  const [currentStep, setCurrentStep] = useState('upload')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileData, setFileData] = useState(null)
  const [uploadRecord, setUploadRecord] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState(null)

  const handleFileUpload = (file, data) => {
    setUploadedFile(file)
    setFileData(data)
    setProcessingError(null)
    if (file && data) {
      console.log('File uploaded:', file.name)
      console.log('Parsed data rows:', data.length)
    }
  }

  const handleContinueToReview = async () => {
    if (!uploadedFile || !fileData) return

    setIsProcessing(true)
    setProcessingError(null)

    try {
      // Process upload and run matching
      const upload = await processUpload(uploadedFile, fileData)
      setUploadRecord(upload)
      setCurrentStep('review')
    } catch (error) {
      console.error('Error processing upload:', error)
      setProcessingError(error.message || 'Failed to process upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContinueToComparison = () => {
    setCurrentStep('comparison')
  }

  const handleBackToUpload = () => {
    setCurrentStep('upload')
    setUploadedFile(null)
    setFileData(null)
    setUploadRecord(null)
  }

  return (
    <div className="app">
      <div className="background-pattern"></div>
      <header className="header">
        {/* Decorative corner elements */}
        <div className="header-corner-left"></div>
        <div className="header-corner-right"></div>

        {/* Enhanced logo with icon badge */}
        <div className="logo">
          <div className="logo-icon-wrapper">
            <i className="fa-solid fa-arrow-right-arrow-left"></i>
          </div>
          <span>CrossFile</span>
        </div>

        {/* Enhanced tagline with feature badges */}
        <div className="tagline-wrapper">
          <p className="tagline">Product Matching & Proposal Generation</p>
          <div className="tagline-badges">
            <span className="tagline-badge">
              <i className="fa-solid fa-check"></i>
              Match
            </span>
            <span className="tagline-badge">
              <i className="fa-solid fa-chart-line"></i>
              Analyze
            </span>
            <span className="tagline-badge">
              <i className="fa-solid fa-file-lines"></i>
              Propose
            </span>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <Stepper currentStep={currentStep} />

        {currentStep === 'upload' && (
          <>
            <FileUpload onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />
            
            {fileData && (
              <div className="upload-success">
                <i className="fa-solid fa-circle-check"></i>
                <div className="upload-success-content">
                  <h3>File Ready</h3>
                  <p>{uploadedFile.name} • {fileData.length - 1} data rows detected</p>
      </div>
                <button 
                  className="btn-continue" 
                  onClick={handleContinueToReview}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="btn-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <i className="fa-solid fa-arrow-right"></i>
                    </>
                  )}
        </button>
              </div>
            )}

            {processingError && (
              <div className="processing-error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{processingError}</span>
      </div>
            )}
          </>
        )}

        {currentStep === 'review' && uploadRecord && (
          <ReviewApprove 
            uploadId={uploadRecord.id} 
            onContinue={handleContinueToComparison}
            onBack={handleBackToUpload}
          />
        )}

        {currentStep === 'comparison' && uploadRecord && (
          <Comparison 
            uploadId={uploadRecord.id}
            onContinue={() => setCurrentStep('proposal')}
            onBack={() => setCurrentStep('review')}
          />
        )}

        {currentStep === 'proposal' && uploadRecord && (
          <Proposal 
            uploadId={uploadRecord.id}
            onBack={() => setCurrentStep('comparison')}
          />
        )}
      </main>
      
      <footer className="footer">
        <p>Hart Medical Projects</p>
      </footer>
    </div>
  )
}

export default App
