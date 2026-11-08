import { useEffect } from 'preact/hooks';

interface Props {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitLabel?: string;
}

/** Velká číselná klávesnice; na počítači funguje i fyzická klávesnice. */
export function Keypad({ onDigit, onBackspace, onSubmit, disabled, submitLabel = 'Kouzlit!' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) onDigit(e.key);
      else if (e.key === 'Backspace') onBackspace();
      else if (e.key === 'Enter') onSubmit();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDigit, onBackspace, onSubmit, disabled]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <div class="keypad" aria-disabled={disabled}>
      {keys.map((k) => (
        <button type="button" class="key" key={k} disabled={disabled} onClick={() => onDigit(k)}>
          {k}
        </button>
      ))}
      <button type="button" class="key key--muted" disabled={disabled} onClick={onBackspace} aria-label="Smazat">
        ⌫
      </button>
      <button type="button" class="key" disabled={disabled} onClick={() => onDigit('0')}>
        0
      </button>
      <button type="button" class="key key--go" disabled={disabled} onClick={onSubmit}>
        {submitLabel}
      </button>
    </div>
  );
}
