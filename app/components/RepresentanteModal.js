"use client";

import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from '../hooks/useDebounce';

export default function RepresentanteModal({ isOpen, onClose, estudiante, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    correo: '',
    telefono: '',
    parentesco: 'Padre',
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  // Cargar los datos del representante si existen
  useEffect(() => {
    if (estudiante && estudiante.representante) {
      setFormData({
        nombre: estudiante.representante.nombre || '',
        apellido: estudiante.representante.apellido || '',
        cedula: estudiante.representante.cedula || '',
        correo: estudiante.representante.correo || '',
        telefono: estudiante.representante.telefono || '',
        parentesco: estudiante.representante.parentesco || 'Padre',
      });
      // Reiniciar errores y campos tocados cuando se cargan nuevos datos
      setErrors({});
      setTouched({});
    } else {
      // Resetear el formulario si no hay datos
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        correo: '',
        telefono: '',
        parentesco: 'Padre',
      });
    }
  }, [estudiante]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos obligatorios
    if (touched.nombre && !formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (touched.apellido && !formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }
    
    if (touched.cedula && !formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es obligatoria';
    } else if (touched.cedula && !/^\d+$/.test(formData.cedula.trim())) {
      newErrors.cedula = 'La cédula debe contener solo números';
    }
    
    if (touched.telefono && !formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (touched.telefono && !/^\d+$/.test(formData.telefono.trim())) {
      newErrors.telefono = 'El teléfono debe contener solo números';
    }
    
    if (touched.correo && formData.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo.trim())) {
      newErrors.correo = 'El correo no es válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función de validación con debounce más agresivo para mejorar rendimiento
  const debouncedValidation = useDebouncedCallback(() => {
    // Solo validar si hay campos tocados
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, 500); // Aumentar debounce a 500ms

  // Validar campos cuando cambian (solo si hay campos tocados)
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      debouncedValidation();
    }
  }, [formData, debouncedValidation, touched]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Optimizar actualizaciones usando funciones de callback
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    
    // Marcar el campo como tocado
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados para mostrar todos los errores
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Validar antes de enviar
    const isValid = validateForm();
    
    if (isValid) {
      setSaving(true);
      onSave(formData).finally(() => {
        setSaving(false);
      });
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay/Background */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Datos del Representante</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Form */}
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  id="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  required
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>
              
              {/* Apellido */}
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  id="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.apellido ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  required
                />
                {errors.apellido && (
                  <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>
                )}
              </div>
              
              {/* Cédula */}
              <div>
                <label htmlFor="cedula" className="block text-sm font-medium text-gray-700">
                  Cédula *
                </label>
                <input
                  type="text"
                  name="cedula"
                  id="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.cedula ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  required
                />
                {errors.cedula && (
                  <p className="mt-1 text-sm text-red-600">{errors.cedula}</p>
                )}
              </div>
              
              {/* Correo */}
              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="correo"
                  id="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.correo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.correo && (
                  <p className="mt-1 text-sm text-red-600">{errors.correo}</p>
                )}
              </div>
              
              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  id="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  required
                />
                {errors.telefono && (
                  <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                )}
              </div>
              
              {/* Parentesco */}
              <div>
                <label htmlFor="parentesco" className="block text-sm font-medium text-gray-700">
                  Parentesco
                </label>
                <select
                  name="parentesco"
                  id="parentesco"
                  value={formData.parentesco}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Abuelo">Abuelo</option>
                  <option value="Abuela">Abuela</option>
                  <option value="Tío">Tío</option>
                  <option value="Tía">Tía</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Los campos marcados con * son obligatorios
            </div>
            
            {/* Buttons */}
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
