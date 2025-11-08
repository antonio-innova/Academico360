"use client";

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce
 * @param {any} value - Valor a hacer debounce
 * @param {number} delay - Retraso en milisegundos
 * @returns {any} Valor con debounce aplicado
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para callbacks con debounce
 * @param {function} callback - Función a ejecutar
 * @param {number} delay - Retraso en milisegundos
 * @param {array} deps - Dependencias para useCallback
 * @returns {function} Función con debounce aplicado
 */
export function useDebouncedCallback(callback, delay, deps = []) {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setDebounceTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}

