"use client";

/**
 * Utilidad para acceder de forma segura a elementos del formulario
 * Evita errores de "Cannot read properties of null (reading 'value')"
 */

/**
 * Obtiene el valor de un elemento del formulario de forma segura
 * @param {string} selector - Selector CSS del elemento
 * @param {string} defaultValue - Valor por defecto si el elemento no existe
 * @returns {string} Valor del elemento o valor por defecto
 */
export function getFormValue(selector, defaultValue = '') {
  try {
    const element = document.querySelector(selector);
    return element ? element.value : defaultValue;
  } catch (error) {
    console.error(`Error al obtener valor de ${selector}:`, error);
    return defaultValue;
  }
}

/**
 * Verifica si un formulario está disponible en el DOM
 * @param {Array} selectors - Array de selectores CSS que deben existir
 * @returns {boolean} true si todos los elementos existen, false en caso contrario
 */
export function isFormAvailable(selectors) {
  try {
    return selectors.every(selector => document.querySelector(selector) !== null);
  } catch (error) {
    console.error('Error al verificar disponibilidad del formulario:', error);
    return false;
  }
}

/**
 * Obtiene múltiples valores de un formulario de forma segura
 * @param {Object} selectorMap - Objeto con pares de {nombre: {selector, defaultValue}}
 * @returns {Object} Objeto con los valores obtenidos
 */
export function getFormValues(selectorMap) {
  const result = {};
  
  for (const [key, config] of Object.entries(selectorMap)) {
    result[key] = getFormValue(config.selector, config.defaultValue);
  }
  
  return result;
}
