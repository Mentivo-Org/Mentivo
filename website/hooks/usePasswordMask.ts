import { useState, useEffect, useRef, useCallback } from 'react';

export function usePasswordMask(rawValue: string, onChange: (val: string) => void) {
  const [displayValue, setDisplayValue] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevRawValue = useRef(rawValue);

  useEffect(() => {
    if (!rawValue) {
      setDisplayValue("");
      prevRawValue.current = rawValue;
      return;
    }
    
    const isDeletion = rawValue.length < prevRawValue.current.length;
    prevRawValue.current = rawValue;

    if (isDeletion) {
      setDisplayValue('∗'.repeat(rawValue.length));
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      // Mask all but the last character
      const masked = '∗'.repeat(Math.max(0, rawValue.length - 1)) + rawValue.slice(-1);
      setDisplayValue(masked);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setDisplayValue('∗'.repeat(rawValue.length));
      }, 2000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rawValue]);

  const handleChange = useCallback((text: string) => {
    let newRaw = rawValue;
    if (text.length > displayValue.length) {
      // Characters added
      newRaw = rawValue + text.slice(displayValue.length);
    } else if (text.length < displayValue.length) {
      // Characters removed
      newRaw = rawValue.slice(0, text.length);
    } else {
      // Replaced exactly (fallback assuming last char replaced)
      if (text !== displayValue) {
        newRaw = rawValue.slice(0, -1) + text.slice(-1);
      }
    }
    onChange(newRaw);
  }, [rawValue, displayValue, onChange]);

  return { displayValue, handleChange };
}
