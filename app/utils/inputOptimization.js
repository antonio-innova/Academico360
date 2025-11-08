"use client";

import { useState, useCallback } from 'react';

/**
 * Utilidades para optimizar el rendimiento de inputs
 */

/**
 * Crea un manejador de input optimizado con debounce
 * @param {function} callback - Función a ejecutar
 * @param {number} delay - Retraso en milisegundos (default: 200ms)
 * @returns {function} Manejador optimizado
 */
export function createOptimizedInputHandler(callback, delay = 200) {
  let timeoutId = null;
  
  return function(e) {
    // Prevenir el comportamiento por defecto si es necesario
    const value = e.target.value;
    const name = e.target.name;
    
    // Limpiar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Crear nuevo timeout
    timeoutId = setTimeout(() => {
      callback(e, { value, name });
    }, delay);
  };
}

/**
 * Optimiza validaciones de formulario para evitar ejecutar en cada tecla
 * @param {function} validator - Función de validación
 * @param {number} delay - Retraso en milisegundos (default: 300ms)
 * @returns {function} Validador optimizado
 */
export function createOptimizedValidator(validator, delay = 300) {
  let timeoutId = null;
  
  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      validator(...args);
    }, delay);
  };
}

/**
 * Previene re-renderizados innecesarios comparando objetos
 * @param {object} prevProps - Props anteriores
 * @param {object} nextProps - Props siguientes  
 * @param {array} excludeKeys - Keys a excluir de la comparación
 * @returns {boolean} true si son iguales (no re-renderizar)
 */
export function arePropsEqual(prevProps, nextProps, excludeKeys = []) {
  const prevKeys = Object.keys(prevProps).filter(key => !excludeKeys.includes(key));
  const nextKeys = Object.keys(nextProps).filter(key => !excludeKeys.includes(key));
  
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  
  for (let key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Throttle para eventos que se disparan muy frecuentemente
 * @param {function} func - Función a throttle
 * @param {number} limit - Límite en milisegundos
 * @returns {function} Función con throttle aplicado
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

/**
 * Optimiza el manejo de estado para formularios grandes
 * @param {object} initialState - Estado inicial
 * @returns {array} [state, optimizedSetState]
 */
export function useOptimizedFormState(initialState) {
  const [state, setState] = useState(initialState);
  
  const optimizedSetState = useCallback((updates) => {
    if (typeof updates === 'function') {
      setState(updates);
    } else {
      setState(prevState => ({
        ...prevState,
        ...updates
      }));
    }
  }, []);
  
  return [state, optimizedSetState];
}
