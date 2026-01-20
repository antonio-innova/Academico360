"use client";

/**
 * Utilidad para gestionar los permisos de acceso en el sidebar
 * Este archivo permite controlar qué elementos del menú se muestran según el tipo de usuario
 * También permite ocultar elementos mediante CSS para usuarios docentes
 */

/**
 * Obtiene los permisos del usuario desde las cookies o localStorage
 * @returns {Object} Objeto con los permisos del usuario
 */
export function obtenerPermisos() {
  // Permisos por defecto (para SSR)
  const permisosDefault = {
    gestionAlumnos: false,
    gestionDocentes: false,
    gestionMaterias: false,
    asignaciones: true,
    calificaciones: true,
    reportes: false,
    // Permisos específicos para gestión de aulas
    agregarEstudiantes: false,
    gestionarProfesores: false,
    eliminarEstudiantes: false,
    avanzarGrado: false,
    eliminarAula: false,
    agregarAula: false
  };
  
  // En el servidor, devolver permisos por defecto
  if (typeof window === 'undefined') {
    return permisosDefault;
  }
  
  try {
    // Intentar obtener permisos desde las cookies
    const permisosCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('permisos='));
    
    if (permisosCookie) {
      try {
        return JSON.parse(decodeURIComponent(permisosCookie.split('=')[1]));
      } catch (error) {
        console.error('Error al parsear permisos de cookie:', error);
      }
    }
    
    // Si no hay permisos en las cookies, determinar según el tipo de usuario
    const userType = obtenerTipoUsuario();
    
    // Permisos por defecto según el tipo de usuario
    return {
      gestionAlumnos: userType === 'control',
      gestionDocentes: userType === 'control',
      gestionMaterias: userType === 'control',
      asignaciones: true, // Todos pueden ver asignaciones
      calificaciones: true, // Todos pueden ver calificaciones
      reportes: userType === 'control', // Solo control puede ver reportes
      // Permisos específicos para gestión de aulas - solo control puede realizar estas acciones
      agregarEstudiantes: userType === 'control',
      gestionarProfesores: userType === 'control',
      eliminarEstudiantes: userType === 'control',
      avanzarGrado: userType === 'control',
      eliminarAula: userType === 'control',
      agregarAula: userType === 'control'
    };
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return permisosDefault;
  }
}

/**
 * Obtiene el tipo de usuario desde las cookies o localStorage
 * @returns {string} Tipo de usuario ('control', 'docente', 'alumno')
 */
export function obtenerTipoUsuario() {
  // En el servidor, devolver un valor por defecto
  if (typeof window === 'undefined') {
    return 'alumno';
  }
  
  try {
    // Intentar obtener desde las cookies
    const userTypeCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userType='));
    
    if (userTypeCookie) {
      return userTypeCookie.split('=')[1];
    }
    
    // Intentar obtener desde localStorage
    try {
      const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
      return userType || 'alumno'; // Por defecto, asumimos que es alumno si no hay información
    } catch (error) {
      console.error('Error al acceder a localStorage:', error);
      return 'alumno';
    }
  } catch (error) {
    console.error('Error al obtener tipo de usuario:', error);
    return 'alumno';
  }
}

/**
 * Verifica si un elemento del menú debe mostrarse según los permisos del usuario
 * @param {string} elemento - Nombre del elemento a verificar ('gestionAlumnos', 'gestionDocentes', etc.)
 * @returns {boolean} true si el elemento debe mostrarse, false en caso contrario
 */
export function mostrarElemento(elemento) {
  // En el servidor, mostrar solo elementos críticos
  if (typeof window === 'undefined') {
    // Valores por defecto para elementos críticos en SSR
    if (elemento === 'asignaciones' || elemento === 'calificaciones') {
      return true;
    }
    return false;
  }
  
  try {
    const permisos = obtenerPermisos();
    return permisos[elemento] === true;
  } catch (error) {
    console.error(`Error al verificar permiso ${elemento}:`, error);
    // Valores por defecto para elementos críticos
    if (elemento === 'asignaciones' || elemento === 'calificaciones') {
      return true;
    }
    return false;
  }
}

/**
 * Verifica si el usuario es un docente
 * @returns {boolean} true si el usuario es docente, false en caso contrario
 */
export function esDocente() {
  return obtenerTipoUsuario() === 'docente';
}

/**
 * Verifica si el usuario es control escolar
 * @returns {boolean} true si el usuario es control, false en caso contrario
 */
export function esControl() {
  return obtenerTipoUsuario() === 'control';
}

/**
 * Verifica si el usuario es un alumno
 * @returns {boolean} true si el usuario es alumno, false en caso contrario
 */
export function esAlumno() {
  return obtenerTipoUsuario() === 'alumno';
}

/**
 * Determina si un elemento debe ocultarse mediante CSS en lugar de eliminarse del DOM
 * Útil para botones de acción como editar, eliminar y agregar que deben ocultarse para docentes
 * @param {string} elemento - Nombre del elemento a verificar ('editarAsignacion', 'eliminarAsignacion', 'agregarAsignacion', etc.)
 * @returns {string} Clase CSS a aplicar ('hidden' si debe ocultarse, '' si debe mostrarse)
 */
export function ocultarElementoCSS(elemento) {
  // En el servidor, no ocultar nada para evitar problemas de hidratación
  if (typeof window === 'undefined') {
    return '';
  }
  
  try {
    const tipoUsuario = obtenerTipoUsuario();
    
    // Lista de elementos que deben ocultarse para docentes
    const elementosOcultosParaDocentes = [
      'editarAsignacion',
      'eliminarAsignacion',
      'agregarAsignacion',
      'editarActividad',
      'eliminarActividad',
      // Elementos de gestión de aulas que solo control puede ver
      'agregarEstudiantes',
      'gestionarProfesores',
      'eliminarEstudiantes',
      'avanzarGrado',
      'eliminarAula',
      'agregarAula',
      'bloquearMomento'
      // Se ha quitado 'agregarActividad' para que sea visible para docentes
    ];
    
    // Si es docente y el elemento está en la lista, ocultarlo
    if (tipoUsuario === 'docente' && elementosOcultosParaDocentes.includes(elemento)) {
      return 'hidden';
    }
    
    return ''; // No ocultar para otros tipos de usuario o elementos no listados
  } catch (error) {
    console.error(`Error al verificar ocultamiento CSS para ${elemento}:`, error);
    return ''; // En caso de error, no ocultar
  }
}

/**
 * Determina si el candado de bloqueo debe ocultarse para docentes
 * @param {string} elemento - Nombre del elemento a verificar ('candadoBloqueo')
 * @returns {string} Clase CSS a aplicar ('hidden' si debe ocultarse, '' si debe mostrarse)
 */
export function ocultarCandadoCSS(elemento) {
  // En el servidor, no ocultar nada para evitar problemas de hidratación
  if (typeof window === 'undefined') {
    return '';
  }
  
  try {
    const tipoUsuario = obtenerTipoUsuario();
    
    // Lista de elementos que deben ocultarse para docentes
    const elementosOcultosParaDocentes = [
      'candadoBloqueo'
    ];
    
    // Si es docente y el elemento está en la lista, ocultarlo
    if (tipoUsuario === 'docente' && elementosOcultosParaDocentes.includes(elemento)) {
      return 'hidden';
    }
    
    return ''; // No ocultar para otros tipos de usuario o elementos no listados
  } catch (error) {
    console.error(`Error al verificar ocultamiento CSS para ${elemento}:`, error);
    return ''; // En caso de error, no ocultar
  }
}
