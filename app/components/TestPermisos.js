"use client";

import { useState, useEffect } from 'react';
import { mostrarElemento, esDocente, esControl, esAlumno } from './PermisosHelper';

export default function TestPermisos() {
  const [permisos, setPermisos] = useState({});
  const [tipoUsuario, setTipoUsuario] = useState('');
  
  useEffect(() => {
    // Simular diferentes tipos de usuario para pruebas
    const testTipoUsuario = prompt('Ingrese tipo de usuario para prueba (control, docente, alumno)', 'docente');
    
    // Establecer cookies de prueba
    document.cookie = `userType=${testTipoUsuario}; path=/`;
    
    // Establecer permisos según el tipo de usuario
    const permisosTest = {
      gestionAlumnos: testTipoUsuario === 'control',
      gestionDocentes: testTipoUsuario === 'control',
      gestionMaterias: testTipoUsuario === 'control',
      asignaciones: true,
      calificaciones: true,
      reportes: testTipoUsuario === 'control' || testTipoUsuario === 'docente'
    };
    
    document.cookie = `permisos=${JSON.stringify(permisosTest)}; path=/`;
    
    setTipoUsuario(testTipoUsuario);
    setPermisos(permisosTest);
    
    // Recargar la página para aplicar los cambios
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }, []);
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Prueba de Permisos</h2>
      
      <div className="mb-4">
        <p><strong>Tipo de Usuario:</strong> {tipoUsuario}</p>
        <p><strong>Es Docente:</strong> {esDocente() ? 'Sí' : 'No'}</p>
        <p><strong>Es Control:</strong> {esControl() ? 'Sí' : 'No'}</p>
        <p><strong>Es Alumno:</strong> {esAlumno() ? 'Sí' : 'No'}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Permisos:</h3>
        <ul className="list-disc pl-5">
          <li>Gestión de Alumnos: {mostrarElemento('gestionAlumnos') ? 'Visible' : 'No visible'}</li>
          <li>Gestión de Docentes: {mostrarElemento('gestionDocentes') ? 'Visible' : 'No visible'}</li>
          <li>Gestión de Materias: {mostrarElemento('gestionMaterias') ? 'Visible' : 'No visible'}</li>
          <li>Asignaciones: {mostrarElemento('asignaciones') ? 'Visible' : 'No visible'}</li>
          <li>Calificaciones: {mostrarElemento('calificaciones') ? 'Visible' : 'No visible'}</li>
          <li>Reportes: {mostrarElemento('reportes') ? 'Visible' : 'No visible'}</li>
        </ul>
      </div>
      
      <div className="mt-4 p-3 bg-blue-100 rounded">
        <p>Esta página se recargará en 2 segundos para aplicar los cambios de permisos.</p>
      </div>
    </div>
  );
}
