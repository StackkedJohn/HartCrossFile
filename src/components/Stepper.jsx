import './Stepper.css'

const steps = [
  { id: 'upload', label: 'Upload', icon: 'fa-cloud-arrow-up' },
  { id: 'review', label: 'Review & Approve', icon: 'fa-magnifying-glass-chart' },
  { id: 'comparison', label: 'Comparison', icon: 'fa-scale-balanced' },
  { id: 'proposal', label: 'Proposal', icon: 'fa-file-contract' },
]

function Stepper({ currentStep }) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="stepper">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex

        return (
          <div 
            key={step.id} 
            className={`step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
          >
            <div className="step-indicator">
              {isCompleted ? (
                <i className="fa-solid fa-check"></i>
              ) : (
                <i className={`fa-solid ${step.icon}`}></i>
              )}
            </div>
            <span className="step-label">{step.label}</span>
            {index < steps.length - 1 && <div className="step-connector" />}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
