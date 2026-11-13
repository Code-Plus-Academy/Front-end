import { Check } from 'lucide-react';

export const REGISTRATION_STEPS = [
  { id: 1, label: 'Account', description: 'Credentials & details' },
  { id: 2, label: 'Verify', description: 'Confirm your email' },
  { id: 3, label: 'Identity', description: 'Name & handle' },
  { id: 4, label: 'Type', description: 'Account usage' },
  { id: 5, label: 'Profile', description: 'Avatar & bio' },
  { id: 6, label: 'Interests', description: 'Feed preferences' },
  { id: 7, label: 'Welcome', description: 'Finalizing setup' },
];

export default function StepProgressBar({ currentStep = 1, onStepClick }) {
  const total = REGISTRATION_STEPS.length;
  const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / (total - 1)) * 100));

  return (
    <nav className="reg-stepper" aria-label={`Registration progress: step ${currentStep} of ${total}`}>
      {/* Visual Connecting Bar & Step Nodes */}
      <div className="reg-stepper-desktop-wrap">
        <div className="reg-stepper-line-bg" aria-hidden="true">
          <div
            className="reg-stepper-line-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="reg-stepper-track">
          {REGISTRATION_STEPS.map((stepItem) => {
            const step = stepItem.id;
            const completed = step < currentStep;
            const active = step === currentStep;
            const isClickable = onStepClick && completed && currentStep !== 7;

            return (
              <div
                key={stepItem.label}
                className={`reg-step ${completed ? 'is-complete' : ''} ${active ? 'is-active' : ''} ${isClickable ? 'is-clickable' : ''}`}
                aria-current={active ? 'step' : undefined}
                onClick={() => isClickable && onStepClick(step)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onStepClick(step);
                  }
                }}
              >
                <div className="reg-step-icon" aria-hidden="true">
                  {completed ? (
                    <Check size={14} strokeWidth={3} className="reg-step-check" />
                  ) : (
                    <span className="reg-step-num">{step}</span>
                  )}
                </div>
                <span className="reg-step-label">{stepItem.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile-Adaptive Sub-Header */}
      <div className="reg-stepper-meta">
        <span className="reg-stepper-current-title">
          {REGISTRATION_STEPS[currentStep - 1]?.label} — {REGISTRATION_STEPS[currentStep - 1]?.description}
        </span>
        <span className="reg-stepper-count">
          STEP {currentStep} / {total}
        </span>
      </div>
    </nav>
  );
}
