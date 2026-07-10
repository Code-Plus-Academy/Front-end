import { Check } from 'lucide-react';

const STEPS = [
  'Account',
  'Identity',
  'Type',
  'Profile',
  'Interests',
  'Review',
  'Welcome',
];

export default function StepProgressBar({ currentStep = 1 }) {
  return (
    <nav className="reg-stepper" aria-label="Registration progress">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const completed = step < currentStep;
        const active = step === currentStep;
        return (
          <div
            key={label}
            className={`reg-step ${completed ? 'is-complete' : ''} ${active ? 'is-active' : ''}`}
            aria-current={active ? 'step' : undefined}
          >
            <span className="reg-step-icon" aria-hidden="true">
              {completed ? <Check size={13} strokeWidth={3} /> : step}
            </span>
            <span className="reg-step-label">{label}</span>
          </div>
        );
      })}
    </nav>
  );
}
