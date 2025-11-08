import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import StudentNameById from '../components/StudentNameById';

// Hook personalizado para debounce
export const useDebounce = (value, delay) => {
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
};

// Hook para memoizar cálculos pesados
export const useMemoizedData = (data, dependencies) => {
  return useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data;
  }, dependencies);
};

// Componente optimizado para filas de tabla de alumnos
export const OptimizedStudentRow = memo(({ 
  alumno, 
  index, 
  onEdit, 
  onDelete, 
  onEstadoChange, 
  calcularEdad,
  updatingEstado 
}) => {
  const edad = useMemo(() => 
    alumno.edad || calcularEdad(alumno.fechaNacimiento), 
    [alumno.edad, alumno.fechaNacimiento, calcularEdad]
  );
  
  const esMenorDeEdad = useMemo(() => 
    alumno.esMenorDeEdad !== undefined ? alumno.esMenorDeEdad : edad < 18, 
    [alumno.esMenorDeEdad, edad]
  );

  const handleEdit = useCallback(() => onEdit(alumno), [onEdit, alumno]);
  const handleDelete = useCallback(() => onDelete(alumno.id || alumno._id), [onDelete, alumno.id, alumno._id]);
  const handleEstadoChange = useCallback(() => 
    onEstadoChange(alumno.id || alumno._id, alumno.estado !== undefined ? alumno.estado : 1), 
    [onEstadoChange, alumno.id, alumno._id, alumno.estado]
  );

  return (
    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors duration-150`}>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center justify-start">
          {alumno.cedula === 'N/P' ? 
            <span className="text-gray-600 italic bg-gray-100 px-2 py-1 rounded-md font-semibold">N/P</span> : 
            <span className="font-bold text-gray-900 bg-blue-100 px-3 py-1 rounded-full">{alumno.cedula}</span>
          }
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="w-full">
            <p className="text-sm font-bold text-gray-900 break-words leading-tight">
              <StudentNameById studentId={alumno._id || alumno.id} fallback={alumno} />
            </p>
            <div className="flex flex-col space-y-1 mt-1">
              {alumno.lugarNacimiento && (
                <p className="text-xs font-semibold text-gray-700">Lugar: {alumno.lugarNacimiento}</p>
              )}
              {alumno.sexo && (
                <p className="text-xs font-semibold text-gray-700">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    Sexo: {alumno.sexo === 'M' ? 'Masculino' : alumno.sexo === 'F' ? 'Femenino' : 'Otro'}
                  </span>
                </p>
              )}
              {alumno.ef && (
                <p className="text-xs font-semibold text-gray-700">EF: {alumno.ef}</p>
              )}
              {alumno.anio && (
                <p className="text-xs font-semibold text-gray-700">Año: {alumno.anio}</p>
              )}
              {alumno.seccion && (
                <p className="text-xs font-semibold text-gray-700">Sección: {alumno.seccion}</p>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full bg-blue-100 text-blue-900">
            {edad} años
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center justify-center">
          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${esMenorDeEdad ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${esMenorDeEdad ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
            {esMenorDeEdad ? 'Sí' : 'No'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center justify-center">
          <button 
            onClick={handleEstadoChange}
            disabled={updatingEstado}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ backgroundColor: alumno.estado === 0 ? '#d1d5db' : '#3b82f6' }}
          >
            <span className="sr-only">Cambiar estado</span>
            <span 
              className={`${alumno.estado === 0 ? 'translate-x-1' : 'translate-x-6'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
            />
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
            title="Editar alumno"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
            title="Eliminar alumno"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
});

// Componente optimizado para filas de tabla de profesores
export const OptimizedTeacherRow = memo(({ 
  profesor, 
  index, 
  onEdit, 
  onDelete, 
  onToggleEstado 
}) => {
  const handleEdit = useCallback(() => onEdit(profesor), [onEdit, profesor]);
  const handleDelete = useCallback(() => onDelete(profesor.id || profesor._id), [onDelete, profesor.id, profesor._id]);
  const handleToggleEstado = useCallback(() => onToggleEstado(profesor.id || profesor._id, profesor.estado), [onToggleEstado, profesor.id, profesor._id, profesor.estado]);

  return (
    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors duration-150`}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {profesor.nombre}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {profesor.cedula}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {profesor.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          profesor.estado === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {profesor.estado === 1 ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-900"
          >
            Editar
          </button>
          <button
            onClick={handleToggleEstado}
            className={`${profesor.estado === 1 ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
          >
            {profesor.estado === 1 ? 'Desactivar' : 'Activar'}
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900"
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
});

// Componente de loading optimizado
export const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
));

// Componente de búsqueda optimizado con debounce
export const OptimizedSearchInput = memo(({ 
  value, 
  onChange, 
  placeholder, 
  className,
  debounceDelay = 300 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceDelay);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  const handleChange = useCallback((e) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
});

// Hook para filtrado optimizado
export const useOptimizedFilter = (data, searchTerms, filterFunctions) => {
  return useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(item => {
      return filterFunctions.every(filterFn => filterFn(item, searchTerms));
    });
  }, [data, searchTerms, filterFunctions]);
};

// Hook para paginación
export const usePagination = (data, itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => 
    Math.ceil(data.length / itemsPerPage), 
    [data.length, itemsPerPage]
  );

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  return {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}; 