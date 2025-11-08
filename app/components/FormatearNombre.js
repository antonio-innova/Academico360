"use client";

/**
 * Utilidad para formatear nombres y apellidos correctamente
 */

/**
 * Formatea el nombre completo de un estudiante o profesor
 * @param {Object} persona - Objeto con propiedades nombre y apellido
 * @returns {string} Nombre completo formateado
 */
export function formatearNombreCompleto(persona) {
  if (!persona) return 'Sin nombre';
  
  // Ensure we have both nombre and apellido, even if they're not in the original object
  const nombre = persona.nombre || '';
  const apellido = persona.apellido || '';
  
  // Log the values to help with debugging
  console.log('Formateando nombre completo:', { persona, nombre, apellido });
  
  // Return the formatted full name
  return `${nombre} ${apellido}`.trim();
}

/**
 * Verifica si un objeto tiene la propiedad apellido
 * @param {Object} objeto - Objeto a verificar
 * @returns {boolean} true si tiene la propiedad apellido, false en caso contrario
 */
export function tieneApellido(objeto) {
  return objeto && objeto.hasOwnProperty('apellido') && objeto.apellido;
}

/**
 * Agrega la propiedad apellido a un objeto si no la tiene
 * @param {Object} objeto - Objeto a modificar
 * @param {string} apellidoDefault - Apellido por defecto si no se proporciona
 * @returns {Object} Objeto con la propiedad apellido
 */
export function asegurarApellido(objeto, apellidoDefault = '') {
  if (!objeto) return objeto;
  
  if (!tieneApellido(objeto)) {
    return {
      ...objeto,
      apellido: apellidoDefault
    };
  }
  
  return objeto;
}
