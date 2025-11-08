"use client";

/**
 * Componente para mostrar nombres de estudiantes de manera consistente
 * Este componente garantiza que siempre se muestre el nombre completo (nombre y apellido)
 */

import React from 'react';

/**
 * Componente que muestra el nombre completo de un estudiante
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.student - Objeto con datos del estudiante
 * @param {boolean} props.showId - Indica si se debe mostrar la identificación
 * @param {string} props.className - Clases CSS adicionales
 * @returns {JSX.Element} Componente de nombre de estudiante
 */
export default function StudentNameDisplay({ student, showId = false, className = '' }) {
  console.log('StudentNameDisplay - Received student data:', student);
  
  if (!student) {
    console.log('StudentNameDisplay - No student data provided');
    return <span className={className}>Sin datos</span>;
  }
  
  // Extraer nombre y apellido con valores por defecto
  const nombre = student.nombre || '';
  const apellido = student.apellido || '';
  const cedula = student.idU || student.cedula || '';
  
  console.log('StudentNameDisplay - Extracted values:', { nombre, apellido, cedula });
  
  // Construir el nombre completo
  const nombreCompleto = `${nombre} ${apellido}`.trim();
  console.log('StudentNameDisplay - Nombre completo:', nombreCompleto);
  
  // Si no hay nombre completo, mostrar un mensaje por defecto
  if (!nombreCompleto) {
    console.log('StudentNameDisplay - Empty nombre completo');
    return <span className={className}>Sin nombre</span>;
  }
  
  // Mostrar el nombre completo, con o sin identificación
  const displayText = showId && cedula ? `${nombreCompleto} (${cedula})` : nombreCompleto;
  console.log('StudentNameDisplay - Final display text:', displayText);
  
  // Forzar la visualización del nombre y apellido directamente
  return (
    <span className={className}>
      {nombre} {apellido}
      {showId && cedula && ` (${cedula})`}
    </span>
  );
}

/**
 * Función para formatear el nombre completo de un estudiante
 * @param {Object} student - Objeto con datos del estudiante
 * @returns {string} Nombre completo formateado
 */
export function formatFullName(student) {
  console.log('formatFullName - Input student:', student);
  
  if (!student) {
    console.log('formatFullName - No student data provided');
    return 'Sin nombre';
  }
  
  const nombre = student.nombre || '';
  const apellido = student.apellido || '';
  
  console.log('formatFullName - Extracted values:', { nombre, apellido });
  
  const fullName = `${nombre} ${apellido}`.trim() || 'Sin nombre';
  console.log('formatFullName - Returning full name:', fullName);
  
  return fullName;
}
