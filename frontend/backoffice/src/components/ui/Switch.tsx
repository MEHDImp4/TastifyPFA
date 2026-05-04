interface SwitchProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  'aria-label'?: string;
  label?: string;
}

export function Switch({ checked, onToggle, disabled = false, 'aria-label': ariaLabel, label }: SwitchProps) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className={`text-sm font-medium ${disabled ? 'text-foreground-muted/50' : 'text-foreground-muted'}`}>
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={ariaLabel || label}
        aria-pressed={checked}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          checked ? 'bg-teal-500' : 'bg-surface-elevated'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
