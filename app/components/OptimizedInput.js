"use client";

import { useState, useRef, useCallback, useMemo } from 'react';
import { throttle } from '../utils/inputOptimization';

/**
 * Componente de input altamente optimizado para mejorar el rendimiento
 * Incluye throttling, debouncing y prevención de autocompletado
 */
export default function OptimizedInput({
  name,
  value,
  onChange,
  placeholder,
  className,
  type = "text",
  required = false,
  disabled = false,
  throttleMs = 50, // Throttle muy agresivo de 50ms
  ...props
}) {
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef(null);
  
  // Crear función throttled memoizada
  const throttledOnChange = useMemo(() => {
    return throttle((event) => {
      if (onChange) {
        onChange(event);
      }
    }, throttleMs);
  }, [onChange, throttleMs]);
  
  // Manejar cambios locales inmediatos para UX fluida
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Actualizar valor local inmediatamente para UX fluida
    setLocalValue(newValue);
    
    // Llamar a onChange con throttling
    throttledOnChange(e);
  }, [throttledOnChange]);
  
  // Sincronizar valor externo con valor local
  if (value !== localValue && value !== undefined) {
    setLocalValue(value);
  }
  
  return (
    <input
      ref={inputRef}
      type={type}
      name={name}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
      // Desactivar completamente el autocompletado del navegador
      autoComplete="new-password" // Truco para forzar desactivación
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      data-form-type="other" // Evitar detección de formularios
      data-lpignore="true" // Ignorar LastPass
      data-1p-ignore="true" // Ignorar 1Password
      {...props}
    />
  );
}

/**
 * Input optimizado específicamente para nombres
 */
export function OptimizedNameInput(props) {
  return (
    <OptimizedInput
      {...props}
      autoComplete="off"
      throttleMs={100} // Throttling moderado para nombres
    />
  );
}

/**
 * Input optimizado para texto libre con throttling agresivo
 */
export function OptimizedTextInput(props) {
  return (
    <OptimizedInput
      {...props}
      throttleMs={30} // Throttling muy agresivo
    />
  );
}

