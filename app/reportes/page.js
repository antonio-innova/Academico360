"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Componente Modal para mostrar el PDF
const PDFModal = ({ isOpen, onClose, pdfUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full h-[95vh] max-w-7xl shadow-2xl transform scale-100 flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
          <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Vista previa del Reporte</span>
          </h3>
          <button
            onClick={onClose}
            className="text-white opacity-75 hover:opacity-100 transition-opacity duration-200 p-2 rounded-full hover:bg-blue-500"
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-white dark:bg-gray-800">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Vista previa del PDF"
              style={{ backgroundColor: 'white' }}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Presiona ESC para cerrar
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => window.open(pdfUrl, '_blank')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Abrir en nueva pestaña</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm hover:shadow-md space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ReportesPage() {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [tipoReporteActual, setTipoReporteActual] = useState('');
  const [animateCards, setAnimateCards] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  
  // Estados para la sección de Reporte Excel
  const [aulas, setAulas] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState('');
  const [momento, setMomento] = useState('1');
  const [momentoSabana, setMomentoSabana] = useState('1');
  
  // Estados para filtros de estudiantes
  const [anioSeleccionado, setAnioSeleccionado] = useState('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState('');
  const [aulasFiltradas, setAulasFiltradas] = useState([]);
  
  // Cargar las aulas disponibles
  const cargarAulas = async () => {
    try {
      const response = await fetch('/api/aulas');
      if (!response.ok) {
        throw new Error('Error al cargar las aulas');
      }
      const responseData = await response.json();
      console.log('Respuesta de API aulas:', responseData);
      
      // Manejar diferentes estructuras de respuesta posibles
      let aulasData = [];
      if (Array.isArray(responseData)) {
        aulasData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        aulasData = responseData.data;
      } else if (responseData.aulas && Array.isArray(responseData.aulas)) {
        aulasData = responseData.aulas;
      }
      
      console.log('Aulas procesadas:', aulasData);
      setAulas(aulasData);
      setAulasFiltradas(aulasData);
      
      // Si hay aulas, seleccionar la primera por defecto
      if (aulasData.length > 0) {
        setAulaSeleccionada(aulasData[0]._id);
      }
    } catch (error) {
      console.error('Error al cargar aulas:', error);
      setError('Error al cargar las aulas. Por favor, intenta de nuevo.');
    }
  };

  // Función para filtrar aulas por año y sección
  const filtrarAulas = () => {
    let aulasFiltradas = aulas;
    
    if (anioSeleccionado) {
      aulasFiltradas = aulasFiltradas.filter(aula => aula.anio === anioSeleccionado);
      console.log(`Filtrando aulas por año ${anioSeleccionado}: ${aulasFiltradas.length} aulas encontradas`);
    }
    
    if (seccionSeleccionada) {
      aulasFiltradas = aulasFiltradas.filter(aula => aula.seccion === seccionSeleccionada);
      console.log(`Filtrando aulas por sección ${seccionSeleccionada}: ${aulasFiltradas.length} aulas encontradas`);
    }
    
    setAulasFiltradas(aulasFiltradas);
    
    // Si el aula seleccionada no está en las filtradas, seleccionar la primera disponible
    if (aulasFiltradas.length > 0) {
      const aulaActualExiste = aulasFiltradas.find(aula => aula._id === aulaSeleccionada);
      if (!aulaActualExiste) {
        setAulaSeleccionada(aulasFiltradas[0]._id);
      }
    } else {
      setAulaSeleccionada('');
    }
  };

  // Efecto para filtrar aulas cuando cambien los filtros
  useEffect(() => {
    filtrarAulas();
  }, [anioSeleccionado, seccionSeleccionada, aulas]);

  // Efecto para cargar las aulas y animar las tarjetas al montar el componente
  useEffect(() => {
    // Cargar aulas
    cargarAulas();
    
    // Pequeño retraso para que la animación sea visible después de que se monte el componente
    const timer = setTimeout(() => {
      setAnimateCards(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Función para generar reportes CSV
  const handleGenerarReporteCSV = async (tipo) => {
    try {
      setGenerando(true);
      setError(null);
      setTipoReporteActual(tipo);
      setMensaje('Generando reporte...');
      setShowConfetti(false);
      
      // Construir los parámetros de filtrado
      const params = new URLSearchParams();
      
      // Añadir el tipo de reporte
      params.append('tipoReporte', tipo);
      
      // Simular un pequeño retraso para mostrar el estado de carga
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Realizar la petición al endpoint de reportes
      const response = await fetch(`/api/reportes/estudiantes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error al generar reporte: ${response.statusText}`);
      }
      
      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear URL para visualizar
      const url = window.URL.createObjectURL(blob);
      
      // Establecer la URL del PDF y abrir el modal
      setPdfUrl(url);
      setIsModalOpen(true);
      
      // Limpiar la URL cuando se cierre el modal
      const handleCleanup = () => {
        window.URL.revokeObjectURL(url);
      };
      
      // Agregar el evento de limpieza
      window.addEventListener('beforeunload', handleCleanup);
      
      // Retornar la función de limpieza
      return () => {
        window.removeEventListener('beforeunload', handleCleanup);
        handleCleanup();
      };
      
      // Mostrar mensaje de éxito y efectos visuales
      setMensaje(`¡Reporte de ${reportTitle} generado con éxito!`);
      setShowConfetti(true);
      
      // Ocultar confeti después de 3 segundos
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setError(`Error al generar reporte: ${error.message}`);
      setMensaje('');
    } finally {
      setGenerando(false);
    }
  };

  // Componente de confeti para celebrar la generación exitosa
  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({ length: 100 }).map((_, index) => {
          const size = Math.random() * 10 + 5;
          const left = Math.random() * 100;
          const animationDuration = Math.random() * 3 + 2;
          const delay = Math.random() * 0.5;
          const color = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
          ][Math.floor(Math.random() * 7)];
          
          return (
            <div 
              key={index}
              className={`absolute ${color} rounded-full`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: '-10px',
                animation: `fall ${animationDuration}s linear ${delay}s forwards`
              }}
            />
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* Estilos CSS para animaciones */}
      <style jsx global>{`
        @keyframes fall {
          0% { transform: translateY(-10px) rotate(0deg); }
          100% { transform: translateY(calc(100vh + 20px)) rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .card-animate {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .card-animate.show {
          animation: fadeIn 0.6s ease forwards;
        }
        
        .card-animate.show:nth-child(1) {
          animation-delay: 0.1s;
        }
        
        .card-animate.show:nth-child(2) {
          animation-delay: 0.3s;
        }
        
        .btn-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
      
      {/* Mostrar confeti cuando se genera un reporte exitosamente */}
      {showConfetti && <Confetti />}
      
      <div className="container mx-auto py-10 px-4">
        {/* Encabezado con diseño mejorado */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-blue-600 p-3 rounded-full mr-4 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Generación de Reportes</h1>
              <p className="text-gray-500">Exporta datos de estudiantes y docentes en formato CSV</p>
            </div>
          </div>
          <Link href="/sidebar" className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>
        
        {/* Mensajes de éxito o error con diseño mejorado */}
        {mensaje && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border-l-4 border-green-500 flex items-start animate__animated animate__fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{mensaje}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border-l-4 border-red-500 flex items-start animate__animated animate__fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {/* Sección de Reporte Excel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Reporte Excel de Estudiantes</h2>
          </div>
          
          {/* Filtros por año y sección */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Año</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
              >
                <option value="">Todos los años</option>
                <option value="1">1° Año</option>
                <option value="2">2° Año</option>
                <option value="3">3° Año</option>
                <option value="4">4° Año</option>
                <option value="5">5° Año</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Sección</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={seccionSeleccionada}
                onChange={(e) => setSeccionSeleccionada(e.target.value)}
              >
                <option value="">Todas las secciones</option>
                <option value="A">Sección A</option>
                <option value="B">Sección B</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Aula</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={aulaSeleccionada}
                onChange={(e) => setAulaSeleccionada(e.target.value)}
              >
                {aulasFiltradas.length === 0 && (
                  <option value="">
                    {anioSeleccionado || seccionSeleccionada 
                      ? `No hay aulas para ${anioSeleccionado ? `${anioSeleccionado}° año` : ''}${anioSeleccionado && seccionSeleccionada ? ' ' : ''}${seccionSeleccionada ? `sección ${seccionSeleccionada}` : ''}`
                      : 'No hay aulas disponibles'
                    }
                  </option>
                )}
                {aulasFiltradas.map((aula) => (
                  <option key={aula._id} value={aula._id}>
                    {aula.nombre} - {aula.anio}° {aula.seccion}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Momento</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={momento}
                onChange={(e) => setMomento(e.target.value)}
              >
                <option value="1">1er Momento</option>
                <option value="2">2do Momento</option>
                <option value="3">3er Momento</option>
                <option value="final">Final</option>
              </select>
            </div>
            
            <div className="col-span-1 flex items-end">
              <button
                onClick={() => {
                  // Si no hay aula seleccionada pero hay filtros aplicados, generar reporte de todos los estudiantes
                  if (!aulaSeleccionada && (anioSeleccionado || seccionSeleccionada)) {
                    // Construir la URL para descargar el Excel de todos los estudiantes con filtros
                    const params = new URLSearchParams();
                    params.append('tipoReporte', 'todosEstudiantes');
                    
                    // Agregar filtros si están seleccionados
                    if (anioSeleccionado) {
                      params.append('anio', anioSeleccionado);
                    }
                    if (seccionSeleccionada) {
                      params.append('seccion', seccionSeleccionada);
                    }
                    
                    // Redirigir a la URL de descarga
                    window.location.href = `/api/reportes/excel?${params.toString()}`;
                    
                    // Mostrar mensaje de éxito
                    let mensajeFiltros = '';
                    if (anioSeleccionado || seccionSeleccionada) {
                      mensajeFiltros = ` (filtrado por ${anioSeleccionado ? `${anioSeleccionado}° año` : ''}${anioSeleccionado && seccionSeleccionada ? ' y ' : ''}${seccionSeleccionada ? `sección ${seccionSeleccionada}` : ''})`;
                    }
                    setMensaje(`Reporte de estudiantes generado con éxito${mensajeFiltros}`);
                    setShowConfetti(true);
                    
                    // Limpiar mensaje después de 5 segundos
                    setTimeout(() => {
                      setMensaje('');
                      setShowConfetti(false);
                    }, 5000);
                    return;
                  }
                  
                  if (!aulaSeleccionada) {
                    setError('Por favor, selecciona un aula o aplica filtros de año/sección');
                    return;
                  }
                  
                  // Construir la URL para descargar el Excel
                  const params = new URLSearchParams();
                  params.append('tipoReporte', 'notasPorAula');
                  params.append('aulaId', aulaSeleccionada);
                  params.append('momento', momento);
                  
                  // Agregar filtros si están seleccionados
                  if (anioSeleccionado) {
                    params.append('anio', anioSeleccionado);
                  }
                  if (seccionSeleccionada) {
                    params.append('seccion', seccionSeleccionada);
                  }
                  
                  // Redirigir a la URL de descarga
                  window.location.href = `/api/reportes/excel?${params.toString()}`;
                  
                  // Mostrar mensaje de éxito
                  setMensaje(`Reporte de notas del momento ${momento} generado con éxito`);
                  setShowConfetti(true);
                  
                  // Limpiar mensaje después de 5 segundos
                  setTimeout(() => {
                    setMensaje('');
                    setShowConfetti(false);
                  }, 5000);
                }}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                disabled={generando}
              >
                {generando ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {!aulaSeleccionada && (anioSeleccionado || seccionSeleccionada) 
                      ? 'Descargar Reporte de Estudiantes' 
                      : 'Descargar Reporte Excel'
                    }
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <strong>Reporte por Aula:</strong> Si seleccionas un aula específica, incluirá la lista de todos los alumnos del aula con sus respectivas notas para el momento seleccionado.
            <br />
            <strong>Reporte por Filtros:</strong> Si aplicas filtros de año y sección pero no hay aulas disponibles, generará un reporte de todos los estudiantes que coincidan con esos filtros.
            <br />
            En caso de que un alumno no tenga calificación, se mostrará "N/P" (No Presentado).
            <br />
            <strong>Filtros:</strong> Usa los filtros de año y sección para encontrar aulas específicas o generar reportes filtrados.
          </div>
        </div>
        
        {/* Sección de Sábana por Aula */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-7-8h8M5 7h.01M5 17h.01M5 12h.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Generación de Sábana por Aula</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Aula</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={aulaSeleccionada}
                onChange={(e) => setAulaSeleccionada(e.target.value)}
              >
                <option value="">Seleccione un aula</option>
                {aulasFiltradas.map(a => (
                  <option key={a._id} value={a._id}>{`${a.anio || ''}° ${a.seccion || ''} - ${a.nombre || ''}`}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Momento</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={momentoSabana}
                onChange={(e) => setMomentoSabana(e.target.value)}
              >
                <option value="1">1er Momento</option>
                <option value="2">2do Momento</option>
                <option value="3">3er Momento</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={async () => {
                  if (!aulaSeleccionada) return;
                  setGenerando(true);
                  try {
                    const params = new URLSearchParams({ aulaId: aulaSeleccionada, momento: momentoSabana });
                    const resp = await fetch(`/api/reportes/sabana?${params.toString()}`);
                    if (!resp.ok) throw new Error('No se pudo generar la sábana');
                    const blob = await resp.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `SABANA_${momentoSabana}M.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error(e);
                    setError(e.message || 'Error generando la sábana');
                  } finally {
                    setGenerando(false);
                  }
                }}
                className={`w-full md:w-auto px-6 py-3 ${generando ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md shadow transition-colors`}
                disabled={generando}
              >
                {generando ? 'Generando…' : 'Descargar Sábana Excel'}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            La sábana replica la estructura de EV1..EV5 y NF por materia. Si una materia está bloqueada para el momento seleccionado, sus casillas saldrán vacías.
          </p>
        </div>

        {/* Sección de Reporte Completo */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Reporte Completo - Estudiantes y Representantes</h2>
          </div>
          
          {/* Filtros para el reporte completo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Año</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
              >
                <option value="">Todos los años</option>
                <option value="1">1° Año</option>
                <option value="2">2° Año</option>
                <option value="3">3° Año</option>
                <option value="4">4° Año</option>
                <option value="5">5° Año</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Sección</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={seccionSeleccionada}
                onChange={(e) => setSeccionSeleccionada(e.target.value)}
              >
                <option value="">Todas las secciones</option>
                <option value="A">Sección A</option>
                <option value="B">Sección B</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => {
                // Construir la URL para descargar el reporte completo
                const params = new URLSearchParams();
                params.append('tipoReporte', 'completo');
                
                // Agregar filtros si están seleccionados
                if (anioSeleccionado) {
                  params.append('anio', anioSeleccionado);
                }
                if (seccionSeleccionada) {
                  params.append('seccion', seccionSeleccionada);
                }
                
                // Redirigir a la URL de descarga
                window.location.href = `/api/reportes/excel?${params.toString()}`;
                
                // Mostrar mensaje de éxito
                let mensajeFiltros = '';
                if (anioSeleccionado || seccionSeleccionada) {
                  mensajeFiltros = ` (filtrado por ${anioSeleccionado ? `${anioSeleccionado}° año` : ''}${anioSeleccionado && seccionSeleccionada ? ' y ' : ''}${seccionSeleccionada ? `sección ${seccionSeleccionada}` : ''})`;
                }
                setMensaje(`Reporte completo generado con éxito${mensajeFiltros}`);
                setShowConfetti(true);
                
                // Limpiar mensaje después de 5 segundos
                setTimeout(() => {
                  setMensaje('');
                  setShowConfetti(false);
                }, 5000);
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center w-80"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Reporte Completo
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 text-center">
            Este reporte incluye información completa de estudiantes y sus respectivos representantes. 
            Incluye datos del estudiante (cédula, nombre, apellido, fecha de nacimiento, edad, género, año, sección) 
            y datos del representante (cédula, nombre, apellido, teléfono, correo, parentesco).
            <br />
            <strong>Filtros:</strong> Usa los filtros de año y sección para generar reportes específicos por grado.
          </div>
        </div>

        {/* Sección de Reporte Excel de Docentes */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Reporte Excel de Docentes</h2>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => {
                // Construir la URL para descargar el Excel de docentes
                const params = new URLSearchParams();
                params.append('tipoReporte', 'docentes');
                
                // Redirigir a la URL de descarga
                window.location.href = `/api/reportes/excel?${params.toString()}`;
                
                // Mostrar mensaje de éxito
                setMensaje(`Reporte de docentes generado con éxito`);
                setShowConfetti(true);
                
                // Limpiar mensaje después de 5 segundos
                setTimeout(() => {
                  setMensaje('');
                  setShowConfetti(false);
                }, 5000);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center w-64"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Lista de Docentes
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 text-center">
            Este reporte incluirá la lista completa de todos los docentes registrados en el sistema con sus datos de contacto y estado.
          </div>
        </div>
        
        {/* Tarjetas de reportes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tarjeta de reporte de estudiantes */}
          <div className={`bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg overflow-hidden border-t-4 border-blue-500 border-r border-b border-l border-gray-200 card-animate ${animateCards ? 'show' : ''} transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
            <div className="p-6 text-gray-800">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3 shadow-sm transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 transform transition-all duration-300 group-hover:text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Reportes de Estudiantes</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Genera un reporte completo con todos los estudiantes registrados en el sistema. Incluye información como cédula, nombre, fecha de nacimiento y si es menor de edad.
                <br />
                <strong>Nota:</strong> Puedes usar los filtros de año y sección arriba para generar reportes específicos.
              </p>
              <button
                onClick={() => {
                  // Construir la URL para descargar el Excel de estudiantes
                  const params = new URLSearchParams();
                  params.append('tipoReporte', 'todosEstudiantes');
                  
                  // Agregar filtros si están seleccionados
                  if (anioSeleccionado) {
                    params.append('anio', anioSeleccionado);
                  }
                  if (seccionSeleccionada) {
                    params.append('seccion', seccionSeleccionada);
                  }
                  
                  // Redirigir a la URL de descarga
                  window.location.href = `/api/reportes/excel?${params.toString()}`;
                  
                  // Mostrar mensaje de éxito
                  let mensajeFiltros = '';
                  if (anioSeleccionado || seccionSeleccionada) {
                    mensajeFiltros = ` (filtrado por ${anioSeleccionado ? `${anioSeleccionado}° año` : ''}${anioSeleccionado && seccionSeleccionada ? ' y ' : ''}${seccionSeleccionada ? `sección ${seccionSeleccionada}` : ''})`;
                  }
                  setMensaje(`Reporte de estudiantes generado con éxito${mensajeFiltros}`);
                  setShowConfetti(true);
                  
                  // Limpiar mensaje después de 5 segundos
                  setTimeout(() => {
                    setMensaje('');
                    setShowConfetti(false);
                  }, 5000);
                }}
                disabled={generando}
                className={`w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all duration-300 shadow-md disabled:bg-blue-300 disabled:text-white disabled:cursor-not-allowed transform hover:-translate-y-1 ${!generando ? 'btn-pulse' : ''}`}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Generar Reporte de Estudiantes
                </div>
              </button>
            </div>
          </div>
        </div>

        
        {/* Sección de instrucciones con diseño mejorado */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="bg-yellow-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Instrucciones</h2>
          </div>
          
          <div className="ml-12 text-gray-600 space-y-4">
            <div className="flex items-start">
              <span className="flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 mr-3 flex-shrink-0 font-bold text-sm">1</span>
              <p>Selecciona el tipo de reporte que deseas generar haciendo clic en el botón correspondiente.</p>
            </div>
            
            <div className="flex items-start">
              <span className="flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 mr-3 flex-shrink-0 font-bold text-sm">2</span>
              <p>El sistema procesará la solicitud y generará un archivo CSV con todos los datos solicitados.</p>
            </div>
            
            <div className="flex items-start">
              <span className="flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 mr-3 flex-shrink-0 font-bold text-sm">3</span>
              <p>El archivo se descargará automáticamente a tu dispositivo una vez que esté listo.</p>
            </div>
            
            <div className="flex items-start">
              <span className="flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 mr-3 flex-shrink-0 font-bold text-sm">4</span>
              <p>Puedes abrir el archivo CSV con Microsoft Excel, Google Sheets, LibreOffice Calc u otra aplicación de hojas de cálculo.</p>
            </div>
            
            <div className="flex items-start">
              <span className="flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 mr-3 flex-shrink-0 font-bold text-sm">5</span>
              <p>Si encuentras algún error, verifica tu conexión a internet e intenta nuevamente.</p>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    <strong>Nota:</strong> Los reportes pueden tardar unos segundos en generarse dependiendo de la cantidad de datos en el sistema.
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Para obtener los mejores resultados, asegúrate de que todos los datos en el sistema estén correctamente registrados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal para mostrar el PDF */}
      <PDFModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          window.URL.revokeObjectURL(pdfUrl);
          setPdfUrl('');
        }}
        pdfUrl={pdfUrl}
      />
    </div>
  );
}
