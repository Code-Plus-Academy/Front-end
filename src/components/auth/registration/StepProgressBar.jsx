import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

const STEPS = [
  'Account',
  'Verify',
  'Identity',
  'Type',
  'Profile',
  'Interests',
  'Welcome',
];

export default function StepProgressBar({ currentStep = 1 }) {
  const total = STEPS.length;
  const prevIndex = currentStep - 2; // 0-based index of previous step
  const currIndex = currentStep - 1;
  const nextIndex = currentStep;     // 0-based index of next step

  const visible = [
    prevIndex >= 0 ? { index: prevIndex, role: 'prev' } : null,
    { index: currIndex, role: 'active' },
    nextIndex < total ? { index: nextIndex, role: 'next' } : null,
  ].filter(Boolean);

  return (
    <nav className="reg-stepper" aria-label={`Registration progress: step ${currentStep} of ${total}`}>
      <div className="reg-stepper-track">
        {currentStep > 1 && (
          <span className="reg-stepper-edge reg-stepper-edge-prev" aria-hidden="true">
            <ChevronLeft size={14} />
          </span>
        )}

        {visible.map(({ index, role }) => {
          const step = index + 1;
          const label = STEPS[index];
          const completed = step < currentStep;
          const active = role === 'active';
          return (
            <div
              key={label}
              className={`reg-step reg-step-${role} ${completed ? 'is-complete' : ''} ${active ? 'is-active' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className="reg-step-icon" aria-hidden="true">
                {completed ? <Check size={13} strokeWidth={3} /> : step}
              </span>
              <span className="reg-step-label">{label}</span>
            </div>
          );
        })}

        {currentStep < total && (
          <span className="reg-stepper-edge reg-stepper-edge-next" aria-hidden="true">
            <ChevronRight size={14} />
          </span>
        )}
      </div>

      <span className="reg-stepper-count">
        STEP {currentStep} / {total}
      </span>
    </nav>
  );
}
