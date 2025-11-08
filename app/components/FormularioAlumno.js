"use client";

import { useState, useEffect, useCallback, memo } from 'react';
import '../styles/performance.css';

export default function FormularioAlumno({ 
  formData, 
  setFormData, 
  handleFormChange, 
  handleSubmit, 
  onClose 
}) {
  // Inicializar datos del representante si no existen
  useEffect(() => {
    if (!formData.representante) {
      setFormData(prev => ({
        ...prev,
        representante: {
          nombre: '',
          apellido: '',
          cedula: '',
          correo: '',
          telefono: '',
          parentesco: 'Padre'
        }
      }));
    }
  }, [formData, setFormData]);

  // Manejar cambios en los campos del representante (optimizado)
  const handleRepresentanteChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      representante: {
        ...prev.representante,
        [name]: value
      }
    }));
  }, [setFormData]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-md mb-6 border-t-4 border-blue-500 border-r border-b border-l border-blue-100 performance-form-container performance-no-animations">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-blue-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {formData.modoEdicion ? 'Editar Alumno' : 'Agregar Nuevo Alumno'}
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Año escolar */}
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Año
            </label>
            <div className="relative">
              <select
                name="anio"
                value={formData.anio || ''}
                onChange={handleFormChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
              >
                <option value="">Seleccione un año</option>
                <option value="1">1er año</option>
                <option value="2">2do año</option>
                <option value="3">3er año</option>
                <option value="4">4to año</option>
                <option value="5">5to año</option>
                <option value="6">6to año</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">📚</span>
              </div>
            </div>
          </div>
          
          {/* Sección */}
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Sección
            </label>
            <div className="relative">
              <select
                name="seccion"
                value={formData.seccion || ''}
                onChange={handleFormChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
              >
                <option value="">Seleccione una sección</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="U">Única</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">🏫</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Nombre
            </label>
            <div className="relative">
              <input
                type="text"
                name="nombre"
                value={formData.nombre || ''}
                placeholder="Indique el nombre del alumno"
                onChange={handleFormChange}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">Aa</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Apellido
            </label>
            <div className="relative">
              <input
                type="text"
                name="apellido"
                value={formData.apellido || ''}
                placeholder="Indique el apellido del alumno"
                onChange={handleFormChange}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">Aa</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              Cédula
            </label>
            <div className="relative">
              <input
                type="text"
                name="cedula"
                value={formData.cedula || ''}
                onChange={handleFormChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                placeholder="Indique la cedula, si no posee utiliza la del representante"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">#</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Fecha de Nacimiento
            </label>
            <div className="relative">
              <input
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento || ''}
                onChange={handleFormChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Lugar de Nacimiento
            </label>
            <div className="relative">
              <select
                name="lugarNacimiento"
                value={formData.lugarNacimiento || ''}
                onChange={handleFormChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
              >
                <option value="">Seleccione un estado</option>
                <option value="Amazonas">Amazonas</option>
                <option value="Anzoátegui">Anzoátegui</option>
                <option value="Apure">Apure</option>
                <option value="Aragua">Aragua</option>
                <option value="Barinas">Barinas</option>
                <option value="Bolívar">Bolívar</option>
                <option value="Carabobo">Carabobo</option>
                <option value="Cojedes">Cojedes</option>
                <option value="Delta Amacuro">Delta Amacuro</option>
                <option value="Distrito Capital">Distrito Capital</option>
                <option value="Falcón">Falcón</option>
                <option value="Guárico">Guárico</option>
                <option value="Lara">Lara</option>
                <option value="Mérida">Mérida</option>
                <option value="Miranda">Miranda</option>
                <option value="Monagas">Monagas</option>
                <option value="Nueva Esparta">Nueva Esparta</option>
                <option value="Portuguesa">Portuguesa</option>
                <option value="Sucre">Sucre</option>
                <option value="Táchira">Táchira</option>
                <option value="Trujillo">Trujillo</option>
                <option value="Vargas">Vargas</option>
                <option value="Yaracuy">Yaracuy</option>
                <option value="Zulia">Zulia</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sexo
            </label>
            <div className="relative">
              <select
                name="sexo"
                value={formData.sexo || 'Otro'}
                onChange={handleFormChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              EF (Información adicional)
            </label>
            <div className="relative">
              <input
                type="text"
                name="ef"
                value={formData.ef || ''}
                onChange={handleFormChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                placeholder="Información adicional del estudiante"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Edad
            </label>
            <div className="relative">
              <input
                type="number"
                name="edad"
                value={formData.edad || 0}
                onChange={handleFormChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                min="0"
                max="100"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkbox para menor de edad */}
        <div className="mb-6">
          <div className="flex items-center">
            <input
              id="esMenorDeEdad"
              name="esMenorDeEdad"
              type="checkbox"
              checked={formData.esMenorDeEdad || false}
              onChange={(e) => setFormData({ ...formData, esMenorDeEdad: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="esMenorDeEdad" className="ml-2 block text-sm text-gray-900">
              Es menor de edad
            </label>
          </div>
        </div>

        {/* Sección de datos del representante */}
        <div className="mb-4 mt-6 border-t pt-4">
          <h4 className="text-lg font-semibold text-blue-700 flex items-center mb-4">
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Datos del Representante
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Nombre del Representante */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Nombre del Representante *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nombre"
                  value={formData.representante?.nombre || ''}
                  placeholder="Nombre del representante"
                  onChange={handleRepresentanteChange}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-blue-500">Aa</span>
                </div>
              </div>
            </div>
            
            {/* Apellido del Representante */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Apellido del Representante *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="apellido"
                  value={formData.representante?.apellido || ''}
                  placeholder="Apellido del representante"
                  onChange={handleRepresentanteChange}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-blue-500">Aa</span>
                </div>
              </div>
            </div>
            
            {/* Cédula del Representante */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                Cédula del Representante *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cedula"
                  value={formData.representante?.cedula || ''}
                  placeholder="Número de cédula"
                  onChange={handleRepresentanteChange}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-blue-500">#</span>
                </div>
              </div>
            </div>
            
            {/* Teléfono del Representante */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Teléfono del Representante *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="telefono"
                  value={formData.representante?.telefono || ''}
                  placeholder="Número de teléfono"
                  onChange={handleRepresentanteChange}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-blue-500">📞</span>
                </div>
              </div>
            </div>
            
            {/* Correo del Representante */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Correo del Representante
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="correo"
                  value={formData.representante?.correo || ''}
                  placeholder="Correo electrónico"
                  onChange={handleRepresentanteChange}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-blue-500">@</span>
                </div>
              </div>
            </div>
            
            {/* Parentesco */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Parentesco
              </label>
              <div className="relative">
                <select
                  name="parentesco"
                  value={formData.representante?.parentesco || 'Padre'}
                  onChange={handleRepresentanteChange}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 critical-performance-input"
                >
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Abuelo">Abuelo</option>
                  <option value="Abuela">Abuela</option>
                  <option value="Tío">Tío</option>
                  <option value="Tía">Tía</option>
                  <option value="Otro">Otro</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-blue-500">👪</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mb-2">
            Los campos marcados con * son obligatorios
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {formData.modoEdicion ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>

      {/* Los campos del representante ahora están integrados directamente en el formulario */}
    </div>
  );
}
