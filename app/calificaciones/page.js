'use client'
import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { obtenerTipoUsuario, ocultarElementoCSS, ocultarCandadoCSS, esControl } from '../components/PermisosHelper';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './calificaciones.module.css';
import reportStyles from './report.module.css';
import BuscarEstudiante from '../components/BuscarEstudiante';
import StudentNameById from '../components/StudentNameById';
import ReporteCalificaciones from '../components/ReporteCalificaciones';
import { loadDriver } from '../utils/driverLoader';

// Función para convertir nota numérica a letra
const convertirNotaALetra = (nota) => {
  if (nota >= 18) return 'A';
  if (nota >= 14) return 'B';
  if (nota >= 11) return 'C';
  return 'D';
};

// Función para convertir letra a nota numérica (punto medio del rango)
const convertirLetraANota = (letra) => {
  switch (letra) {
    case 'A': return 19; // 20-18 -> 19
    case 'B': return 15.5; // 17-14 -> 15.5
    case 'C': return 12; // 13-11 -> 12
    case 'D': return 5.5; // 10-1 -> 5.5
    default: return 0;
  }
};

const normalizeMateriasAsignadas = (materias) => {
  if (!materias) return [];
  if (Array.isArray(materias)) return materias;
  if (typeof materias === 'object') {
    try {
      return Object.values(materias);
    } catch {
      return [];
    }
  }
  return [];
};

function CalificacionesContent() {
  const searchParams = useSearchParams();
  const aulaId = searchParams.get('aulaId');
  const materiaId = searchParams.get('materiaId');
  
  // Guía interactiva con Driver.js
  const startTour = async () => {
    try {
      const driverFn = await loadDriver();
      if (!driverFn) {
        throw new Error('Driver.js no disponible');
      }

      const tour = driverFn({
        showProgress: true,
        overlayClickNext: false,
        popoverClass: 'tour-popover',
        steps: [
          {
            element: '#seccion-actividades',
            popover: {
              title: 'Gestión de Actividades',
              description: 'Aquí podrás crear actividades por momento, verlas y gestionarlas.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#btn-agregar-actividad',
            popover: {
              title: 'Agregar Actividad',
              description: 'Haz clic para crear una nueva actividad (nombre, fecha, porcentaje y momento).',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            // Primer botón "Calificar" disponible
            element: () => document.querySelector(`.${styles.calificacionButton}`),
            popover: {
              title: 'Agregar una Nota',
              description: 'Pulsa "Calificar" para abrir el formulario y registrar la nota del estudiante en esta actividad.',
              side: 'left',
              align: 'center'
            }
          },
          {
            element: () => document.querySelector(`.${styles.batchButton}`),
            popover: {
              title: 'Cargar Notas en Lote (Opcional)',
              description: 'También puedes cargar notas para todos los estudiantes de una actividad en un solo paso.',
              side: 'left',
              align: 'center'
            }
          }
        ]
      });

      tour.drive();
    } catch (e) {
      console.error('No fue posible iniciar el tour:', e);
      alert('No fue posible iniciar la guía en esta vista.');
    }
  };

  const [asignacion, setAsignacion] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [profesor, setProfesor] = useState('No asignado');
  const [periodo, setPeriodo] = useState('No especificado');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actividadesVisible, setActividadesVisible] = useState(true); // Estado para controlar la visibilidad de la tabla
  const [momentoActivo, setMomentoActivo] = useState(1); // Estado para controlar qué momento se muestra (1, 2, 3 o 4)
  const [momentosBloqueados, setMomentosBloqueados] = useState({1: false, 2: false, 3: false, 4: false}); // Estado para controlar qué momentos están bloqueados
  const [puntosAdicionales, setPuntosAdicionales] = useState({}); // Estado para los puntos adicionales por alumno
  const [guardandoPuntos, setGuardandoPuntos] = useState(false);
  const [mensajePuntos, setMensajePuntos] = useState({ texto: '', tipo: '' });
  const [puntosAdicionalesResumen, setPuntosAdicionalesResumen] = useState({});
  
  // Estados para puntos extras por momento
  const [puntosMomento1, setPuntosMomento1] = useState({}); // Estado para puntos extras por momento 1
  const [puntosMomento2, setPuntosMomento2] = useState({}); // Estado para puntos extras por momento 2
  const [puntosMomento3, setPuntosMomento3] = useState({}); // Estado para puntos extras por momento 3
  const [puntosMomento4, setPuntosMomento4] = useState({}); // Estado para puntos extras por momento 4
  const [guardandoPuntosMomento, setGuardandoPuntosMomento] = useState(false); // Estado para guardar puntos extras por momento
  const [mensajePuntosMomento, setMensajePuntosMomento] = useState(null); // Estado para mensaje de puntos extras por momento
  const [mensajePromedios, setMensajePromedios] = useState({ texto: '', tipo: '' }); // Estado para mensaje de puntos extras por momento
  const [guardandoPromedios, setGuardandoPromedios] = useState(false); // Estado para controlar si se están guardando los promedios
  
  // Estado para previsualización de notas
  const [showPreviewNotas, setShowPreviewNotas] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  
  // Referencia para imprimir el reporte
  const reportRef = useRef(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Estado para manejar las observaciones
  const [observaciones, setObservaciones] = useState('');
  
  // Estados para manejar la subida de imágenes
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  
  // Función para manejar la selección de imágenes
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenSeleccionada(file);
      const fileReader = new FileReader();
      fileReader.onload = (e) => setPreviewUrl(e.target.result);
      fileReader.readAsDataURL(file);
    }
  };
  
  // Función para convertir la imagen a base64
  const convertirImagenABase64 = async () => {
    if (!imagenSeleccionada) return null;
    
    setSubiendoImagen(true);
    try {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        
        fileReader.onload = () => {
          const base64String = fileReader.result;
          console.log('Imagen convertida a base64 exitosamente');
          resolve(base64String);
        };
        
        fileReader.onerror = () => {
          console.error('Error al convertir la imagen a base64');
          reject(new Error('Error al convertir la imagen a base64'));
        };
        
        fileReader.readAsDataURL(imagenSeleccionada);
      });
    } catch (error) {
      console.error('Error al convertir la imagen a base64:', error);
      alert('Error al convertir la imagen: ' + error.message);
      return null;
    } finally {
      setSubiendoImagen(false);
    }
  };
  
  // Estados para manejar la visualización de evidencias
  const [modalEvidencia, setModalEvidencia] = useState({
    visible: false,
    url: '',
    titulo: ''
  });
  
  // Estado para controlar el modal de observaciones
  const [modalObservaciones, setModalObservaciones] = useState({
    visible: false,
    contenido: '',
    titulo: ''
  });

  // Función para mostrar observaciones en un modal
  const mostrarObservaciones = (titulo, contenido) => {
    setModalObservaciones({
      visible: true,
      titulo,
      contenido
    });
  };
  
  // Función para cerrar el modal de observaciones
  const cerrarModalObservaciones = () => {
    setModalObservaciones({
      visible: false,
      titulo: '',
      contenido: ''
    });
  };
  
  // Función para mostrar la evidencia en un modal
  const mostrarEvidencia = (evidencia, titulo) => {
    if (evidencia) {
      // Verificar si es una imagen en base64 o una URL
      let processedUrl = evidencia;
      
      if (evidencia.startsWith('data:image/')) {
        // Es una imagen en base64, usar directamente
        processedUrl = evidencia;
        console.log('Mostrando evidencia en base64');
      } else {
        // Es una URL, procesar como antes
        if (!evidencia.startsWith('http')) {
          // Eliminar cualquier 'uploads/' duplicado al inicio
          if (evidencia.startsWith('uploads/')) {
            processedUrl = `/${evidencia}`;
          } else if (evidencia.startsWith('/uploads/')) {
            processedUrl = evidencia;
          } else {
            processedUrl = evidencia.startsWith('/') ? evidencia : `/${evidencia}`;
          }
        }
        console.log('Mostrando evidencia con URL original:', evidencia);
        console.log('URL procesada:', processedUrl);
      }
      
      setModalEvidencia({
        visible: true,
        url: processedUrl,
        titulo,
        originalUrl: evidencia // Guardar la evidencia original para referencia
      });
    } else {
      alert('No hay evidencia disponible para esta calificación');
    }
  };
  
  // Función para cerrar el modal de evidencia
  const cerrarModalEvidencia = () => {
    setModalEvidencia({
      visible: false,
      url: '',
      titulo: ''
    });
  };

  // Función para manejar cambios en los puntos adicionales
  const handlePuntosChange = (alumnoId, valor) => {
    console.log('Frontend - handlePuntosChange llamado con:', { alumnoId, valor });
    
    // Limitar entre 0 y 2 puntos
    const puntosValidos = Math.min(Math.max(0, parseInt(valor) || 0), 2);
    console.log('Frontend - Puntos válidos calculados:', puntosValidos);
    
    console.log('Frontend - Estado actual de puntosAdicionales:', puntosAdicionales);
    
    setPuntosAdicionales(prev => {
      const nuevoEstado = {
        ...prev,
        [alumnoId]: puntosValidos
      };
      console.log('Frontend - Nuevo estado de puntosAdicionales:', nuevoEstado);
      return nuevoEstado;
    });
  };
  
  // Funciones para manejar cambios en los puntos extras por momento
  const handlePuntosMomentoChange = (momento, alumnoId, valor) => {
    // Asegurarse de que el ID del alumno sea un string para consistencia
    const alumnoIdStr = alumnoId.toString();
    console.log(`Frontend - handlePuntosMomentoChange llamado para ${momento}:`, { alumnoId: alumnoIdStr, valor });
    
    // Limitar entre 0 y 2 puntos
    const valorNumerico = parseFloat(valor) || 0;
    const valorLimitado = Math.min(2, Math.max(0, valorNumerico));
    
    // Actualizar el estado específico del momento
    switch(momento) {
      case 'momento1':
        setPuntosMomento1(prev => {
          const nuevoEstado = {
            ...prev,
            [alumnoIdStr]: valorLimitado
          };
          console.log('NUEVO ESTADO puntosMomento1:', nuevoEstado);
          return nuevoEstado;
        });
        break;
      case 'momento2':
        setPuntosMomento2(prev => {
          const nuevoEstado = {
            ...prev,
            [alumnoIdStr]: valorLimitado
          };
          console.log('NUEVO ESTADO puntosMomento2:', nuevoEstado);
          return nuevoEstado;
        });
        break;
      case 'momento3':
        setPuntosMomento3(prev => {
          const nuevoEstado = {
            ...prev,
            [alumnoIdStr]: valorLimitado
          };
          console.log('NUEVO ESTADO puntosMomento3:', nuevoEstado);
          return nuevoEstado;
        });
        break;
      default:
        console.error(`Momento inválido: ${momento}`);
        return;
    }
    
    // Actualizar también la estructura asignacion.puntosPorMomento para mantener sincronización
    if (asignacion) {
      setAsignacion(prevAsignacion => {
        // Crear una copia profunda de la asignación
        const nuevaAsignacion = JSON.parse(JSON.stringify(prevAsignacion));
        
        // Asegurarse de que existe la estructura puntosPorMomento
        if (!nuevaAsignacion.puntosPorMomento) {
          nuevaAsignacion.puntosPorMomento = {
            momento1: [],
            momento2: [],
            momento3: []
          };
        }
        
        // Asegurarse de que existe el array para este momento
        if (!nuevaAsignacion.puntosPorMomento[momento] || !Array.isArray(nuevaAsignacion.puntosPorMomento[momento])) {
          nuevaAsignacion.puntosPorMomento[momento] = [];
        }
        
        // Buscar si ya existe un registro para este alumno
        const puntoIndex = nuevaAsignacion.puntosPorMomento[momento].findIndex(
          p => p.alumnoId === alumnoIdStr || (p.alumnoId && p.alumnoId.toString() === alumnoIdStr)
        );
        
        if (puntoIndex >= 0) {
          // Actualizar el registro existente
          nuevaAsignacion.puntosPorMomento[momento][puntoIndex].puntos = valorLimitado;
          nuevaAsignacion.puntosPorMomento[momento][puntoIndex].fechaActualizacion = new Date();
        } else {
          // Agregar un nuevo registro
          nuevaAsignacion.puntosPorMomento[momento].push({
            alumnoId: alumnoIdStr,
            puntos: valorLimitado,
            fechaActualizacion: new Date()
          });
        }
        
        console.log('Asignación actualizada en tiempo real:', nuevaAsignacion);
        return nuevaAsignacion;
      });
    }
    
    // También actualizar puntosAdicionalesResumen para mantener compatibilidad con el código existente
    // Esto es importante para que la interfaz muestre correctamente los puntos
    setPuntosAdicionalesResumen(prev => {
      const nuevoEstado = {
        ...prev,
        [alumnoIdStr]: valorLimitado
      };
      console.log('NUEVO ESTADO puntosAdicionalesResumen:', nuevoEstado);
      return nuevoEstado;
    });
  };
  
  // Función para guardar los puntos extras por momento
  const guardarPuntosMomento = async (momento) => {
    try {
      console.log('🔵 INICIO - Guardando puntos extras para momento:', momento);
      console.log('🔵 esControl():', esControl());
      
      setGuardandoPuntosMomento(true);
      setMensajePuntosMomento(null);
      
      console.log('🔵 Iniciando guardado de puntos extras para momento:', momento);
      
      // Verificar que aulaId y materiaId estén definidos
      if (!aulaId || !materiaId) {
        const errorMsg = 'ID de aula o materia no disponible';
        console.error('🔴 ERROR:', errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('🔵 Verificando parámetros:', { aulaId, materiaId, momento });
      
      // Seleccionar el estado correcto según el momento
      let puntosPorAlumno;
      
      switch(momento) {
        case 'momento1':
          puntosPorAlumno = puntosMomento1;
          console.log('🔵 Puntos del momento 1:', puntosPorAlumno);
          break;
        case 'momento2':
          puntosPorAlumno = puntosMomento2;
          console.log('🔵 Puntos del momento 2:', puntosPorAlumno);
          break;
        case 'momento3':
          puntosPorAlumno = puntosMomento3;
          console.log('🔵 Puntos del momento 3:', puntosPorAlumno);
          break;
        default:
          const errorMsg = 'Momento inválido';
          console.error('🔴 ERROR:', errorMsg);
          alert(errorMsg);
          throw new Error(errorMsg);
      }
      
      console.log(`🔵 Frontend - Guardando puntos extras para ${momento}:`, puntosPorAlumno);
      console.log(`🔵 Número de alumnos con puntos:`, Object.keys(puntosPorAlumno).length);
      
      // Guardar los puntos para cada alumno
      const promesasGuardado = Object.entries(puntosPorAlumno).map(async ([alumnoId, puntos]) => {
        // Asegurarse de que el ID del alumno sea un string para consistencia
        const alumnoIdStr = alumnoId.toString();
        
        // Validar que puntos sea un número
        const puntosNum = Number(puntos);
        if (isNaN(puntosNum)) {
          console.error(`Puntos inválidos para alumno ${alumnoIdStr}: ${puntos}`);
          return { success: false, message: `Puntos inválidos para alumno ${alumnoIdStr}` };
        }
        
        console.log(`🔵 Frontend - Guardando punto para alumno ID: ${alumnoIdStr}, puntos: ${puntosNum}`);
        
        // Verificar que todos los datos estén presentes y sean válidos
        if (!aulaId || !materiaId || !momento || !alumnoIdStr) {
          console.error('🔴 Datos incompletos para guardar puntos extras:', { aulaId, materiaId, momento, alumnoIdStr });
          return { success: false, message: 'Datos incompletos para guardar puntos extras' };
        }
        
        console.log('🔵 Datos a enviar a la API:', {
          puntos: puntosNum,
          aulaId,
          materiaId,
          momento,
          alumnoId: alumnoIdStr
        });
        
        try {
          console.log('🔵 Enviando petición POST a /api/calificaciones/puntosmomento...');
          const response = await fetch('/api/calificaciones/puntosmomento', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              puntos: puntosNum,
              aulaId,
              materiaId,
              momento,
              alumnoId: alumnoIdStr
            })
          });
          
          console.log('🔵 Respuesta recibida, status:', response.status);
          
          if (!response.ok) {
            const error = await response.json();
            console.error('🔴 Error en respuesta:', error);
            console.error('🔴 Status:', response.status);
            console.error('🔴 Message:', error.message);
            return { success: false, message: error.message || 'Error al guardar puntos extras' };
          }
          
          const resultado = await response.json();
          console.log(`✅ Resultado guardado para alumno ${alumnoIdStr}:`, resultado);
          return resultado;
        } catch (error) {
          console.error(`🔴 Error al guardar puntos para alumno ${alumnoIdStr}:`, error);
          console.error('🔴 Tipo de error:', error.name);
          console.error('🔴 Mensaje:', error.message);
          console.error('🔴 Stack:', error.stack);
          return { success: false, message: `Error: ${error.message}` };
        }
      });
      
      // Usar Promise.allSettled en lugar de Promise.all para manejar mejor los errores
      const resultados = await Promise.allSettled(promesasGuardado);
      console.log('🔵 Resultados de guardado de puntos extras:', resultados);
      
      // Contar éxitos y errores
      const exitos = resultados.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const errores = resultados.filter(r => r.status === 'rejected' || !r.value?.success).length;
      
      console.log(`🔵 Resumen: ${exitos} éxitos, ${errores} errores`);
      
      if (errores > 0) {
        const errorDetails = resultados.filter(r => r.status === 'rejected' || !r.value?.success);
        console.error('🔴 Errores al guardar puntos extras:', errorDetails);
        const mensajeError = `Guardado parcial: ${exitos} éxitos, ${errores} errores`;
        console.error('🔴', mensajeError);
        alert(mensajeError + '\n\nMira la consola para más detalles.');
        setMensajePuntosMomento({
          tipo: 'error',
          texto: mensajeError
        });
      } else {
        const mensajeExito = `Puntos extras para ${momento} guardados correctamente (${exitos} alumnos)`;
        console.log('✅', mensajeExito);
        alert(mensajeExito);
        setMensajePuntosMomento({
          tipo: 'success',
          texto: mensajeExito
        });
      }
      
      // Recargar los datos para asegurar que los puntos extras se muestren correctamente
      console.log('Recargando datos después de guardar puntos extras...');
      await cargarPuntosMomento(momento);
      
      // Actualizar también puntosAdicionalesResumen si estamos en el momento activo
      const momentoNum = parseInt(momento.replace('momento', ''));
      if (momentoActivo === momentoNum) {
        // Seleccionar el estado correcto según el momento
        let puntosActualizados;
        switch(momento) {
          case 'momento1':
            puntosActualizados = {...puntosMomento1};
            break;
          case 'momento2':
            puntosActualizados = {...puntosMomento2};
            break;
          case 'momento3':
            puntosActualizados = {...puntosMomento3};
            break;
        }
        console.log(`Actualizando puntosAdicionalesResumen con datos de ${momento}:`, puntosActualizados);
        setPuntosAdicionalesResumen(puntosActualizados);
      }
      
      // Actualizar la asignación en memoria para reflejar los cambios sin recargar
      if (asignacion) {
        const asignacionActualizada = JSON.parse(JSON.stringify(asignacion));
        
        // Asegurarse de que existe la estructura puntosPorMomento
        if (!asignacionActualizada.puntosPorMomento) {
          asignacionActualizada.puntosPorMomento = {
            momento1: [],
            momento2: [],
            momento3: []
          };
        }
        
        // Asegurarse de que existe el array para este momento
        if (!asignacionActualizada.puntosPorMomento[momento] || !Array.isArray(asignacionActualizada.puntosPorMomento[momento])) {
          asignacionActualizada.puntosPorMomento[momento] = [];
        }
        
        // Actualizar los puntos para cada alumno en la estructura
        Object.entries(puntosPorAlumno).forEach(([alumnoId, puntos]) => {
          const alumnoIdStr = alumnoId.toString();
          const puntosNum = Number(puntos);
          
          console.log(`Actualizando puntos para alumno ${alumnoIdStr} en ${momento}: ${puntosNum}`);
          
          // Buscar si ya existe un registro para este alumno
          const puntoIndex = asignacionActualizada.puntosPorMomento[momento].findIndex(
            p => p.alumnoId === alumnoIdStr || (p.alumnoId && p.alumnoId.toString() === alumnoIdStr)
          );
          
          if (puntoIndex >= 0) {
            // Actualizar el registro existente
            asignacionActualizada.puntosPorMomento[momento][puntoIndex].puntos = puntosNum;
            asignacionActualizada.puntosPorMomento[momento][puntoIndex].fechaActualizacion = new Date();
          } else {
            // Agregar un nuevo registro
            asignacionActualizada.puntosPorMomento[momento].push({
              alumnoId: alumnoIdStr,
              puntos: puntosNum,
              fechaActualizacion: new Date()
            });
          }
        });
        
        console.log('Asignación actualizada con nuevos puntos:', asignacionActualizada.puntosPorMomento);
        
        // Actualizar el estado de la asignación
        setAsignacion(asignacionActualizada);
        
        // Crear nuevos objetos para los estados locales
        const nuevosPuntosMomento1 = {...puntosMomento1};
        const nuevosPuntosMomento2 = {...puntosMomento2};
        const nuevosPuntosMomento3 = {...puntosMomento3};
        
        // Actualizar el estado local correspondiente al momento actual
        if (momento === 'momento1') {
          Object.entries(puntosPorAlumno).forEach(([alumnoId, puntos]) => {
            nuevosPuntosMomento1[alumnoId] = Number(puntos);
          });
          setPuntosMomento1(nuevosPuntosMomento1);
          // Actualizar también puntosAdicionalesResumen si estamos en el momento 1
          if (momentoActivo === 1) {
            setPuntosAdicionalesResumen({...nuevosPuntosMomento1});
          }
        } else if (momento === 'momento2') {
          Object.entries(puntosPorAlumno).forEach(([alumnoId, puntos]) => {
            nuevosPuntosMomento2[alumnoId] = Number(puntos);
          });
          setPuntosMomento2(nuevosPuntosMomento2);
          // Actualizar también puntosAdicionalesResumen si estamos en el momento 2
          if (momentoActivo === 2) {
            setPuntosAdicionalesResumen({...nuevosPuntosMomento2});
          }
        } else if (momento === 'momento3') {
          Object.entries(puntosPorAlumno).forEach(([alumnoId, puntos]) => {
            nuevosPuntosMomento3[alumnoId] = Number(puntos);
          });
          setPuntosMomento3(nuevosPuntosMomento3);
          // Actualizar también puntosAdicionalesResumen si estamos en el momento 3
          if (momentoActivo === 3) {
            setPuntosAdicionalesResumen({...nuevosPuntosMomento3});
          }
        }
        
        // Forzar re-renderizado para asegurar que la UI se actualice
        setTimeout(() => {
          console.log('Estados actualizados después de guardar:');
          console.log('puntosMomento1:', nuevosPuntosMomento1);
          console.log('puntosMomento2:', nuevosPuntosMomento2);
          console.log('puntosMomento3:', nuevosPuntosMomento3);
          console.log('puntosAdicionalesResumen:', puntosAdicionalesResumen);
        }, 100);
      }
      
      setMensajePuntosMomento({
        tipo: 'success',
        texto: `Puntos extras para ${momento.replace('momento', 'Momento ')} guardados correctamente`
      });
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMensajePuntosMomento(null);
      }, 3000);
      
    } catch (error) {
      console.error('🔴 ERROR GENERAL al guardar puntos extras:', error);
      console.error('🔴 Tipo:', error.name);
      console.error('🔴 Mensaje:', error.message);
      console.error('🔴 Stack:', error.stack);
      const mensajeError = 'Error al guardar los puntos extras: ' + error.message;
      alert(mensajeError);
      setMensajePuntosMomento({
        tipo: 'error',
        texto: `Error al guardar: ${error.message}`
      });
    } finally {
      // Siempre desactivar el indicador de carga, incluso cuando hay errores
      setGuardandoPuntosMomento(false);
      console.log('Finalizado el proceso de guardado de puntos extras');
    }
  };
  
  // Función para cargar los puntos extras por momento
  const cargarPuntosMomento = async (momento) => {
    if (!aulaId || !materiaId) {
      console.error('No se puede cargar puntos extras: falta aulaId o materiaId');
      return;
    }
    
    try {
      console.log(`Frontend - Cargando puntos extras para ${momento}`);
      
      const response = await fetch(`/api/calificaciones/puntosmomento?aulaId=${aulaId}&materiaId=${materiaId}&momento=${momento}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar puntos extras: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Frontend - Datos recibidos para ${momento}:`, data);
      
      // Inicializar todos los alumnos con 0 puntos
      const puntosCompletos = {};
      if (alumnos && alumnos.length > 0) {
        alumnos.forEach(alumno => {
          const alumnoId = alumno._id || alumno.id;
          if (alumnoId) {
            const alumnoIdStr = alumnoId.toString();
            puntosCompletos[alumnoIdStr] = 0; // Inicializar con 0 puntos
          }
        });
      }
      
      // Procesar los datos recibidos (ahora la API devuelve directamente un array)
      if (Array.isArray(data)) {
        data.forEach(punto => {
          if (punto.alumnoId) {
            // Asegurarse de que estamos usando el mismo formato de ID en todas partes
            // Convertir el ID a string para garantizar consistencia
            const alumnoIdStr = punto.alumnoId.toString();
            console.log(`Frontend - Procesando punto para alumno ID: ${alumnoIdStr}, puntos: ${punto.puntos}`);
            // Usar el valor de puntos del servidor, o 0 si no está definido
            puntosCompletos[alumnoIdStr] = typeof punto.puntos === 'number' ? punto.puntos : 0;
          }
        });
      }
      
      // Imprimir todos los IDs de alumnos para depuración
      console.log('Frontend - IDs de alumnos disponibles:', Object.keys(puntosCompletos));
      console.log('Frontend - Valores de puntos cargados:', Object.values(puntosCompletos));
      
      // Actualizar el estado correspondiente
      switch(momento) {
        case 'momento1':
          console.log('Actualizando estado puntosMomento1 con:', puntosCompletos);
          setPuntosMomento1({...puntosCompletos});
          // Si estamos en el momento 1, actualizar también puntosAdicionalesResumen
          if (momentoActivo === 1) {
            setPuntosAdicionalesResumen({...puntosCompletos});
          }
          break;
        case 'momento2':
          console.log('Actualizando estado puntosMomento2 con:', puntosCompletos);
          setPuntosMomento2({...puntosCompletos});
          // Si estamos en el momento 2, actualizar también puntosAdicionalesResumen
          if (momentoActivo === 2) {
            setPuntosAdicionalesResumen({...puntosCompletos});
          }
          break;
        case 'momento3':
          console.log('Actualizando estado puntosMomento3 con:', puntosCompletos);
          setPuntosMomento3({...puntosCompletos});
          // Si estamos en el momento 3, actualizar también puntosAdicionalesResumen
          if (momentoActivo === 3) {
            setPuntosAdicionalesResumen({...puntosCompletos});
          }
          break;
        default:
          console.error('Momento inválido:', momento);
      }
      
      console.log(`Frontend - Puntos extras para ${momento} cargados:`, puntosCompletos);
      
      // Forzar actualización de la UI después de un breve retraso
      setTimeout(() => {
        console.log(`Verificación de estado actualizado para ${momento}:`, 
          momento === 'momento1' ? puntosMomento1 : 
          momento === 'momento2' ? puntosMomento2 : 
          momento === 'momento3' ? puntosMomento3 : {});
      }, 500);
      
    } catch (error) {
      console.error(`Error al cargar puntos extras para ${momento}:`, error);
    }
  };


  // Estados para el formulario de actividades
  const [showActividadForm, setShowActividadForm] = useState(false);
  const [actividadFormData, setActividadFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    porcentaje: 100,
    momento: 1, // Por defecto, primer momento
    modoEdicion: false,
    actividadId: null
  });
  
  // Estado para manejar la selección múltiple de actividades
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState({});
  
  // Estados para el formulario de calificaciones
  const [showCalificacionForm, setShowCalificacionForm] = useState(false);
  const [calificacionFormData, setCalificacionFormData] = useState({
    actividadId: '',
    alumnoId: '',
    nota: '',
    notaAlfabetica: '',
    tipoCalificacion: 'numerica',
    observaciones: '',
    evidencia: '',
    modoEdicion: false,
    calificacionId: ''
  });
  
  // Estados para calificación por lote
  const [showBatchCalificacionForm, setShowBatchCalificacionForm] = useState(false);
  const [batchCalificacionData, setBatchCalificacionData] = useState({
    actividadId: '',
    tipoCalificacion: 'numerica',
    calificaciones: [] // Array de {alumnoId, nota, notaAlfabetica, observaciones, evidencia}
  });
  
  // Estado para manejar las observaciones
  // Ya incluido en calificacionFormData
  
  // Cargar datos del aula y la materia
  // Función para cargar los datos del aula
  const loadAulaData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Cargando datos del aula:', aulaId);
      
      // Obtener datos del aula
      const aulaResponse = await fetch(`/api/aulas/${aulaId}`);
      const aulaData = await aulaResponse.json();

      console.log('Respuesta del servidor:', aulaData);

      if (!aulaResponse.ok) {
        throw new Error(aulaData.message || 'Error al cargar los datos del aula');
      }

      if (!aulaData.success) {
        throw new Error(aulaData.message || 'Error al cargar los datos del aula');
      }

      if (!aulaData.data) {
        throw new Error('No se recibieron datos del aula');
      }

      // Asegurarnos de que asignaciones sea un array
      if (!Array.isArray(aulaData.data.asignaciones)) {
        console.log('Asignaciones no es un array:', aulaData.data.asignaciones);
        aulaData.data.asignaciones = [];
      }

      console.log('Buscando materia con código:', materiaId);
      console.log('Asignaciones disponibles:', aulaData.data.asignaciones);

      console.log('Datos del aula:', JSON.stringify(aulaData.data, null, 2));
      console.log('Buscando materia con ID:', materiaId);

      // Buscar la materia dentro de las asignaciones
      const asignacion = aulaData.data.asignaciones.find(asig => {
        console.log('Revisando asignación:', JSON.stringify(asig, null, 2));
        return asig.materia && asig.materia.id === materiaId;
      });

      if (!asignacion) {
        const materiasDisponibles = aulaData.data.asignaciones
          .filter(a => a.materia)
          .map(a => `${a.materia.id} (${a.materia.nombre})`);
        console.log('Asignación no encontrada. Materias disponibles:', materiasDisponibles);
        throw new Error('No se encontró la materia en el aula');
      }
      
      console.log('Asignación encontrada:', JSON.stringify(asignacion, null, 2));

      console.log('Asignación encontrada:', asignacion);

      // Establecer los datos del aula y materia
      const actividadesConCalificaciones = asignacion.actividades || [];
      console.log('Actividades cargadas:', actividadesConCalificaciones);
      
      setAsignacion({
        aula: aulaData.data,
        materia: asignacion.materia,
        profesor: asignacion.profesor,
        periodo: aulaData.data.periodo,
        actividades: actividadesConCalificaciones
      });

      // Establecer la lista de alumnos ordenada por cédula ascendente
      console.log('🔥 INICIANDO ORDENAMIENTO DE ALUMNOS POR _ID');
      console.log('🔥 Alumnos con _id:', (aulaData.data.alumnos || []).map(a => ({ 
        nombre: a.nombre, 
        _id: a._id,
        materiasAsignadas: a.materiasAsignadas
      })));
      
      const normalizeMateriasAsignadas = (materias) => {
        if (!materias) return [];
        const baseArray = Array.isArray(materias)
          ? materias
          : typeof materias === 'object'
            ? Object.values(materias)
            : [];
        return baseArray.map((item) => {
          if (!item) return '';
          if (typeof item === 'object') {
            return String(item.id || item.codigo || item.value || '').trim();
        }
          return String(item).trim();
        }).filter(Boolean);
      };

      // Filtrar alumnos: solo los que tienen esta materia asignada
      const alumnosFiltradosInicial = (aulaData.data.alumnos || []).filter(alumno => {
        const alumnoId = alumno._id?.toString() || alumno.id?.toString() || '';
        const materiasAsignadas = normalizeMateriasAsignadas(alumno.materiasAsignadas);
        
        // Si el alumno no tiene materiasAsignadas definidas o tiene array vacío, asume que ve todas (compatibilidad hacia atrás)
        if (!materiasAsignadas.length) {
          console.log(`✅ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): Sin materiasAsignadas o array vacío → VER TODAS`);
          return true; // Por defecto para estudiantes antiguos o sin restricciones, ver todas las materias
        }
        
        // Si tiene materias asignadas, verificar si la materia actual está en la lista
        // Normalizar IDs para comparación (convertir a string y trim)
        const materiaIdNormalizado = String(materiaId || '').trim().toLowerCase();
        const materiaCodigoNormalizado = String(asignacion?.materia?.codigo || '').trim().toLowerCase();
        const tieneMateria = materiasAsignadas.some(matId => {
          const matIdNormalizado = String(matId || '').trim().toLowerCase();
          return (
            matIdNormalizado === materiaIdNormalizado ||
            (!!materiaCodigoNormalizado && matIdNormalizado === materiaCodigoNormalizado)
          );
        });
        
        if (tieneMateria) {
          console.log(`✅ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): Tiene materia ${materiaIdNormalizado} asignada → VER`);
        } else {
          console.log(`❌ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): NO tiene materia ${materiaIdNormalizado} (tiene: ${materiasAsignadas.join(', ')}) → NO VER`);
        }
        
        return tieneMateria;
      });
      
      console.log(`📚 RESUMEN - Filtrando alumnos para materia ${materiaId} (loadAulaData):`, {
        total: aulaData.data.alumnos?.length || 0,
        filtrados: alumnosFiltradosInicial.length,
        excluidos: (aulaData.data.alumnos?.length || 0) - alumnosFiltradosInicial.length
      });
      
      // Obtener las cédulas reales de cada alumno usando su _id
      const alumnosConCedulas = await Promise.all(
        alumnosFiltradosInicial.map(async (alumno) => {
          // Si ya viene la cédula en el alumno embebido, úsala sin llamar a la API
          if (alumno.cedula || alumno.idU) {
            return { ...alumno, cedulaReal: alumno.idU || alumno.cedula };
          }
          try {
            // Primero intentar por el _id embebido (puede no coincidir con Estudiante._id)
            const response = await fetch(`/api/estudiantes/${alumno._id}`);
            if (response.ok) {
              const data = await response.json();
              const estudiante = data.data;
              console.log(`🔥 Estudiante ${alumno._id}: cédula = ${estudiante.idU || estudiante.cedula}`);
              return {
                ...alumno,
                cedulaReal: estudiante.idU || estudiante.cedula || 'N/P'
              };
            }
            // Si falla y tenemos posible cédula, intentar la búsqueda por cédula
            if (alumno.cedula) {
              const resp2 = await fetch(`/api/estudiantes/buscar?cedula=${encodeURIComponent(alumno.cedula)}`);
              if (resp2.ok) {
                const data2 = await resp2.json();
                const est = data2.estudiante || {};
                return { ...alumno, cedulaReal: est.cedula || alumno.cedula || 'N/P' };
              }
            }
            console.log(`🔥 No se pudo resolver cédula para alumno ${alumno._id}`);
            return { ...alumno, cedulaReal: 'N/P' };
          } catch (error) {
            console.log(`🔥 Error al obtener estudiante ${alumno._id}:`, error);
            return { ...alumno, cedulaReal: 'N/P' };
          }
        })
      );
      
      // Ordenar por cédula real
      const alumnosOrdenados = alumnosConCedulas.sort((a, b) => {
        const cedulaA = String(a.cedulaReal || '').trim();
        const cedulaB = String(b.cedulaReal || '').trim();
        
        console.log('🔥 Ordenando por cédula real:', cedulaA, 'vs', cedulaB);
        
        // Casos especiales: 'N/P' o vacío van al final
        if (cedulaA === 'N/P' || cedulaA === '' || cedulaA === 'undefined') return 1;
        if (cedulaB === 'N/P' || cedulaB === '' || cedulaB === 'undefined') return -1;
        
        // Convertir a números para comparación correcta de cédulas venezolanas
        const numA = parseInt(cedulaA.replace(/\D/g, ''), 10);
        const numB = parseInt(cedulaB.replace(/\D/g, ''), 10);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          console.log('🔥 Comparando números:', numA, 'vs', numB, '=', numA - numB);
          return numA - numB;
        }
        
        // Comparación alfabética como fallback
        return cedulaA.localeCompare(cedulaB);
      });
      
      console.log('🔥 Alumnos DESPUÉS de ordenar por cédula real:', alumnosOrdenados.map(a => ({ 
        nombre: a.nombre, 
        _id: a._id,
        cedulaReal: a.cedulaReal 
      })));
      setAlumnos(alumnosOrdenados);

      // Establecer las actividades
      setActividades(actividadesConCalificaciones);
      
      // Verificar las calificaciones cargadas y asegurarse de que las evidencias se carguen correctamente
      actividadesConCalificaciones.forEach(actividad => {
        console.log(`Calificaciones para actividad ${actividad.nombre}:`, actividad.calificaciones);
        
        // Verificar si hay calificaciones con evidencias
        if (actividad.calificaciones && actividad.calificaciones.length > 0) {
          actividad.calificaciones.forEach(calificacion => {
            if (calificacion.evidencia) {
              console.log(`Evidencia encontrada para alumno ${calificacion.alumnoId}:`, calificacion.evidencia);
            }
          });
        }
      });

      // Actualizar el estado del profesor y periodo
      if (asignacion.profesor) {
        console.log('Datos del profesor:', asignacion.profesor);
        setProfesor(`${asignacion.profesor.nombre} ${asignacion.profesor.apellido || ''}`);
      } else {
        setProfesor('No asignado');
      }
      setPeriodo(aulaData.data.periodo || 'No especificado');
      
      console.log('Datos del profesor:', asignacion.profesor);
      console.log('Datos cargados exitosamente');
      
      // Cargar los puntos extras para todos los momentos
      console.log('Cargando puntos extras para todos los momentos...');
      await cargarPuntosMomento('momento1');
      await cargarPuntosMomento('momento2');
      await cargarPuntosMomento('momento3');
      
      // Actualizar puntosAdicionalesResumen según el momento activo
      switch(momentoActivo) {
        case 1:
          setPuntosAdicionalesResumen({...puntosMomento1});
          break;
        case 2:
          setPuntosAdicionalesResumen({...puntosMomento2});
          break;
        case 3:
          setPuntosAdicionalesResumen({...puntosMomento3});
          break;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error en loadAulaData:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aulaId && materiaId) {
      loadAulaData();
      
      // Cargar el estado de bloqueo desde localStorage
      try {
        if (typeof window !== 'undefined') {
          const estadoGuardado = JSON.parse(localStorage.getItem(`bloqueoMomentos_${aulaId}_${materiaId}`) || '{}');
          
          // Si hay estado guardado, actualizarlo
          if (Object.keys(estadoGuardado).length > 0) {
            setMomentosBloqueados(prev => ({
              ...prev,
              ...estadoGuardado
            }));
            console.log('Estado de bloqueo cargado desde localStorage:', estadoGuardado);
          }
        }
      } catch (error) {
        console.error('Error al cargar el estado de bloqueo desde localStorage:', error);
      }
    } else {
      setError('No se proporcionaron los IDs de aula y materia válidos');
      setLoading(false);
    }
  }, [aulaId, materiaId]);
  
  // Abrir modal de previsualización de notas para el momento activo
  const openPreviewNotas = () => {
    try {
      const momentoSel = momentoActivo; // 1,2,3
      const actividadesMomento = (actividades || []).filter(act => {
        const m = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
        return m === momentoSel;
      });
      const rows = [];
      (alumnos || []).forEach(al => {
        actividadesMomento.forEach(act => {
          const cal = (act.calificaciones || []).find(c => {
            const id = typeof c.alumnoId === 'object' && c.alumnoId? c.alumnoId.toString() : String(c.alumnoId);
            return id === String(al._id);
          });
          const tipo = cal?.tipoCalificacion || (cal?.notaAlfabetica ? 'alfabetica' : 'numerica');
          let valor = '-';
          if (tipo === 'np') {
            valor = 'NP';
          } else if (tipo === 'inasistente') {
            valor = 'I';
          } else if (tipo === 'alfabetica') {
            valor = cal?.notaAlfabetica || '-';
          } else {
            valor = cal?.nota ?? '-';
          }
          rows.push({
            alumno: `${al.nombre || ''} ${al.apellido || ''}`.trim(),
            momento: momentoSel,
            actividad: act.nombre || '',
            calificacion: valor
          });
        });
      });
      setPreviewRows(rows);
      setShowPreviewNotas(true);
    } catch (e) {
      console.error('Error al preparar previsualización de notas:', e);
      setPreviewRows([]);
      setShowPreviewNotas(true);
    }
  };
  
  const closePreviewNotas = () => setShowPreviewNotas(false);

  // Función para calcular el promedio de un alumno para un momento específico
  const calcularPromedioMomento = (alumnoId, momentoNum) => {
    // Filtrar actividades del momento
    const actividadesMomento = actividades.filter(act => {
      const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
      return momento === momentoNum;
    });

    // Obtener calificaciones del alumno junto con su porcentaje
    const registros = actividadesMomento.map(actividad => {
      const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumnoId);
      if (!calificacion) return null;
      // Si es NP o Inasistente, no se incluye en el promedio
      if (calificacion.tipoCalificacion === 'np' || calificacion.tipoCalificacion === 'inasistente') {
        return null;
      }
      const nota = calificacion.tipoCalificacion === 'alfabetica' 
        ? convertirLetraANota(calificacion.notaAlfabetica)
        : (calificacion.nota !== null && calificacion.nota !== undefined ? parseFloat(calificacion.nota) : null);
      const porcentaje = parseFloat(actividad.porcentaje) || 0;
      if (nota === null || isNaN(nota) || porcentaje === 0) return null;
      return { nota, porcentaje };
    }).filter(reg => reg !== null);
    
    if (registros.length === 0) return null;
    
    // Sumar directamente nota * porcentaje/100 de cada actividad
    const sumaPonderada = registros.reduce(
      (sum, reg) => sum + (reg.nota * (reg.porcentaje / 100)),
      0
    );
    const promedio = sumaPonderada;
    
    // Buscar si hay puntos adicionales para este alumno en este momento
    // Usar puntosAdicionalesResumen que contiene los puntos extras por alumno
    const puntosExtra = puntosAdicionalesResumen[alumnoId] || 0;
    console.log(`PUNTOS EXTRAS PARA ALUMNO ${alumnoId} en momento ${momento}:`, puntosExtra);
    console.log('ESTADO ACTUAL DE puntosAdicionalesResumen:', puntosAdicionalesResumen);
    
    // Calcular promedio final (con puntos adicionales, sin exceder 20)
    return Math.min(20, promedio + puntosExtra);
  };

  // Función para calcular el promedio total de un alumno (promedio de los tres momentos)
  const calcularPromedioTotal = (alumnoId) => {
    const promedioMomento1 = calcularPromedioMomento(alumnoId, 1) || 0;
    const promedioMomento2 = calcularPromedioMomento(alumnoId, 2) || 0;
    const promedioMomento3 = calcularPromedioMomento(alumnoId, 3) || 0;
    
    // Calcular promedio total (ponderado por igual entre los tres momentos)
    let cantidadMomentos = 0;
    let sumaPromedios = 0;
    
    if (promedioMomento1 > 0) {
      sumaPromedios += promedioMomento1;
      cantidadMomentos++;
    }
    
    if (promedioMomento2 > 0) {
      sumaPromedios += promedioMomento2;
      cantidadMomentos++;
    }
    
    if (promedioMomento3 > 0) {
      sumaPromedios += promedioMomento3;
      cantidadMomentos++;
    }
    
    return cantidadMomentos > 0 ? sumaPromedios / cantidadMomentos : null;
  };
  




  // Efecto para depurar las actividades cuando cambian
  useEffect(() => {
    if (actividades.length > 0) {
      console.log('Todas las actividades cargadas:', actividades);
      
      // Depurar actividades por momento
      const momento1 = actividades.filter(act => {
        const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
        return momento === 1 || momento === undefined || momento === null;
      });
      
      const momento2 = actividades.filter(act => {
        const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
        return momento === 2;
      });
      
      const momento3 = actividades.filter(act => {
        const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
        return momento === 3;
      });
      
      console.log('Actividades del primer momento:', momento1);
      console.log('Actividades del segundo momento:', momento2);
      console.log('Actividades del tercer momento:', momento3);
    }
  }, [actividades]);
  
  // Efecto para monitorear cambios en showCalificacionForm
  useEffect(() => {
    console.log('Estado showCalificacionForm actualizado:', showCalificacionForm);
  }, [showCalificacionForm]);

  // Función para generar planilla Excel por momento
  const generarPlanillaMomento = async (momento) => {
    try {
      console.log(`🔥 INICIANDO GENERACIÓN DE PLANILLA - Momento ${momento}`);
      console.log('🔥 Datos disponibles:', { asignacion, aulaId, materiaId });
      
      if (!asignacion || !aulaId || !materiaId) {
        console.error('🔥 ERROR: Faltan datos para generar planilla');
        alert('No hay datos suficientes para generar la planilla');
        return;
      }

      // Construir la URL del endpoint
      const params = new URLSearchParams();
      params.append('aulaId', aulaId);
      params.append('materiaId', materiaId);
      params.append('momento', momento.toString());
      
      const url = `/api/planilla-momento?${params.toString()}`;
      console.log('🔥 URL de planilla:', url);

      // Realizar la petición
      console.log('🔥 Realizando petición fetch...');
      const response = await fetch(url);
      console.log('🔥 Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔥 Error en respuesta:', errorText);
        throw new Error(`Error al generar planilla: ${response.statusText} - ${errorText}`);
      }

      // Descargar el archivo
      console.log('🔥 Convirtiendo respuesta a blob...');
      const blob = await response.blob();
      console.log('🔥 Blob creado, tamaño:', blob.size);
      
      // Crear nombre de archivo más simple
      const fileName = `Planilla_Momento${momento}_${new Date().toISOString().split('T')[0]}.xlsx`;
      console.log('🔥 Nombre de archivo:', fileName);
      
      // Método más robusto para descargar
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // Para Internet Explorer
        console.log('🔥 Usando método IE');
        window.navigator.msSaveOrOpenBlob(blob, fileName);
      } else {
        // Para otros navegadores
        console.log('🔥 Usando método estándar');
        const downloadUrl = window.URL.createObjectURL(blob);
        console.log('🔥 URL de descarga creada:', downloadUrl);
        
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        
        // Agregar al DOM, hacer clic y remover
        document.body.appendChild(link);
        console.log('🔥 Link agregado al DOM');
        
        // Forzar el clic con un pequeño delay
        setTimeout(() => {
          console.log('🔥 Ejecutando clic...');
          link.click();
          console.log('🔥 Clic ejecutado');
          
          // Método alternativo si el clic no funciona
          setTimeout(() => {
            console.log('🔥 Intentando método alternativo...');
            try {
              // Abrir en nueva ventana como respaldo
              const newWindow = window.open(downloadUrl, '_blank');
              if (newWindow) {
                console.log('🔥 Archivo abierto en nueva ventana');
                newWindow.focus();
              } else {
                console.log('🔥 No se pudo abrir nueva ventana - posible bloqueo de popup');
                // Último recurso: mostrar la URL al usuario
                prompt('Copia esta URL en una nueva pestaña para descargar:', downloadUrl);
              }
            } catch (altError) {
              console.error('🔥 Error en método alternativo:', altError);
            }
            
            // Limpiar después de un momento
            setTimeout(() => {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
              window.URL.revokeObjectURL(downloadUrl);
              console.log('🔥 Limpieza completada');
            }, 1000);
          }, 500);
        }, 100);
      }
      
      console.log(`🔥 Planilla del momento ${momento} descargada exitosamente`);
      alert(`Planilla del momento ${momento} generada y descargada exitosamente`);
      
    } catch (error) {
      console.error('🔥 ERROR COMPLETO al generar planilla:', error);
      alert(`Error al generar planilla: ${error.message}`);
    }
  };

  // Función para cargar la asignación y sus datos relacionados
  const loadAsignaciones = async () => {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      console.log('Renderizando en el servidor, omitiendo carga de asignaciones');
      return;
    }
    
    setLoading(true);
    try {
      // Obtener el tipo de usuario y el ID del usuario usando la función segura
      const userType = getStorageValue('userType');
      const userId = getStorageValue('userId');
      const userName = getStorageValue('userName');
      const userLastName = getStorageValue('userLastName');
      
      console.log('Cargando asignaciones para:', { userType, userId, userName, userLastName });
      
      // Verificar si hay información de usuario
      if (!userType) {
        console.error('No se encontró información del tipo de usuario en el almacenamiento');
        setError('No se pudo determinar el tipo de usuario. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        return;
      }
      
      // Construir la URL base
      let url = '/api/asignaciones';
      let params = new URLSearchParams();
      
      // Añadir el tipo de usuario como parámetro para que la API sepa qué filtros aplicar
      params.append('userType', userType);
      
      // Añadir parámetros según el tipo de usuario
      if (userType === 'docente') {
        // Para docentes, siempre filtrar por el nombre del docente que inició sesión
        if (userName && userLastName) {
          const nombreCompleto = `${userName} ${userLastName}`;
          // Usar el parámetro correcto: profesorNombre en lugar de profesor
          params.append('profesorNombre', nombreCompleto);
          console.log('Filtrando por profesor:', nombreCompleto);
        } else {
          console.error('Falta información del nombre o apellido del docente');
          setError('No se pudo determinar su nombre completo. Por favor, inicie sesión nuevamente.');
          setLoading(false);
          return;
        }
      } else if (userType === 'control' || userType === 'admin') {
        // Para control o admin, no añadimos filtros específicos
        console.log('Consulta para control/admin sin filtros específicos');
      } else {
        console.log('Tipo de usuario no reconocido o falta información del docente');
      }
      
      // Añadir los parámetros a la URL
      url += `?${params.toString()}`;
      console.log('URL completa para consulta de asignaciones:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al cargar asignaciones: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Asignaciones cargadas:', data);
      
      // Verificar si es docente y filtrar las asignaciones por su nombre
      if (userType === 'docente' && userName && userLastName) {
        const nombreCompleto = `${userName} ${userLastName}`;
        console.log('Filtrando asignaciones para el docente:', nombreCompleto);
        
        // Filtrado adicional en el cliente por si acaso
        const asignacionesFiltradas = data.filter(asignacion => {
          // Comprobar tanto en el campo profesor como en profesorNombre
          const profesorField = asignacion.profesor || '';
          const profesorNombreField = asignacion.profesorNombre || '';
          
          // Convertir a minúsculas para comparación insensible a mayúsculas/minúsculas
          const nombreCompletoLower = nombreCompleto.toLowerCase();
          const profesorLower = profesorField.toLowerCase();
          const profesorNombreLower = profesorNombreField.toLowerCase();
          
          // Verificar si el nombre del profesor está en alguno de los campos
          return profesorLower.includes(nombreCompletoLower) || 
                 profesorNombreLower.includes(nombreCompletoLower) ||
                 // También verificar si coincide con el nombre o apellido por separado
                 profesorLower.includes(userName.toLowerCase()) || 
                 profesorLower.includes(userLastName.toLowerCase()) ||
                 profesorNombreLower.includes(userName.toLowerCase()) || 
                 profesorNombreLower.includes(userLastName.toLowerCase());
        });
        
        console.log('Asignaciones filtradas para el docente:', asignacionesFiltradas);
        
        if (asignacionesFiltradas.length === 0) {
          console.log('No se encontraron asignaciones para este docente');
        }
        
        setAsignaciones(asignacionesFiltradas);
      } else {
        setAsignaciones(data);
      }
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      setError('Error al cargar las asignaciones. Por favor, intente de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar la asignación y sus datos relacionados
  const loadAsignacion = async () => {
    try {
      setLoading(true);
      
      // Verificar si el usuario es docente para aplicar restricciones
      const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
      const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || '';
      const userLastName = localStorage.getItem('userLastName') || sessionStorage.getItem('userLastName') || '';
      const profesorNombre = `${userName} ${userLastName}`.trim();
      
      // Cargar el aula
      const response = await fetch(`/api/aulas/${aulaId}`);
      if (!response.ok) {
        throw new Error('Error al cargar el aula');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error al cargar el aula');
      }
      
      // El API puede responder como { data: aula } o { aula }
      const aula = data.aula || data.data || null;
      if (!aula) {
        throw new Error('No se encontró el aula');
      }
      
      console.log('AULA CARGADA:', JSON.stringify(aula, null, 2));
      
      // Encontrar la asignación correspondiente a la materia
      const asignacion = aula.asignaciones.find(a => a.materia.id === materiaId);
      if (!asignacion) {
        throw new Error('Materia no encontrada en el aula');
      }
      
      console.log('ASIGNACIÓN ENCONTRADA:', JSON.stringify(asignacion, null, 2));
      
      // Actualizar el estado con los datos encontrados
      setAsignacion(asignacion);
      
      // Ordenar alumnos por cédula ascendente usando _id para buscar cédula real
      console.log('🚀 INICIANDO ORDENAMIENTO DE ALUMNOS POR _ID (loadAsignacion)');
      console.log('🚀 Alumnos con _id:', (aula.alumnos || []).map(a => ({ 
        nombre: a.nombre, 
        _id: a._id 
      })));
      
      // Filtrar alumnos: solo los que tienen esta materia asignada
      const alumnosFiltrados = (aula.alumnos || []).filter(alumno => {
        const alumnoId = alumno._id?.toString() || alumno.id?.toString() || '';
        const materiasAsignadas = normalizeMateriasAsignadas(alumno.materiasAsignadas);
        
        // Si el alumno no tiene materiasAsignadas definidas o tiene array vacío, asume que ve todas (compatibilidad hacia atrás)
        if (!materiasAsignadas.length) {
          console.log(`✅ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): Sin materiasAsignadas o array vacío → VER TODAS`);
          return true; // Por defecto para estudiantes antiguos o sin restricciones, ver todas las materias
        }
        
        // Si tiene materias asignadas, verificar si la materia actual está en la lista
        // Normalizar IDs para comparación (convertir a string y trim)
        const materiaIdNormalizado = String(materiaId || '').trim().toLowerCase();
        const materiaCodigoNormalizado = String(asignacion?.materia?.codigo || '').trim().toLowerCase();
        const tieneMateria = materiasAsignadas.some(matId => {
          const matIdNormalizado = String(matId || '').trim().toLowerCase();
          return (
            matIdNormalizado === materiaIdNormalizado ||
            (!!materiaCodigoNormalizado && matIdNormalizado === materiaCodigoNormalizado)
          );
        });
        
        if (tieneMateria) {
          console.log(`✅ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): Tiene materia ${materiaIdNormalizado} asignada → VER`);
        } else {
          console.log(`❌ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): NO tiene materia ${materiaIdNormalizado} (tiene: ${materiasAsignadas.join(', ')}) → NO VER`);
        }
        
        return tieneMateria;
      });
      
      console.log(`📚 RESUMEN - Filtrando alumnos para materia ${materiaId}:`, {
        total: aula.alumnos?.length || 0,
        filtrados: alumnosFiltrados.length,
        excluidos: (aula.alumnos?.length || 0) - alumnosFiltrados.length
      });
      
      // Obtener las cédulas reales de cada alumno usando su _id
      const alumnosConCedulas = await Promise.all(
        alumnosFiltrados.map(async (alumno) => {
          if (alumno.cedula || alumno.idU) {
            return { ...alumno, cedulaReal: alumno.idU || alumno.cedula };
          }
          try {
            const response = await fetch(`/api/estudiantes/${alumno._id}`);
            if (response.ok) {
              const data = await response.json();
              const estudiante = data.data;
              console.log(`🚀 Estudiante ${alumno._id}: cédula = ${estudiante.idU || estudiante.cedula}`);
              return {
                ...alumno,
                cedulaReal: estudiante.idU || estudiante.cedula || 'N/P'
              };
            }
            if (alumno.cedula) {
              const resp2 = await fetch(`/api/estudiantes/buscar?cedula=${encodeURIComponent(alumno.cedula)}`);
              if (resp2.ok) {
                const data2 = await resp2.json();
                const est = data2.estudiante || {};
                return { ...alumno, cedulaReal: est.cedula || alumno.cedula || 'N/P' };
              }
            }
            console.log(`🚀 No se pudo resolver cédula para alumno ${alumno._id}`);
            return { ...alumno, cedulaReal: 'N/P' };
          } catch (error) {
            console.log(`🚀 Error al obtener estudiante ${alumno._id}:`, error);
            return { ...alumno, cedulaReal: 'N/P' };
          }
        })
      );
      
      // Ordenar por cédula real
      const alumnosOrdenados = alumnosConCedulas.sort((a, b) => {
        const cedulaA = String(a.cedulaReal || '').trim();
        const cedulaB = String(b.cedulaReal || '').trim();
        
        console.log('🚀 Ordenando por cédula real:', cedulaA, 'vs', cedulaB);
        
        // Casos especiales: 'N/P' o vacío van al final
        if (cedulaA === 'N/P' || cedulaA === '' || cedulaA === 'undefined') return 1;
        if (cedulaB === 'N/P' || cedulaB === '' || cedulaB === 'undefined') return -1;
        
        // Convertir a números para comparación correcta de cédulas venezolanas
        const numA = parseInt(cedulaA.replace(/\D/g, ''), 10);
        const numB = parseInt(cedulaB.replace(/\D/g, ''), 10);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          console.log('🚀 Comparando números:', numA, 'vs', numB, '=', numA - numB);
          return numA - numB;
        }
        
        // Comparación alfabética como fallback
        return cedulaA.localeCompare(cedulaB);
      });
      
      console.log('🚀 Alumnos DESPUÉS de ordenar por cédula real:', alumnosOrdenados.map(a => ({ 
        nombre: a.nombre, 
        _id: a._id,
        cedulaReal: a.cedulaReal 
      })));
      setAlumnos(alumnosOrdenados);

      // Si la asignación tiene actividades, cargarlas
      if (asignacion.actividades && Array.isArray(asignacion.actividades)) {
        setActividades(asignacion.actividades);
      } else {
        setActividades([]);
      }
      
      // Cargar puntos extras por momento
      if (asignacion.puntosPorMomento) {
        console.log('DEPURACIÓN CRÍTICA - Cargando puntos extras por momento:', JSON.stringify(asignacion.puntosPorMomento, null, 2));
        
        // Inicializar objetos para cada momento
        const puntosMomento1Obj = {};
        const puntosMomento2Obj = {};
        const puntosMomento3Obj = {};
        
        // Verificar la estructura de puntosPorMomento
        console.log('DEPURACIÓN CRÍTICA - Tipo de puntosPorMomento:', typeof asignacion.puntosPorMomento);
        console.log('DEPURACIÓN CRÍTICA - Claves en puntosPorMomento:', Object.keys(asignacion.puntosPorMomento));
        
        // Inicializar todos los alumnos con 0 puntos
        aula.alumnos.forEach(alumno => {
          // Asegurarse de que el ID del alumno sea un string para consistencia
          const alumnoId = (alumno.id || alumno._id).toString();
          console.log(`Frontend - Inicializando alumno ID: ${alumnoId}`);
          puntosMomento1Obj[alumnoId] = 0;
          puntosMomento2Obj[alumnoId] = 0;
          puntosMomento3Obj[alumnoId] = 0;
        });
        
        console.log('ESTRUCTURA PUNTOS POR MOMENTO:', asignacion.puntosPorMomento);
        
        // Procesar puntos del momento 1
        if (asignacion.puntosPorMomento.momento1 && Array.isArray(asignacion.puntosPorMomento.momento1)) {
          console.log('Frontend - Puntos del momento 1:', JSON.stringify(asignacion.puntosPorMomento.momento1, null, 2));
          asignacion.puntosPorMomento.momento1.forEach(punto => {
            if (punto && punto.alumnoId) {
              // Convertir el ID a string para garantizar consistencia
              const alumnoIdStr = punto.alumnoId.toString();
              console.log(`Frontend - Procesando punto momento 1 para alumno ID: ${alumnoIdStr}, puntos: ${punto.puntos}`);
              puntosMomento1Obj[alumnoIdStr] = Number(punto.puntos) || 0;
            }
          });
        }
        
        // Procesar puntos del momento 2
        if (asignacion.puntosPorMomento.momento2 && Array.isArray(asignacion.puntosPorMomento.momento2)) {
          console.log('Frontend - Puntos del momento 2:', JSON.stringify(asignacion.puntosPorMomento.momento2, null, 2));
          asignacion.puntosPorMomento.momento2.forEach(punto => {
            if (punto && punto.alumnoId) {
              // Convertir el ID a string para garantizar consistencia
              const alumnoIdStr = punto.alumnoId.toString();
              console.log(`Frontend - Procesando punto momento 2 para alumno ID: ${alumnoIdStr}, puntos: ${punto.puntos}`);
              puntosMomento2Obj[alumnoIdStr] = Number(punto.puntos) || 0;
            }
          });
        }
        
        // Procesar puntos del momento 3
        if (asignacion.puntosPorMomento.momento3 && Array.isArray(asignacion.puntosPorMomento.momento3)) {
          console.log('Frontend - Puntos del momento 3:', JSON.stringify(asignacion.puntosPorMomento.momento3, null, 2));
          asignacion.puntosPorMomento.momento3.forEach(punto => {
            if (punto && punto.alumnoId) {
              // Convertir el ID a string para garantizar consistencia
              const alumnoIdStr = punto.alumnoId.toString();
              console.log(`Frontend - Procesando punto momento 3 para alumno ID: ${alumnoIdStr}, puntos: ${punto.puntos}`);
              puntosMomento3Obj[alumnoIdStr] = Number(punto.puntos) || 0;
            }
          });
        }
        
        console.log('PUNTOS MOMENTO 1 PROCESADOS:', puntosMomento1Obj);
        console.log('PUNTOS MOMENTO 2 PROCESADOS:', puntosMomento2Obj);
        console.log('PUNTOS MOMENTO 3 PROCESADOS:', puntosMomento3Obj);
        
        // Actualizar estados
        setPuntosMomento1(puntosMomento1Obj);
        setPuntosMomento2(puntosMomento2Obj);
        setPuntosMomento3(puntosMomento3Obj);
        
        // Inicializar puntosAdicionalesResumen con los valores del momento activo
        // Esto asegura que los inputs muestren los valores correctos al cargar
        const momentoActual = momentoActivo || 1;
        let puntosIniciales;
        
        // Hacer copias profundas para evitar referencias compartidas
        const puntosMomento1Copy = {...puntosMomento1Obj};
        const puntosMomento2Copy = {...puntosMomento2Obj};
        const puntosMomento3Copy = {...puntosMomento3Obj};
        
        switch(momentoActual) {
          case 1:
            puntosIniciales = puntosMomento1Copy;
            break;
          case 2:
            puntosIniciales = puntosMomento2Copy;
            break;
          case 3:
            puntosIniciales = puntosMomento3Copy;
            break;
          default:
            puntosIniciales = puntosMomento1Copy;
        }
        
        // Verificar que todos los alumnos tengan un valor asignado
        aula.alumnos.forEach(alumno => {
          const alumnoId = (alumno.id || alumno._id).toString();
          if (puntosIniciales[alumnoId] === undefined) {
            console.log(`Asignando valor por defecto (0) al alumno ${alumnoId} que no tenía puntos asignados`);
            puntosIniciales[alumnoId] = 0;
          }
        });
        
        // Actualizar el estado puntosAdicionalesResumen con los valores del momento activo
        setPuntosAdicionalesResumen({...puntosIniciales});
        
        console.log(`Frontend - Inicializando puntosAdicionalesResumen con valores del momento ${momentoActual}:`, puntosIniciales);
        
        // Verificar después de un segundo que los puntos se hayan cargado correctamente
        setTimeout(() => {
          console.log('VERIFICACIÓN DE PUNTOS DESPUÉS DE CARGAR:', {
            puntosMomento1: puntosMomento1Copy,
            puntosMomento2: puntosMomento2Copy,
            puntosMomento3: puntosMomento3Copy,
            puntosAdicionalesResumen: puntosIniciales
          });
        }, 100);
        console.log('Frontend - Puntos extras cargados por momento:', {
          momento1: puntosMomento1Obj,
          momento2: puntosMomento2Obj,
          momento3: puntosMomento3Obj
        });
      } else {
        console.log('Frontend - No se encontraron puntos extras por momento');
        
        // Inicializar todos los alumnos con 0 puntos
        const puntosVacios = {};
        aula.alumnos.forEach(alumno => {
          const alumnoId = alumno.id || alumno._id;
          puntosVacios[alumnoId] = 0;
        });
        
        setPuntosMomento1(puntosVacios);
        setPuntosMomento2(puntosVacios);
        setPuntosMomento3(puntosVacios);
      }
      
      // Cargar los puntos extras si existen
      if (asignacion.puntosExtras && Array.isArray(asignacion.puntosExtras)) {
        console.log('Frontend - Cargando puntos extras guardados:', asignacion.puntosExtras);
        
        // Crear un objeto con los puntos extras por alumno
        const puntosExtrasObj = {};
        
        // Obtener todos los IDs de alumnos para depuración
        console.log('Frontend - IDs de alumnos disponibles:', aula.alumnos.map(a => {
          return {
            id: a.id,
            _id: a._id,
            nombre: `${a.nombre} ${a.apellido || ''}`
          };
        }));
        
        // Mostrar todos los puntos extras para depuración
        console.log('Frontend - Detalles de puntos extras guardados:', asignacion.puntosExtras.map(pe => {
          return {
            alumnoId: pe.alumnoId,
            puntos: pe.puntos,
            fecha: pe.fechaActualizacion
          };
        }));
        
        // Inicializar todos los alumnos con 0 puntos para asegurar que todos tengan un valor
        aula.alumnos.forEach(alumno => {
          const alumnoId = alumno.id || alumno._id;
          puntosExtrasObj[alumnoId] = 0;
        });
        
        // Procesar cada punto extra y asegurarse de que coincida con algún alumno
        asignacion.puntosExtras.forEach(puntoExtra => {
          if (puntoExtra.alumnoId) {
            // Buscar si hay algún alumno que coincida con este ID (en cualquier formato)
            const alumnoEncontrado = aula.alumnos.find(alumno => {
              const alumnoId = alumno.id || alumno._id;
              const alumnoIdStr = alumnoId ? alumnoId.toString() : '';
              const puntoExtraIdStr = puntoExtra.alumnoId.toString();
              
              return alumnoIdStr === puntoExtraIdStr;
            });
            
            if (alumnoEncontrado) {
              const alumnoId = alumnoEncontrado.id || alumnoEncontrado._id;
              console.log(`Frontend - Punto extra encontrado para alumno: ${alumnoEncontrado.nombre} ${alumnoEncontrado.apellido || ''}, puntos: ${puntoExtra.puntos}`);
              puntosExtrasObj[alumnoId] = puntoExtra.puntos;
            } else {
              console.log(`Frontend - No se encontró alumno para el punto extra con alumnoId: ${puntoExtra.alumnoId}`);
            }
          }
        });
        
        console.log('Frontend - Puntos extras cargados por alumno:', puntosExtrasObj);
        
        // Actualizar el estado de puntosAdicionalesResumen con los puntos extras cargados
        console.log('CARGANDO PUNTOS ADICIONALES:', puntosExtrasObj);
        console.log('KEYS DE PUNTOS ADICIONALES:', Object.keys(puntosExtrasObj));
        console.log('VALORES DE PUNTOS ADICIONALES:', Object.values(puntosExtrasObj));
        setPuntosAdicionalesResumen(puntosExtrasObj);
        
        // Verificar después de un segundo que los puntos se hayan cargado correctamente
        setTimeout(() => {
          console.log('VERIFICACIÓN DE PUNTOS ADICIONALES DESPUÉS DE 1 SEGUNDO:', puntosAdicionalesResumen);
        }, 1000);
      } else {
        console.log('Frontend - No se encontraron puntos extras guardados');
        
        // Inicializar todos los alumnos con 0 puntos si no hay puntos extras guardados
        const puntosExtrasVacios = {};
        aula.alumnos.forEach(alumno => {
          const alumnoId = alumno.id || alumno._id;
          puntosExtrasVacios[alumnoId] = 0;
        });
        setPuntosAdicionalesResumen(puntosExtrasVacios);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar la asignación:', err);
      setError('Error al cargar la asignación: ' + err.message);
      setLoading(false);
    }
  };
  
  // Función para abrir el formulario de nueva actividad
  const openNewActividadForm = () => {
    // Verificar si el momento activo está bloqueado
    if (momentosBloqueados[momentoActivo]) {
      alert(`El momento ${momentoActivo} está bloqueado. No se pueden agregar actividades.`);
      return;
    }
    
    setActividadFormData({
      nombre: '',
      descripcion: '',
      fecha: fechaParaInput(new Date()),
      porcentaje: 100,
      momento: momentoActivo,
      modoEdicion: false,
      actividadId: null
    });
    setShowActividadForm(true);
  };
  
  // Función para abrir el formulario de edición de actividad
  const openEditActividadForm = (actividad) => {
    // Obtener el momento de la actividad
    const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : (actividad.momento || 1);
    
    // Verificar si el momento está bloqueado
    if (momentosBloqueados[momento]) {
      alert(`El momento ${momento} está bloqueado. No se pueden editar actividades.`);
      return;
    }
    
    setActividadFormData({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion || '',
      fecha: fechaParaInput(actividad.fecha), // Usar función auxiliar para evitar problemas de zona horaria
      porcentaje: actividad.porcentaje,
      momento: actividad.momento || 1, // Usar el momento de la actividad o 1 por defecto
      modoEdicion: true,
      actividadId: actividad._id
    });
    setShowActividadForm(true);
  };
  
  // Función para abrir el formulario de calificación por lote
  const openBatchCalificacionForm = (actividadId) => {
    // Encontrar la actividad para determinar a qué momento pertenece
    const actividad = actividades.find(act => act._id === actividadId);
    if (!actividad) return;
    
    // Obtener el momento de la actividad
    const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : (actividad.momento || 1);
    
    // Verificar si el momento está bloqueado
    if (momentosBloqueados[momento]) {
      alert(`El momento ${momento} está bloqueado. No se pueden agregar calificaciones.`);
      return;
    }
    
    // Preparar las calificaciones para todos los estudiantes
    const calificacionesEstudiantes = alumnos.map(alumno => {
      // Buscar si ya existe una calificación para este estudiante en esta actividad
      const calificacionExistente = actividad.calificaciones?.find(cal => 
        String(cal.alumnoId) === String(alumno._id)
      );
      
      return {
        alumnoId: alumno._id,
        alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
        nota: calificacionExistente?.nota || '',
        notaAlfabetica: calificacionExistente?.notaAlfabetica || 'C',
        observaciones: calificacionExistente?.observaciones || '',
        evidencia: calificacionExistente?.evidencia || '',
        tieneCalificacion: !!calificacionExistente,
        calificacionId: calificacionExistente?._id || null
      };
    });
    
    setBatchCalificacionData({
      actividadId: actividadId,
      tipoCalificacion: 'numerica',
      calificaciones: calificacionesEstudiantes
    });
    
    console.log('Abriendo formulario de calificación por lote...');
    setShowBatchCalificacionForm(true);
  };
  
  // Función para abrir el formulario de nueva calificación
  const openNewCalificacionForm = (actividadId) => {
    // Encontrar la actividad para determinar a qué momento pertenece
    const actividad = actividades.find(act => act._id === actividadId);
    if (!actividad) return;
    
    // Obtener el momento de la actividad
    const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : (actividad.momento || 1);
    
    // Verificar si el momento está bloqueado
    if (momentosBloqueados[momento]) {
      alert(`El momento ${momento} está bloqueado. No se pueden agregar calificaciones.`);
      return;
    }
    
    setCalificacionFormData({
      actividadId: actividadId,
      alumnoId: '',
      nota: 10,
      notaAlfabetica: 'C',
      tipoCalificacion: 'numerica', // Por defecto usamos calificación numérica
      modoEdicion: false,
      calificacionId: null,
      observaciones: ''
    });
    console.log('Abriendo formulario de nueva calificación...');
    setShowCalificacionForm(true);
    console.log('Estado showCalificacionForm después de setear:', true);
  };
  
  // Función para abrir el formulario de edición de calificación
  const openEditCalificacionForm = (actividad, calificacion) => {
    // Obtener el momento de la actividad
    const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : (actividad.momento || 1);
    
    // Verificar si el momento está bloqueado
    if (momentosBloqueados[momento]) {
      alert(`El momento ${momento} está bloqueado. No se pueden editar calificaciones.`);
      return;
    }
    
    console.log('Abriendo formulario de edición de calificación...', calificacion);
    console.log('Observaciones recibidas:', calificacion.observaciones);
    console.log('Evidencia recibida:', calificacion.evidencia);
    
    setCalificacionFormData({
      actividadId: actividad._id,
      alumnoId: calificacion.alumnoId,
      nota: calificacion.nota || (calificacion.tipoCalificacion === 'np' || calificacion.tipoCalificacion === 'inasistente' ? null : 10),
      notaAlfabetica: calificacion.notaAlfabetica || (calificacion.tipoCalificacion === 'np' || calificacion.tipoCalificacion === 'inasistente' ? '' : 'C'),
      tipoCalificacion: calificacion.tipoCalificacion || 'numerica',
      modoEdicion: true,
      calificacionId: calificacion._id,
      observaciones: calificacion.observaciones || '',
      evidencia: calificacion.evidencia || ''
    });
    
    // Si hay una evidencia existente, mostrarla en la vista previa
    if (calificacion.evidencia) {
      setPreviewUrl(calificacion.evidencia);
    } else {
      setPreviewUrl('');
    }
    
    // Limpiar la imagen seleccionada ya que estamos editando una calificación existente
    setImagenSeleccionada(null);
    
    console.log('Mostrando formulario de calificación...');
    setShowCalificacionForm(true);
    console.log('Estado showCalificacionForm después de setear:', true);
  };
  
  // Función para guardar calificaciones por lote
  const handleBatchCalificacion = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      
      const actividad = actividades.find(act => act._id === batchCalificacionData.actividadId);
      if (!actividad) {
        alert('Actividad no encontrada');
        setLoading(false);
        return;
      }
      
      // Obtener el momento de la actividad
      const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : actividad.momento;
      
      // Verificar si el momento está bloqueado
      if (momentosBloqueados[momento]) {
        alert(`El momento ${momento} está bloqueado. No se pueden guardar calificaciones.`);
        setLoading(false);
        return;
      }
      
      // Construir payload validado para un solo request masivo
      const calificacionesValidas = batchCalificacionData.calificaciones
        .filter(c => c && (c.nota || c.notaAlfabetica) && c.alumnoId)
        .map(c => ({
          alumnoId: c.alumnoId,
          nota: batchCalificacionData.tipoCalificacion === 'numerica' ? c.nota : undefined,
          notaAlfabetica: batchCalificacionData.tipoCalificacion === 'alfabetica' ? c.notaAlfabetica : undefined,
          observaciones: c.observaciones || '',
          evidencia: c.evidencia || ''
        }));

      if (calificacionesValidas.length === 0) {
        alert('No hay calificaciones válidas para procesar.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/aulas/${aulaId}/materias/${materiaId}/actividades/${batchCalificacionData.actividadId}/calificaciones/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoCalificacion: batchCalificacionData.tipoCalificacion,
          calificaciones: calificacionesValidas
        })
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(txt || 'Error al guardar calificaciones por lote');
      }

      const resultado = await response.json();
      console.log('Resultado guardado por lote:', resultado);
      
      // Recargar datos
      await loadAulaData();
      
      
      alert(`Calificaciones guardadas correctamente. ${calificacionesValidas.length} estudiantes procesados.`);
      
      // Cerrar modal
      setShowBatchCalificacionForm(false);
      setBatchCalificacionData({
        actividadId: '',
        tipoCalificacion: 'numerica',
        calificaciones: []
      });
      
    } catch (error) {
      console.error('Error al guardar calificaciones por lote:', error);
      alert('Error al guardar calificaciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para agregar una nueva actividad
  const handleAddActividad = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      
      console.log('Formulario de actividad:', actividadFormData);
      console.log('Tipo de momento:', typeof actividadFormData.momento);
      console.log('Valor de momento:', actividadFormData.momento);
      
      // Obtener el momento de la actividad
      const momento = typeof actividadFormData.momento === 'string' ? Number(actividadFormData.momento) : actividadFormData.momento;
      
      // Verificar si el momento está bloqueado
      if (momentosBloqueados[momento]) {
        alert(`El momento ${momento} está bloqueado. No se pueden agregar actividades.`);
        setLoading(false);
        return;
      }
      
      if (!actividadFormData.nombre) {
        alert('Por favor, ingrese un nombre para la actividad');
        setLoading(false);
        return;
      }
      
      // Crear el objeto de actividad
      const nuevaActividad = {
        nombre: actividadFormData.nombre,
        descripcion: actividadFormData.descripcion,
        fecha: fechaDesdeInput(actividadFormData.fecha), // Usar función auxiliar para evitar problema del día anterior
        porcentaje: Number(actividadFormData.porcentaje),
        momento: Number(actividadFormData.momento || momentoActivo || 1), // Usar el momento activo o 1 por defecto
        calificaciones: []
      };

      console.log('Nueva actividad a crear:', nuevaActividad);

      // Hacer la petición POST al servidor
      const response = await fetch(`/api/aulas/${aulaId}/materias/${materiaId}/actividades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevaActividad)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al agregar la actividad');
      }

      // Actualizar el estado con la nueva actividad
      setActividades(prevActividades => [...prevActividades, data.actividad]);
      setShowActividadForm(false);
      setActividadFormData({
        nombre: '',
        descripcion: '',
        fecha: fechaParaInput(new Date()),
        porcentaje: 100,
        momento: 1
      });
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al agregar la actividad');
      setLoading(false);
    }
  };

  // Función para editar una actividad existente
  const handleEditActividad = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Obtener el momento de la actividad
      const momento = typeof actividadFormData.momento === 'string' ? Number(actividadFormData.momento) : actividadFormData.momento;
      
      // Verificar si el momento está bloqueado
      if (momentosBloqueados[momento]) {
        alert(`El momento ${momento} está bloqueado. No se pueden editar actividades.`);
        setLoading(false);
        return;
      }

      if (!actividadFormData.nombre) {
        alert('Por favor, ingrese un nombre para la actividad');
        setLoading(false);
        return;
      }

      // Crear objeto de la actividad editada
      const actividadEditada = {
        nombre: actividadFormData.nombre,
        descripcion: actividadFormData.descripcion,
        fecha: fechaDesdeInput(actividadFormData.fecha), // Usar función auxiliar para evitar problema del día anterior
        porcentaje: Number(actividadFormData.porcentaje),
        momento: Number(actividadFormData.momento),
      };

      const response = await fetch(`/api/aulas/${aulaId}/materias/${materiaId}/actividades/${actividadFormData.actividadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actividadEditada),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al editar la actividad');
      }

      const data = await response.json();

      if (data.success) {
        // Actualizar la lista de actividades
        const updatedActividades = actividades.map(act =>
          act._id === actividadFormData.actividadId
            ? { ...act, ...actividadEditada }
            : act
        );
        setActividades(updatedActividades);
        setShowActividadForm(false);
        setActividadFormData({
          nombre: '',
          descripcion: '',
          fecha: fechaParaInput(new Date()),
          porcentaje: 100,
          momento: 1,
          modoEdicion: false,
          actividadId: null
        });
        setLoading(false);
      } else {
        throw new Error(data.message || 'Error al editar la actividad');
      }
  } catch (err) {
    console.error('Error:', err);
    setError(err.message);
    setLoading(false);
    alert('Error al editar la actividad: ' + err.message);
  }
};

const handleSeleccionActividad = (actividadId) => {
    setActividadesSeleccionadas(prev => ({
      ...prev,
      [actividadId]: !prev[actividadId]
    }));
  };

  // Función para seleccionar o deseleccionar todas las actividades
  const seleccionarTodasActividades = (seleccionar) => {
    const actividadesMomento = actividades.filter(act => act.momento === momentoActivo);
    
    const nuevoEstado = {};
    actividadesMomento.forEach(act => {
      nuevoEstado[act._id] = seleccionar;
    });
    
    setActividadesSeleccionadas(prev => ({
      ...prev,
      ...nuevoEstado
    }));
  };

  // Función para eliminar una actividad
  const handleDeleteActividad = async (actividadId) => {
    // Verificar si el momento de la actividad está bloqueado
    const actividad = actividades.find(act => act._id === actividadId);
    if (!actividad) {
      alert('No se encontró la actividad seleccionada.');
      return;
    }
    
    // Obtener el momento de la actividad
    const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : (actividad.momento || 1);
    
    // Verificar si el momento está bloqueado
    if (momentosBloqueados[momento]) {
      alert(`El momento ${momento} está bloqueado. No se pueden eliminar actividades.`);
      return;
    }
    
    // Confirmar eliminación
    if (!confirm(`¿Estás seguro de que deseas eliminar la actividad "${actividad.nombre}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Enviar solicitud para eliminar la actividad
      const response = await fetch(`/api/aulas/${aulaId}/materias/${materiaId}/actividades/${actividadId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar actividad');
      }
      
      // Mostrar mensaje de éxito
      alert('Actividad eliminada correctamente');
      
      // Recargar la asignación para actualizar la lista de actividades
      await loadAsignacion();
      
      setLoading(false);
    } catch (err) {
      console.error('Error al eliminar actividad:', err);
      setError('Error al eliminar actividad: ' + err.message);
      setLoading(false);
      alert('Error al eliminar actividad: ' + err.message);
    }
  };
  
  // Función para eliminar múltiples actividades seleccionadas
  const eliminarActividadesSeleccionadas = async () => {
    // Obtener las actividades seleccionadas
    const idsSeleccionados = Object.entries(actividadesSeleccionadas)
      .filter(([_, seleccionada]) => seleccionada)
      .map(([id]) => id);
    
    if (idsSeleccionados.length === 0) {
      alert('No hay actividades seleccionadas para eliminar.');
      return;
    }
    
    // Verificar si alguna actividad seleccionada pertenece a un momento bloqueado
    const actividadesAEliminar = actividades.filter(act => idsSeleccionados.includes(act._id));
    const momentosBloqueadosEncontrados = [];
    
    for (const actividad of actividadesAEliminar) {
      const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : (actividad.momento || 1);
      if (momentosBloqueados[momento] && !momentosBloqueadosEncontrados.includes(momento)) {
        momentosBloqueadosEncontrados.push(momento);
      }
    }
    
    if (momentosBloqueadosEncontrados.length > 0) {
      alert(`No se pueden eliminar actividades de los momentos bloqueados: ${momentosBloqueadosEncontrados.join(', ')}.`);
      return;
    }
    
    // Confirmar eliminación
    if (!confirm(`¿Estás seguro de que deseas eliminar ${idsSeleccionados.length} actividades seleccionadas?`)) {
      return;
    }
    
    try {
      setLoading(true);
      let errores = 0;
      
      // Eliminar cada actividad seleccionada
      for (const actividadId of idsSeleccionados) {
        try {
          const response = await fetch(`/api/asignaciones/${asignacionId}/actividades/${actividadId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            errores++;
            console.error(`Error al eliminar actividad ${actividadId}:`, await response.json());
          }
        } catch (err) {
          errores++;
          console.error(`Error al eliminar actividad ${actividadId}:`, err);
        }
      }
      
      // Mostrar mensaje de resultado
      if (errores === 0) {
        alert(`${idsSeleccionados.length} actividades eliminadas correctamente.`);
      } else {
        alert(`Se eliminaron ${idsSeleccionados.length - errores} actividades, pero hubo ${errores} errores.`);
      }
      
      // Limpiar selección
      setActividadesSeleccionadas({});
      
      // Recargar la asignación para actualizar la lista de actividades
      await loadAsignacion();
      
      setLoading(false);
    } catch (err) {
      console.error('Error al eliminar actividades seleccionadas:', err);
      setError('Error al eliminar actividades: ' + err.message);
      setLoading(false);
      alert('Error al eliminar actividades: ' + err.message);
    }
  };
  
  // Función para agregar o editar una calificación
  const handleSaveCalificacion = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Convertir la imagen a base64 si se ha seleccionado una
      let evidenciaBase64 = calificacionFormData.evidencia;
      if (imagenSeleccionada) {
        console.log('Convirtiendo imagen seleccionada a base64...');
        evidenciaBase64 = await convertirImagenABase64();
        console.log('Base64 de evidencia obtenido:', evidenciaBase64 ? 'Imagen convertida exitosamente' : 'Error en conversión');
        if (!evidenciaBase64) {
          alert('Error al convertir la imagen. Intente nuevamente.');
          setLoading(false);
          return;
        }
      } else {
        console.log('No hay imagen seleccionada, usando evidencia existente:', evidenciaBase64 ? 'Evidencia existente' : 'Sin evidencia');
      }
      
      const { actividadId, alumnoId, tipoCalificacion, modoEdicion, calificacionId } = calificacionFormData;
      
      // Validar que se hayan seleccionado una actividad y un alumno
      if (!actividadId || !alumnoId) {
        alert('Debe seleccionar una actividad y un alumno');
        setLoading(false);
        return;
      }
      
      // Encontrar la actividad para determinar a qué momento pertenece
      const actividad = actividades.find(act => act._id === calificacionFormData.actividadId);
      if (!actividad) {
        alert('No se encontró la actividad seleccionada.');
        setLoading(false);
        return;
      }
      
      // Obtener el momento de la actividad
      const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : (actividad.momento || 1);
      
      // Verificar si el momento está bloqueado
      if (momentosBloqueados[momento]) {
        alert(`El momento ${momento} está bloqueado. No se pueden agregar o editar calificaciones.`);
        setLoading(false);
        return;
      }
      
      if (!calificacionFormData.alumnoId) {
        alert('Por favor, seleccione un alumno');
        setLoading(false);
        return;
      }
      
      if (!calificacionFormData.actividadId) {
        alert('No se pudo identificar la actividad');
        setLoading(false);
        return;
      }
      
      // Determinar si la materia debe usar calificación alfabética
      const materiasAlfabeticas = ['Orientación', 'Grupo y Participación'];
      const debeSerAlfabetica = materiasAlfabeticas.includes(asignacion?.materiaNombre);
      
      // Forzar tipo de calificación alfabética para materias específicas
      if (debeSerAlfabetica) {
        calificacionFormData.tipoCalificacion = 'alfabetica';
      }
      
      // Validar la calificación según el tipo seleccionado
      let nota = null;
      let notaAlfabetica = '';
      
      if (calificacionFormData.tipoCalificacion === 'numerica' && !debeSerAlfabetica) {
        const notaInt = parseInt(calificacionFormData.nota, 10);
        nota = Math.max(1, Math.min(20, isNaN(notaInt) ? 1 : notaInt));
        if (isNaN(nota) || nota < 1 || nota > 20) {
          alert('La calificación numérica debe ser un número entre 1 y 20');
          setLoading(false);
          return;
        }
        // Convertir la nota numérica a su equivalente alfabético para referencia
        const convertirNotaALetra = (nota) => {
          if (nota >= 19) return 'A';
          if (nota >= 16) return 'B';
          if (nota >= 13) return 'C';
          if (nota >= 10) return 'D';
          if (nota >= 7) return 'E';
          return 'F';
        };
        notaAlfabetica = convertirNotaALetra(nota);
      } else if (calificacionFormData.tipoCalificacion === 'alfabetica') {
        // Si es calificación alfabética
        notaAlfabetica = calificacionFormData.notaAlfabetica;
        if (!notaAlfabetica || !['A', 'B', 'C', 'D'].includes(notaAlfabetica)) {
          alert('Debe seleccionar una calificación alfabética válida');
          setLoading(false);
          return;
        }
        // Convertir la nota alfabética a su equivalente numérico para referencia
        const convertirLetraANota = (letra) => {
          const conversion = {
            'A': 20,
            'B': 16,
            'C': 13,
            'D': 10,
            'E': 7,
            'F': 1
          };
          return conversion[letra] || 0;
        };
        nota = convertirLetraANota(notaAlfabetica);
      } else if (calificacionFormData.tipoCalificacion === 'np' || calificacionFormData.tipoCalificacion === 'inasistente') {
        // Si es NP o Inasistente, no se requiere nota numérica ni alfabética
        nota = null;
        notaAlfabetica = '';
        // El tipoCalificacion ya está establecido como 'np' o 'inasistente'
      }
      
      // Obtener las observaciones del formulario
      const observaciones = calificacionFormData.observaciones || '';
      
      // Verificar que las observaciones se están incluyendo correctamente
      console.log('Observaciones a enviar:', observaciones);
      
      // Crear el objeto de calificación
      let calificacionData = {
        alumnoId: alumnoId,
        nota: (tipoCalificacion === 'numerica' && nota !== null) ? Math.max(1, Math.min(20, nota)) : 
              (tipoCalificacion === 'alfabetica' && nota !== null) ? nota : null,
        notaAlfabetica: tipoCalificacion === 'alfabetica' ? calificacionFormData.notaAlfabetica : 
                       (tipoCalificacion === 'np' || tipoCalificacion === 'inasistente') ? '' : null,
        tipoCalificacion: tipoCalificacion,
        observaciones: calificacionFormData.observaciones || '',
        evidencia: evidenciaBase64 || ''
      };
      
      console.log('Objeto de calificación a enviar:', calificacionData);
      
      console.log('Objeto de calificación final:', JSON.stringify(calificacionData, null, 2));
      console.log('Tipo de calificación:', calificacionFormData.tipoCalificacion);
      console.log('Nota numérica:', calificacionFormData.nota);
      console.log('Nota alfabética:', calificacionFormData.notaAlfabetica);
      console.log('Evidencia (base64):', evidenciaBase64 ? 'Imagen en base64 disponible' : 'Sin evidencia');
      console.log('Observaciones:', observaciones);
      
      // Determinar si es una nueva calificación o una edición
      const url = calificacionFormData.modoEdicion
        ? `/api/aulas/${aulaId}/materias/${materiaId}/actividades/${calificacionFormData.actividadId}/calificaciones/${calificacionFormData.calificacionId}`
        : `/api/aulas/${aulaId}/materias/${materiaId}/actividades/${calificacionFormData.actividadId}/calificaciones`;
      
      const method = calificacionFormData.modoEdicion ? 'PUT' : 'POST';
      
      // Preparar los datos finales para enviar al servidor
      const datosFinales = calificacionData;
      
      console.log('Datos finales enviados al servidor:', JSON.stringify(datosFinales, null, 2));
      
      // Enviar datos a la API con la evidencia en base64
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosFinales),
      });
      
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al guardar calificación');
      }
      
      // Recargar los datos para mostrar la nueva calificación
      console.log('Recargando datos para actualizar la interfaz...');
      await loadAulaData();
      
      // Verificar si la calificación se guardó correctamente con la evidencia
      console.log('Verificando si la calificación se guardó con la evidencia:', evidenciaBase64 ? 'Evidencia en base64 disponible' : 'Sin evidencia');
      
      // Limpiar el formulario y cerrarlo
      setCalificacionFormData({
        actividadId: '',
        alumnoId: '',
        nota: '',
        notaAlfabetica: '',
        tipoCalificacion: 'numerica',
        observaciones: '',
        evidencia: '',
        modoEdicion: false,
        calificacionId: ''
      });
      
      // Limpiar la imagen seleccionada y la vista previa
      setImagenSeleccionada(null);
      setPreviewUrl('');
      
      // Mostrar mensaje de éxito
      alert(calificacionFormData.modoEdicion ? 'Calificación actualizada correctamente' : 'Calificación guardada correctamente');
      
      setShowCalificacionForm(false);
      setLoading(false);
      
      // Recargar la asignación para mostrar los cambios
      await loadAsignacion();
      
      setLoading(false);
    } catch (err) {
      console.error('Error al guardar calificación:', err);
      setError('Error al guardar calificación: ' + err.message);
      setLoading(false);
      alert('Error al guardar calificación: ' + err.message);
    }
  };
  
  // Función para obtener la calificación de un alumno en una actividad
  const getCalificacion = (actividad, alumnoId) => {
    if (!actividad || !actividad.calificaciones || !Array.isArray(actividad.calificaciones)) {
      return { nota: 'N/A', notaAlfabetica: 'N/A', tipoCalificacion: 'numerica' };
    }
    
    const calificacion = actividad.calificaciones.find(c => c.alumnoId === alumnoId);
    if (!calificacion) {
      return { nota: 'N/A', notaAlfabetica: 'N/A', tipoCalificacion: 'numerica' };
    }
    
    return {
      nota: calificacion.nota || 'N/A',
      notaAlfabetica: calificacion.notaAlfabetica || 'N/A',
      tipoCalificacion: calificacion.tipoCalificacion || 'numerica',
      observaciones: calificacion.observaciones || ''
    };
  };
  
  // Función para formatear la fecha para mostrar (DD/MM/YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para convertir fecha de BD a formato YYYY-MM-DD para input type="date" (sin problemas de zona horaria)
  const fechaParaInput = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';
    // Usar métodos locales para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para convertir fecha de input (YYYY-MM-DD) a Date local (sin problema del día anterior)
  const fechaDesdeInput = (fechaString) => {
    if (!fechaString) return null;
    // Parsear YYYY-MM-DD y crear fecha en zona horaria local
    const [year, month, day] = fechaString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    // Crear fecha usando zona horaria local (no UTC)
    return new Date(year, month - 1, day);
  };
  
  // Función para cambiar el momento activo
  const handleMomentoChange = (momento) => {
    setMomentoActivo(momento);
    // Cargar los puntos extras para el nuevo momento activo
    cargarPuntosMomento(`momento${momento}`);
  };
  
  // Función para guardar los promedios
  const guardarPromedios = async () => {
    try {
      setGuardandoPromedios(true);
      setMensajePromedios({ texto: 'Guardando promedios...', tipo: 'success' });
      
      // Aquí iría la lógica para guardar los promedios
      // Por ahora solo simulamos un guardado exitoso
      setTimeout(() => {
        setMensajePromedios({ texto: 'Promedios guardados correctamente', tipo: 'success' });
        setGuardandoPromedios(false);
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setMensajePromedios({ texto: '', tipo: '' });
        }, 3000);
      }, 1000);
      
    } catch (error) {
      console.error('Error al guardar promedios:', error);
      setMensajePromedios({ texto: `Error al guardar promedios: ${error.message}`, tipo: 'error' });
      setGuardandoPromedios(false);
    }
  };
  
  // Función para generar el reporte
  const handleGenerateReport = () => {
    setShowReportModal(true);
  };
  
  // Función para imprimir el reporte usando la API del navegador
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Reporte de Calificaciones</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; margin: 20px; }
      .reportContainer { max-width: 1200px; margin: 0 auto; padding: 20px; }
      .reportHeader { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 20px; margin-bottom: 30px; border: 1px solid #e5e7eb; padding: 15px; }
      .reportHeaderLeft, .reportHeaderCenter, .reportHeaderRight { display: flex; flex-direction: column; justify-content: center; }
      .reportHeader h3 { font-size: 1rem; font-weight: 600; margin-bottom: 5px; }
      .reportHeader h4 { font-size: 0.875rem; font-weight: 500; color: #4b5563; margin: 5px 0; }
      .reportTable { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .reportTable th { background-color: #f3f4f6; padding: 10px; text-align: center; font-weight: 600; font-size: 0.875rem; border: 1px solid #e5e7eb; }
      .reportTable td { padding: 10px; text-align: center; border: 1px solid #e5e7eb; font-size: 0.875rem; }
      .reportFooter { display: flex; justify-content: space-between; margin-top: 50px; }
      .reportSignature { display: flex; flex-direction: column; align-items: center; width: 300px; }
      .signatureLine { width: 100%; border-bottom: 1px solid #000; margin-bottom: 10px; }
      .reportDate { text-align: right; }
      @page { margin: 0.5cm; }
      @media print { 
        #about-blank-info { display: none; }
      }
    `);
    printWindow.document.write('</style></head><body>');
    
    // Crear el contenido del reporte
    printWindow.document.write('<div class="reportContainer">');
    
    // Encabezado del reporte
    printWindow.document.write('<div class="reportHeader">');
    printWindow.document.write('<div class="reportHeaderLeft"><h3>Colegio</h3><h4>Acacias</h4></div>');
    printWindow.document.write(`<div class="reportHeaderCenter"><h3>Curso Académico: ${asignacion?.periodo || 'No especificado'}</h3><h4>Programa: ${asignacion?.materiaNombre || 'No especificado'}</h4></div>`);
    printWindow.document.write(`<div class="reportHeaderRight"><h3>Nombre del Programa:</h3><h4>${asignacion?.materiaNombre || 'No especificado'}</h4></div>`);
    printWindow.document.write('</div>');
    
    // Tabla de calificaciones
    printWindow.document.write('<table class="reportTable"><thead><tr><th>N°</th><th>Nombre y Apellido</th>');
    
    // Encabezados de actividades
    actividades.forEach(actividad => {
      printWindow.document.write(`<th>${actividad.nombre}</th>`);
    });
    
    printWindow.document.write('<th>Promedio</th><th>Nota</th></tr></thead><tbody>');
    
    // Filas de alumnos
    alumnos.forEach((alumno, index) => {
      // Calcular el promedio de calificaciones para este alumno
      let totalNotas = 0;
      let totalActividades = 0;
      
      printWindow.document.write(`<tr><td>${index + 1}</td><td>${alumno.nombre}</td>`);
      
      // Notas por actividad
      actividades.forEach(actividad => {
        const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumno.id);
        if (calificacion) {
          // Solo sumar si no es NP o Inasistente
          if (calificacion.tipoCalificacion !== 'np' && calificacion.tipoCalificacion !== 'inasistente' && calificacion.nota !== null && calificacion.nota !== undefined) {
            totalNotas += calificacion.nota;
            totalActividades++;
          }
          // Mostrar la calificación según el tipo
          if (calificacion.tipoCalificacion === 'np') {
            printWindow.document.write('<td>NP</td>');
          } else if (calificacion.tipoCalificacion === 'inasistente') {
            printWindow.document.write('<td>I</td>');
          } else if (calificacion.tipoCalificacion === 'alfabetica') {
            printWindow.document.write(`<td>${calificacion.notaAlfabetica || 'N/A'}</td>`);
          } else {
            printWindow.document.write(`<td>${calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : 'N/A'}</td>`);
          }
        } else {
          printWindow.document.write('<td>N/A</td>');
        }
      });
      
      // Promedio
      const promedioNumerico = totalActividades > 0 ? (totalNotas / totalActividades) : null;
      const promedio = promedioNumerico !== null ? promedioNumerico.toFixed(2) : 'N/A';
      
      printWindow.document.write(`<td>${promedio}</td>`);
      printWindow.document.write(`<td>${promedio !== 'N/A' ? (promedio >= 10 ? 'Aprobado' : 'Reprobado') : 'N/A'}</td></tr>`);
    });
    
    printWindow.document.write('</tbody></table>');
    
    // Pie del reporte
    printWindow.document.write('<div class="reportFooter">');
    printWindow.document.write(`<div class="reportSignature"><div class="signatureLine"></div><p>Firma del Profesor: ${asignacion?.profesorNombre || 'No especificado'}</p></div>`);
    printWindow.document.write('</div>');
    
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    // Esperar a que los estilos se carguen y luego imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setShowReportModal(false);
    }, 500);
  };
  
  // Función para cerrar el modal del reporte
  const closeReportModal = () => {
    setShowReportModal(false);
  };
  
  // Función para bloquear/desbloquear un momento (versión simplificada)
  const toggleBloqueoMomento = (momento) => {
    if (!aulaId) {
      console.error('No hay un aula activa');
      return;
    }

    // Actualizar el estado local
    const nuevoEstado = !momentosBloqueados[momento];
    
    setMomentosBloqueados(prev => ({
      ...prev,
      [momento]: nuevoEstado
    }));
    
    // Guardar el estado en localStorage para mantenerlo entre recargas de página
    try {
      // Obtener el estado actual guardado o inicializar un objeto vacío
      const estadoGuardado = JSON.parse(localStorage.getItem(`bloqueoMomentos_${aulaId}_${materiaId}`) || '{}');
      
      // Actualizar el estado para este momento
      estadoGuardado[momento] = nuevoEstado;
      
      // Guardar el estado actualizado
      localStorage.setItem(`bloqueoMomentos_${aulaId}_${materiaId}`, JSON.stringify(estadoGuardado));
      
      console.log(`Momento ${momento} ${nuevoEstado ? 'bloqueado' : 'desbloqueado'} y guardado en localStorage`);
    } catch (error) {
      console.error('Error al guardar el estado en localStorage:', error);
    }
  };
  
  // Función para eliminar una calificación
  const handleDeleteCalificacion = async (actividadId, alumnoId) => {
    // Encontrar la actividad para determinar a qué momento pertenece
    const actividad = actividades.find(act => act._id === actividadId);
    if (!actividad) {
      alert('No se encontró la actividad seleccionada.');
      return;
    }
    
    // Obtener el momento de la actividad
    const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : (actividad.momento || 1);
    
    // Verificar si el momento está bloqueado
    if (momentosBloqueados[momento]) {
      alert(`El momento ${momento} está bloqueado. No se pueden eliminar calificaciones.`);
      return;
    }
    
    if (!confirm('¿Está seguro de que desea eliminar esta calificación? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Encontrar la calificación existente
      const calificacionExistente = actividad.calificaciones?.find(c => c.alumnoId === alumnoId);
      if (!calificacionExistente) {
        alert('No se encontró la calificación seleccionada.');
        setLoading(false);
        return;
      }
      
      // Crear una copia de las calificaciones sin la que queremos eliminar
      const nuevasCalificaciones = actividad.calificaciones.filter(c => c.alumnoId !== alumnoId);
      
      // Crear una copia de la actividad con las nuevas calificaciones
      const actividadActualizada = {
        ...actividad,
        calificaciones: nuevasCalificaciones
      };
      
      // Determinar si es una nueva calificación o una edición
      if (modoEdicion && calificacionId) {
        // Editar calificación existente
        const response = await fetch(`/api/calificaciones/${calificacionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calificacionData)
        });
      
        const responseData = await response.json();
        console.log('Respuesta del servidor:', responseData);
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Error al eliminar calificación');
        }
        
        // Mostrar alerta de éxito
        alert('Calificación eliminada correctamente');
        
        // Recargar la asignación para mostrar los cambios
        await loadAsignacion();
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al eliminar calificación:', err);
      setError('Error al eliminar calificación: ' + err.message);
      setLoading(false);
      alert('Error al eliminar calificación: ' + err.message);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Cargando...</h1>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Error</h1>
          <p>{error}</p>
          <Link href="/sidebar">Volver al panel principal</Link>
        </div>
      </div>
    );
  }
  
  if (!asignacion) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>No se encontró la asignación</h1>
          <Link href="/sidebar">Volver al panel principal</Link>
        </div>
      </div>
    );
  }
  
  // Función segura para obtener datos del almacenamiento del navegador
  const getStorageValue = (key, defaultValue = '') => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem(key) || localStorage.getItem(key) || defaultValue;
      } catch (error) {
        console.error(`Error al acceder al almacenamiento para la clave ${key}:`, error);
        return defaultValue;
      }
    }
    return defaultValue;
  };
  
  // Obtener información del usuario para mostrar en la cabecera
  const userType = getStorageValue('userType');
  const userName = getStorageValue('userName');
  const userLastName = getStorageValue('userLastName');

  return (
          <div className={styles.container}>
        <div className={styles.header}>
          <h1>Calificaciones</h1>
          <div className="flex justify-between items-center w-full mb-4">
            <div>
              {asignacion && (
                <>
                  <h2>{asignacion.aula?.nombre || 'Aula'}</h2>
                  <h3>{asignacion.materia?.nombre || 'Materia'} - {profesor}</h3>
                </>
              )}
              <div className="text-gray-600 mb-4">
                <span>Profesor: {profesor}</span>
              </div>
              <div className="text-gray-600 mb-4">
                <span>Periodo: {periodo}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.headerButtons}>
            <Link href="/sidebar" className={styles.backButton}>
              Volver al panel principal
            </Link>
          </div>
        </div>
      
      <div className={styles.content}>
        {/* Componente para buscar estudiantes por nombre y editar su ID */}
        

        
        {/* Sección de actividades */}
        <div className={styles.section} id="seccion-actividades">
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2>Actividades</h2>
              <button
                type="button"
                id="btn-tour-calificaciones"
                onClick={startTour}
                style={{ padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, background: '#f6f8fa', cursor: 'pointer' }}
                title="Ver guía rápida"
              >
                Guía
              </button>
              <div className={reportStyles.studentSelector}>
                <select 
                  className={reportStyles.studentSelect}
                  onChange={(e) => {
                    const estudianteId = e.target.value;
                    if (reportRef.current) {
                      reportRef.current.setEstudianteSeleccionado(estudianteId);
                    }
                  }}
                >
                  <option value="">Todos los estudiantes</option>
                  {alumnos.map((alumno) => (
                    <option key={alumno._id} value={alumno._id}>
                      {/* Mostrar nombre unificado por _id */}
                      {`${alumno.apellido || ''} ${alumno.nombre || ''}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                className={styles.toggleButton} 
                onClick={() => setActividadesVisible(!actividadesVisible)}
                aria-label={actividadesVisible ? 'Ocultar actividades' : 'Mostrar actividades'}
                title={actividadesVisible ? 'Ocultar actividades' : 'Mostrar actividades'}
              >
                {actividadesVisible ? 'Ocultar' : 'Mostrar'}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={actividadesVisible ? '' : styles.rotateIcon}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <button 
                id="btn-agregar-actividad"
                className={`${styles.addButton} ${momentosBloqueados[momentoActivo] ? styles.disabledButton : ''} ${ocultarElementoCSS('agregarActividad')}`} 
                onClick={openNewActividadForm}
                disabled={momentosBloqueados[momentoActivo]}
                title={momentosBloqueados[momentoActivo] ? `El momento ${momentoActivo} está bloqueado` : 'Agregar nueva actividad'}
              >
                Agregar Actividad
              </button>
            </div>
          </div>
          
          {actividades.length === 0 ? (
            <p>No hay actividades registradas para esta asignación.</p>
          ) : (
            <div className={actividadesVisible ? '' : styles.hidden}>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Fecha</th>
                      <th>Porcentaje</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                <tbody>
                {actividades
                  .filter(actividad => {
                    const momento = typeof actividad.momento === 'string' ? Number(actividad.momento) : actividad.momento;
                    return momento === momentoActivo;
                  })
                  .map(actividad => (
                    <tr key={actividad._id}>
                      <td>{actividad.nombre}</td>
                      <td>{actividad.descripcion || 'Sin descripción'}</td>
                      <td>{formatDate(actividad.fecha)}</td>
                      <td>{actividad.porcentaje}%</td>
                      <td>
                        <button 
                          className={`${styles.editButton} ${ocultarElementoCSS('editarActividad')}`} 
                          onClick={() => openEditActividadForm(actividad)}
                        >
                          Editar
                        </button>
                        <button 
                          className={`${styles.eliminarBtn} ${ocultarElementoCSS('eliminarActividad')}`} 
                          onClick={() => handleDeleteActividad(actividad._id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}>
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                          Eliminar
                        </button>
                        <button 
                          className={styles.calificacionButton} 
                          onClick={() => openNewCalificacionForm(actividad._id)}
                        >
                          Calificar
                        </button>
                        <button 
                          className={`${styles.calificacionButton} ${styles.batchButton}`} 
                          onClick={() => openBatchCalificacionForm(actividad._id)}
                          style={{backgroundColor: '#10b981', marginLeft: '5px'}}
                        >
                          Calificar por lote
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>)}
        </div>
        
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Alumnos y Calificaciones</h2>
            {/* Mensaje informativo sobre permisos */}
            {!esControl() && (
              <div style={{ 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '8px', 
                padding: '12px', 
                marginTop: '10px',
                color: '#856404',
                fontSize: '14px'
              }}>
                <strong>ℹ️ Información:</strong> Los puntos extras solo pueden ser modificados por el control de estudios. 
                Los docentes pueden calificar actividades pero no pueden agregar puntos adicionales.
              </div>
            )}
            <div className={styles.momentoNavigation}>
              <div className={styles.momentoButtonGroup}>
                <button 
                  className={`${styles.momentoButton} ${momentoActivo === 1 ? styles.activeMomento : ''}`}
                  onClick={() => {
                    console.log('CAMBIANDO A MOMENTO 1');
                    console.log('Estado actual puntosMomento1:', puntosMomento1);
                    
                    // Primero actualizar el momento activo
                    setMomentoActivo(1);
                    
                    // Forzar actualización de puntos adicionales con los valores del momento 1
                    const puntosMomento1Copiados = {...puntosMomento1};
                    setPuntosAdicionalesResumen(puntosMomento1Copiados);
                    
                    // Forzar re-renderizado
                    setTimeout(() => {
                      console.log('Puntos actualizados para Momento 1:', puntosMomento1Copiados);
                    }, 100);
                  }}
                >
                  Primer Momento
                </button>
                <button 
                  className={`${styles.lockButton} ${momentosBloqueados[1] ? styles.locked : styles.unlocked} ${ocultarCandadoCSS('candadoBloqueo')}`}
                  onClick={() => toggleBloqueoMomento(1)}
                  title={momentosBloqueados[1] ? 'Desbloquear momento' : 'Bloquear momento'}
                >
                  {momentosBloqueados[1] ? '🔒' : '🔓'}
                </button>
                <button 
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200 flex items-center gap-1"
                  onClick={() => generarPlanillaMomento(1)}
                  title="Generar planilla Excel del Primer Momento"
                >
                  📊 Planilla
                </button>
              </div>
              
              <div className={styles.momentoButtonGroup}>
                <button 
                  className={`${styles.momentoButton} ${momentoActivo === 2 ? styles.activeMomento : ''}`}
                  onClick={() => {
                    console.log('CAMBIANDO A MOMENTO 2');
                    console.log('Estado actual puntosMomento2:', puntosMomento2);
                    
                    // Primero actualizar el momento activo
                    setMomentoActivo(2);
                    
                    // Forzar actualización de puntos adicionales con los valores del momento 2
                    const puntosMomento2Copiados = {...puntosMomento2};
                    setPuntosAdicionalesResumen(puntosMomento2Copiados);
                    
                    // Forzar re-renderizado
                    setTimeout(() => {
                      console.log('Puntos actualizados para Momento 2:', puntosMomento2Copiados);
                    }, 100);
                  }}
                >
                  Segundo Momento
                </button>
                <button 
                  className={`${styles.lockButton} ${momentosBloqueados[2] ? styles.locked : styles.unlocked} ${ocultarCandadoCSS('candadoBloqueo')}`}
                  onClick={() => toggleBloqueoMomento(2)}
                  title={momentosBloqueados[2] ? 'Desbloquear momento' : 'Bloquear momento'}
                >
                  {momentosBloqueados[2] ? '🔒' : '🔓'}
                </button>
                <button 
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200 flex items-center gap-1"
                  onClick={() => generarPlanillaMomento(2)}
                  title="Generar planilla Excel del Segundo Momento"
                >
                  📊 Planilla
                </button>
              </div>
              
              <div className={styles.momentoButtonGroup}>
                <button 
                  className={`${styles.momentoButton} ${momentoActivo === 3 ? styles.activeMomento : ''}`}
                  onClick={() => {
                    console.log('CAMBIANDO A MOMENTO 3');
                    console.log('Estado actual puntosMomento3:', puntosMomento3);
                    
                    // Primero actualizar el momento activo
                    setMomentoActivo(3);
                    
                    // Forzar actualización de puntos adicionales con los valores del momento 3
                    const puntosMomento3Copiados = {...puntosMomento3};
                    setPuntosAdicionalesResumen(puntosMomento3Copiados);
                    
                    // Forzar re-renderizado
                    setTimeout(() => {
                      console.log('Puntos actualizados para Momento 3:', puntosMomento3Copiados);
                    }, 100);
                  }}
                >
                  Tercer Momento
                </button>
                <button 
                  className={`${styles.lockButton} ${momentosBloqueados[3] ? styles.locked : styles.unlocked} ${ocultarCandadoCSS('candadoBloqueo')}`}
                  onClick={() => toggleBloqueoMomento(3)}
                  title={momentosBloqueados[3] ? 'Desbloquear momento' : 'Bloquear momento'}
                >
                  {momentosBloqueados[3] ? '🔒' : '🔓'}
                </button>
                <button 
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200 flex items-center gap-1"
                  onClick={() => generarPlanillaMomento(3)}
                  title="Generar planilla Excel del Tercer Momento"
                >
                  📊 Planilla
                </button>
              </div>

              {asignacion?.aula?.esPendiente && (
                <div className={styles.momentoButtonGroup}>
                  <button 
                    className={`${styles.momentoButton} ${momentoActivo === 4 ? styles.activeMomento : ''}`}
                    onClick={() => {
                      console.log('CAMBIANDO A MOMENTO 4');
                      console.log('Estado actual puntosMomento4:', puntosMomento4);
                      
                      setMomentoActivo(4);
                      
                      const puntosMomento4Copiados = {...puntosMomento4};
                      setPuntosAdicionalesResumen(puntosMomento4Copiados);
                      
                      setTimeout(() => {
                        console.log('Puntos actualizados para Momento 4:', puntosMomento4Copiados);
                      }, 100);
                    }}
                  >
                    Cuarto Momento
                  </button>
                  <button 
                    className={`${styles.lockButton} ${momentosBloqueados[4] ? styles.locked : styles.unlocked} ${ocultarCandadoCSS('candadoBloqueo')}`}
                    onClick={() => toggleBloqueoMomento(4)}
                    title={momentosBloqueados[4] ? 'Desbloquear momento' : 'Bloquear momento'}
                  >
                    {momentosBloqueados[4] ? '🔒' : '🔓'}
                  </button>
                  <button 
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200 flex items-center gap-1"
                    onClick={() => generarPlanillaMomento(4)}
                    title="Generar planilla Excel del Cuarto Momento"
                  >
                    📊 Planilla
                  </button>
                </div>
              )}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button
                className={styles.calificacionButton}
                onClick={openPreviewNotas}
                style={{ backgroundColor: '#6366f1' }}
              >
                Previsualizar notas
              </button>
            </div>
          </div>
          
          {alumnos.length === 0 ? (
            <p>No hay alumnos asignados a esta materia.</p>
          ) : (
            <div className={styles.momentTables}>
              {/* TABLA DEL PRIMER MOMENTO */}
              {momentoActivo === 1 && (
                <div className={styles.momentSection}>
                {mensajePromedios.texto && (
                  <div className={`${styles.mensaje} ${mensajePromedios.tipo === 'error' ? styles.mensajeError : styles.mensajeExito}`}>
                    {mensajePromedios.texto}
                  </div>
                )}
                <div className={styles.momentHeader}>
                  <h3 className={styles.momentTitle}>Calificaciones del Primer Momento</h3>
                  <div className={styles.botonesContainer}>
                    {esControl() && (
                      <button 
                        className={styles.botonGuardar} 
                        onClick={() => guardarPuntosMomento('momento1')} 
                        disabled={guardandoPuntosMomento || momentosBloqueados[1]}
                      >
                        {guardandoPuntosMomento ? 'Guardando...' : 'Guardar Puntos Extras'}
                      </button>
                    )}
                  </div>
                </div>
                {mensajePuntosMomento && (
                  <div className={`${styles.mensaje} ${mensajePuntosMomento.tipo === 'error' ? styles.mensajeError : styles.mensajeExito}`}>
                    {mensajePuntosMomento.texto}
                  </div>
                )}
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        {actividades
                          .filter(act => {
                            // Convertir a número si es una cadena
                            const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
                            return momento === 1 || momento === undefined || momento === null;
                          })
                          .map((actividad) => (
                            <th key={actividad._id}>{actividad.nombre}</th>
                          ))}
                        <th>Promedio</th>
                        <th>Puntos Extras</th>
                        <th>Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.map((alumno) => {
                        const alumnoId = alumno._id || alumno.id; // Asegurar que tenemos un ID válido
                        
                        // Filtrar actividades del momento actual
                        const actividadesMomento = actividades.filter(act => {
                          const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
                          return momento === momentoActivo;
                        });

                        // Preparar calificaciones válidas con sus porcentajes
                        const calificacionesValidas = actividadesMomento.reduce((acumulado, actividad) => {
                          const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumnoId);
                          if (!calificacion) return acumulado;

                          let notaConvertida = null;
                          if (calificacion.tipoCalificacion === 'alfabetica') {
                            notaConvertida = convertirLetraANota(calificacion.notaAlfabetica);
                          } else if (calificacion.nota !== null && calificacion.nota !== undefined) {
                            notaConvertida = parseFloat(calificacion.nota);
                          }

                          if (notaConvertida === null || Number.isNaN(notaConvertida)) {
                            return acumulado;
                          }

                          acumulado.push({
                            nota: notaConvertida,
                            porcentaje: parseFloat(actividad.porcentaje) || 0
                          });
                          return acumulado;
                        }, []);
                        
                        let promedioNumerico = null;
                        if (calificacionesValidas.length > 0) {
                          // Usar la misma regla: suma(nota * porcentaje/100) sin dividir entre la suma de porcentajes
                          const sumaPonderada = calificacionesValidas.reduce(
                            (sum, item) => sum + (item.nota * (item.porcentaje / 100)),
                            0
                          );
                          promedioNumerico = sumaPonderada;

                          if (!Number.isFinite(promedioNumerico)) {
                            promedioNumerico = null;
                          }
                        }
                        
                        const promedioAlfabetico = promedioNumerico !== null
                          ? convertirNotaALetra(promedioNumerico)
                          : 'N/A';
                        
                        const promedio = promedioNumerico !== null ? promedioNumerico.toFixed(2) : 'N/A';
                
                        return (
                          <tr key={`alumno-${alumno._id || alumno.id}-m1`}>
                            <td>
                              <StudentNameById studentId={alumno._id || alumno.id} fallback={alumno} />
                            </td>
                            {actividadesMomento.map((actividad) => {
                              const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumnoId);
                              return (
                                <td key={`cal-${alumnoId}-${actividad._id}-m1`}>
                                  <div>
                                    {calificacion ? (
                                      <>
                                        {calificacion.tipoCalificacion === 'alfabetica' ? (
                                          <span title={`Nota numérica equivalente: ${calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : 'N/A'}`}>
                                            {calificacion.notaAlfabetica || 'N/A'}
                                          </span>
                                        ) : calificacion.tipoCalificacion === 'np' ? (
                                          <span style={{ color: '#FF9800', fontWeight: 'bold' }} title="No Presentó">
                                            NP
                                          </span>
                                        ) : calificacion.tipoCalificacion === 'inasistente' ? (
                                          <span style={{ color: '#FF9800', fontWeight: 'bold' }} title="Inasistente">
                                            I
                                          </span>
                                        ) : (
                                          <span title={`Nota alfabética equivalente: ${calificacion.notaAlfabetica || 'N/A'}`}>
                                            {calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : 'N/A'}
                                          </span>
                                        )}
                                        
                                        {/* Ícono de observaciones */}
                                        {calificacion.observaciones && (
                                          <span 
                                            title={calificacion.observaciones}
                                            onClick={() => mostrarObservaciones(`Observaciones para ${alumno.apellido} ${alumno.nombre}`, calificacion.observaciones)}
                                            style={{ 
                                              marginLeft: '5px', 
                                              cursor: 'pointer',
                                              color: '#4CAF50'
                                            }}
                                          >
                                            📝
                                          </span>
                                        )}
                                        
                                        {/* Ícono de evidencia - Destacado para que sea más visible */}
                                        {calificacion.evidencia && (
                                          <span 
                                            title="Ver evidencia"
                                            onClick={() => mostrarEvidencia(calificacion.evidencia, `Evidencia de ${alumno.apellido} ${alumno.nombre}`)}
                                            style={{ 
                                              marginLeft: '5px', 
                                              cursor: 'pointer',
                                              color: '#E91E63',
                                              fontSize: '1.2em',
                                              fontWeight: 'bold'
                                            }}
                                          >
                                            📷
                                          </span>
                                        )}
                                      </>
                                    ) : 'N/A'}
                                  </div>
                                  <button 
                                    className={styles.smallButton}
                                    onClick={() => {
                                      if (calificacion) {
                                        openEditCalificacionForm(actividad, calificacion);
                                      } else {
                                        setCalificacionFormData({
                                          actividadId: actividad._id,
                                          alumnoId: alumno._id || alumno.id,
                                          nota: 10,
                                          modoEdicion: false,
                                          calificacionId: null,
                                          observaciones: '',
                                          evidencia: '',
                                          tipoCalificacion: 'numerica'
                                        });
                                        // Limpiar estados de imagen
                                        setImagenSeleccionada(null);
                                        setPreviewUrl('');
                                        setShowCalificacionForm(true);
                                      }
                                    }}
                                  >
                                    {calificacion ? 'Editar' : 'Calificar'}
                                  </button>
                                </td>
                              );
                            })}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{promedio}</span>
                                <span style={{ 
                                  marginLeft: '8px', 
                                  fontWeight: 'bold', 
                                  color: promedioAlfabetico === 'A' ? '#4CAF50' : 
                                         promedioAlfabetico === 'B' ? '#8BC34A' : 
                                         promedioAlfabetico === 'C' ? '#FFC107' : 
                                         promedioAlfabetico === 'D' ? '#FF9800' : 
                                         promedioAlfabetico === 'E' ? '#FF5722' : 
                                         promedioAlfabetico === 'F' ? '#F44336' : '#757575'
                                }}>
                                  {promedioAlfabetico}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <div style={{ 
                                  fontWeight: 'bold', 
                                  fontSize: '16px',
                                  color: '#4285F4',
                                  backgroundColor: '#E8F0FE',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #4285F4',
                                  marginBottom: '5px'
                                }}>
                                  {(() => {
                                    // Obtener el ID del alumno como string para consistencia
                                    const alumnoIdStr = alumnoId.toString();
                                    
                                    // Simplificar la lógica para mostrar puntos extras
                                    let valorPuntos = 0; // Valor por defecto
                                    const momentoKey = `momento${momentoActivo}`;
                                    
                                    // 1. Verificar primero en la estructura de la base de datos
                                    if (asignacion && asignacion.puntosPorMomento && 
                                        asignacion.puntosPorMomento[momentoKey] && 
                                        Array.isArray(asignacion.puntosPorMomento[momentoKey])) {
                                      
                                      console.log(`PUNTOS-DIV - Buscando en ${momentoKey} para alumno ${alumnoIdStr}`);
                                      console.log(`PUNTOS-DIV - Datos disponibles:`, asignacion.puntosPorMomento[momentoKey]);
                                      
                                      // Buscar el alumno en el array de puntos
                                      const puntoAlumno = asignacion.puntosPorMomento[momentoKey].find(
                                        p => p.alumnoId === alumnoIdStr || 
                                             (p.alumnoId && p.alumnoId.toString() === alumnoIdStr)
                                      );
                                      
                                      if (puntoAlumno && puntoAlumno.puntos !== undefined) {
                                        valorPuntos = Number(puntoAlumno.puntos);
                                        console.log(`PUNTOS-DIV - Encontrado en DB: ${valorPuntos}`);
                                      }
                                    }
                                    
                                    // 2. Si no se encontró en la DB, buscar en los estados locales
                                    if (valorPuntos === 0) {
                                      // Verificar en los estados específicos del momento
                                      switch(momentoActivo) {
                                        case 1:
                                          if (puntosMomento1[alumnoIdStr]) {
                                            valorPuntos = puntosMomento1[alumnoIdStr];
                                            console.log(`PUNTOS-DIV - Usando estado local momento1: ${valorPuntos}`);
                                          }
                                          break;
                                        case 2:
                                          if (puntosMomento2[alumnoIdStr]) {
                                            valorPuntos = puntosMomento2[alumnoIdStr];
                                            console.log(`PUNTOS-DIV - Usando estado local momento2: ${valorPuntos}`);
                                          }
                                          break;
                                        case 3:
                                          if (puntosMomento3[alumnoIdStr]) {
                                            valorPuntos = puntosMomento3[alumnoIdStr];
                                            console.log(`PUNTOS-DIV - Usando estado local momento3: ${valorPuntos}`);
                                          }
                                          break;
                                      }
                                    }
                                    
                                    console.log(`PUNTOS-DIV - Valor final para alumno ${alumnoIdStr}: ${valorPuntos}`);
                                    return valorPuntos;
                                  })()}
                                </div>
                                {(() => {
                                  // Obtener el ID del alumno como string para consistencia
                                  const alumnoIdStr = alumnoId.toString();
                                  
                                  // Obtener la calificación base (promedio)
                                  const notaBase = promedioNumerico !== null ? Math.round(promedioNumerico) : 0;
                                  
                                  // Simplificar la lógica para mostrar puntos extras en el input
                                  let valorPuntos = 0; // Valor por defecto
                                  const momentoKey = `momento${momentoActivo}`;
                                  
                                  // 1. Verificar primero en la estructura de la base de datos
                                  if (asignacion && asignacion.puntosPorMomento && 
                                      asignacion.puntosPorMomento[momentoKey] && 
                                      Array.isArray(asignacion.puntosPorMomento[momentoKey])) {
                                    
                                    // Buscar el alumno en el array de puntos
                                    const puntoAlumno = asignacion.puntosPorMomento[momentoKey].find(
                                      p => p.alumnoId === alumnoIdStr || 
                                           (p.alumnoId && p.alumnoId.toString() === alumnoIdStr)
                                    );
                                    
                                    if (puntoAlumno && puntoAlumno.puntos !== undefined) {
                                      valorPuntos = Number(puntoAlumno.puntos);
                                    }
                                  }
                                  
                                  // 2. Si no se encontró en la DB, buscar en los estados locales
                                  if (valorPuntos === 0) {
                                    // Verificar en los estados específicos del momento
                                    switch(momentoActivo) {
                                      case 1:
                                        if (puntosMomento1[alumnoIdStr]) {
                                          valorPuntos = puntosMomento1[alumnoIdStr];
                                        }
                                        break;
                                      case 2:
                                        if (puntosMomento2[alumnoIdStr]) {
                                          valorPuntos = puntosMomento2[alumnoIdStr];
                                        }
                                        break;
                                      case 3:
                                        if (puntosMomento3[alumnoIdStr]) {
                                          valorPuntos = puntosMomento3[alumnoIdStr];
                                        }
                                        break;
                                    }
                                  }
                                  
                                  // Determinar si se debe deshabilitar el input
                                  const isDisabled = notaBase >= 20 || momentosBloqueados[momentoActivo] || !esControl();
                                  
                                  // Calcular el máximo de puntos extras permitidos
                                  const maxPuntosPermitidos = notaBase >= 20 ? 0 : Math.min(2, 20 - notaBase);
                                  
                                  return (
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxPuntosPermitidos}
                                      step="0.5"
                                      value={valorPuntos}
                                      onChange={(e) => {
                                        // Solo permitir cambios si es control de estudios
                                        if (!esControl()) {
                                          return;
                                        }
                                        
                                        // Validar que el valor sea un número válido y no exceda el máximo permitido
                                        const valor = parseFloat(e.target.value);
                                        if (!isNaN(valor) && valor >= 0 && valor <= maxPuntosPermitidos) {
                                          console.log(`Cambiando puntos para alumno ${alumnoId} en momento ${momentoActivo} a: ${valor}`);
                                          handlePuntosMomentoChange(
                                            `momento${momentoActivo}`,
                                            alumnoId.toString(),
                                            valor
                                          );
                                        } else if (valor > maxPuntosPermitidos) {
                                          // Si el valor excede el máximo, establecer al máximo permitido
                                          handlePuntosMomentoChange(
                                            `momento${momentoActivo}`,
                                            alumnoId.toString(),
                                            maxPuntosPermitidos
                                          );
                                        }
                                      }}
                                      style={{ 
                                        width: '60px', 
                                        textAlign: 'center',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        padding: '4px',
                                        backgroundColor: isDisabled ? '#f0f0f0' : 'white',
                                        cursor: isDisabled ? 'not-allowed' : 'auto'
                                      }}
                                      disabled={isDisabled}
                                      title={
                                        !esControl() 
                                          ? 'Solo el control de estudios puede modificar puntos extras'
                                          : notaBase >= 20 
                                            ? 'No se pueden agregar puntos extras cuando la calificación es 20' 
                                            : `Máximo ${maxPuntosPermitidos} puntos permitidos`
                                      }
                                    />
                                  );
                                })()}
                                <small style={{ marginTop: '4px', color: '#666' }}>
                                  Puntos extras
                                  {!esControl() && (
                                    <span style={{ color: '#f44336', fontSize: '10px', display: 'block' }}>
                                      Solo control de estudios
                                    </span>
                                  )}
                                </small>
                              </div>
                            </td>
                            <td>
                              {promedioNumerico !== null ? (
                                <div style={{ 
                                  fontWeight: 'bold', 
                                  color: (promedioNumerico + 
                                    (momentoActivo === 1 ? (puntosMomento1[alumnoId.toString()] || 0) : 
                                     momentoActivo === 2 ? (puntosMomento2[alumnoId.toString()] || 0) : 
                                     (puntosMomento3[alumnoId.toString()] || 0))) >= 10 ? '#4CAF50' : '#F44336' 
                                }}>
                                  {(() => {
                                    // Obtener los puntos extras del momento actual
                                    const alumnoIdStr = alumnoId.toString();
                                    const puntosExtra = momentoActivo === 1 ? (puntosMomento1[alumnoIdStr] || 0) :
                                                      momentoActivo === 2 ? (puntosMomento2[alumnoIdStr] || 0) :
                                                      (puntosMomento3[alumnoIdStr] || 0);
                                    
                                    // Calcular la nota final (limitada a 20)
                                    const notaFinal = Math.min(20, Math.round(promedioNumerico + puntosExtra));
                                    
                                    // Si hay puntos extras, mostrar en formato "base+extras"
                                    if (puntosExtra > 0) {
                                      return `${Math.round(promedioNumerico)}+${puntosExtra}`;
                                    } else {
                                      return notaFinal;
                                    }
                                  })()}
                                </div>
                              ) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            
            {/* TABLA DEL SEGUNDO MOMENTO */}
            {momentoActivo === 2 && (
              <div className={styles.momentSection}>
                {mensajePromedios.texto && (
                  <div className={`${styles.mensaje} ${mensajePromedios.tipo === 'error' ? styles.mensajeError : styles.mensajeExito}`}>
                    {mensajePromedios.texto}
                  </div>
                )}
                <div className={styles.momentHeader}>
                  <h3 className={styles.momentTitle}>Calificaciones del Segundo Momento</h3>
                  <div className={styles.botonesContainer}>
                    {esControl() && (
                      <button 
                        className={styles.botonGuardar} 
                        onClick={() => {
                          setGuardandoPuntosMomento(true);
                          guardarPuntosMomento('momento2').then(() => {
                            setGuardandoPuntosMomento(false);
                            setMensajePuntosMomento({
                              texto: 'Puntos extras guardados correctamente',
                              tipo: 'exito'
                            });
                            setTimeout(() => setMensajePuntosMomento(null), 3000);
                          }).catch(error => {
                            setGuardandoPuntosMomento(false);
                            setMensajePuntosMomento({
                              texto: 'Error al guardar los puntos extras',
                              tipo: 'error'
                            });
                          });
                        }} 
                        disabled={guardandoPuntosMomento || momentosBloqueados[2]}
                      >
                        {guardandoPuntosMomento ? 'Guardando...' : 'Guardar Puntos Extras'}
                      </button>
                    )}
                  </div>
                </div>
                {mensajePuntosMomento && (
                  <div className={`${styles.mensaje} ${mensajePuntosMomento.tipo === 'error' ? styles.mensajeError : styles.mensajeExito}`}>
                    {mensajePuntosMomento.texto}
                  </div>
                )}
                <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    {actividades
                      .filter(act => {
                        // Convertir a número si es una cadena
                        const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
                        return momento === 2;
                      })
                      .map((actividad) => (
                        <th key={actividad._id}>{actividad.nombre}</th>
                      ))}
                    <th>Promedio</th>
                    <th>Puntos Extras</th>
                    <th>Final</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((alumno) => {
                    // Calcular el promedio de calificaciones para este alumno - Segundo Momento
                    let totalNotas = 0;
                    let totalActividades = 0;
                    let usarCalificacionAlfabetica = asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación';
                    let notasAlfabeticas = [];
                    
                    // Filtrar solo las actividades del segundo momento
                    const actividadesMomento2 = actividades.filter(act => {
                      // Convertir a número si es una cadena
                      const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
                      return momento === 2;
                    });
                    
                    actividadesMomento2.forEach(actividad => {
                      const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumno._id || alumno.id);
                      if (calificacion) {
                        // Solo incluir si no es NP o Inasistente
                        if (calificacion.tipoCalificacion !== 'np' && calificacion.tipoCalificacion !== 'inasistente') {
                          if (usarCalificacionAlfabetica) {
                            const notaParaConvertir = calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : 0;
                            notasAlfabeticas.push(calificacion.notaAlfabetica || convertirNotaALetra(notaParaConvertir));
                          } else {
                            const notaNum = calificacion.nota !== null && calificacion.nota !== undefined ? parseFloat(calificacion.nota) : 0;
                            if (!isNaN(notaNum)) {
                              totalNotas += notaNum;
                            }
                          }
                          totalActividades++;
                        }
                      }
                    });
                    
                    let promedioNumerico = null;
                    let promedioAlfabetico = 'N/A';
                    
                    if (totalActividades > 0) {
                      if (usarCalificacionAlfabetica) {
                        // Calcular promedio alfabético
                        const conteoNotas = {
                          'A': 0, 'B': 0, 'C': 0, 'D': 0
                        };
                        
                        notasAlfabeticas.forEach(nota => {
                          if (conteoNotas.hasOwnProperty(nota)) {
                            conteoNotas[nota]++;
                          }
                        });
                        
                        // Determinar la nota más frecuente
                        let maxCount = 0;
                        let notaMasFrecuente = 'D';
                        
                        for (const [nota, count] of Object.entries(conteoNotas)) {
                          if (count > maxCount || (count === maxCount && nota < notaMasFrecuente)) {
                            maxCount = count;
                            notaMasFrecuente = nota;
                          }
                        }
                        
                        promedioAlfabetico = notaMasFrecuente;
                        promedioNumerico = convertirLetraANota(promedioAlfabetico);
                      } else {
                        // Calcular promedio numérico
                        promedioNumerico = totalNotas / totalActividades;
                        promedioAlfabetico = convertirNotaALetra(promedioNumerico);
                      }
                    }
                    
                    // Formatear el promedio para mostrarlo
                    const promedio = usarCalificacionAlfabetica ? promedioAlfabetico : (promedioNumerico !== null ? promedioNumerico.toFixed(2) : 'N/A');
                
                return (
                  <tr key={`alumno-${alumno._id || alumno.id}`}>
                    <td>
                      <StudentNameById studentId={alumno._id || alumno.id} fallback={alumno} />
                    </td>
                    {actividadesMomento2.map((actividad) => {
                      const alumnoId = alumno._id || alumno.id;
                      const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumnoId);
                      return (
                        <td key={`cal-${alumnoId}-${actividad._id}`}>
                          <div>
                            {calificacion ? (
                              <>
                                {calificacion.tipoCalificacion === 'alfabetica' ? (
                                  <span title={`Nota numérica equivalente: ${calificacion.nota}`}>
                                    {calificacion.notaAlfabetica || 'N/A'}
                                  </span>
                                ) : calificacion.tipoCalificacion === 'np' ? (
                                  <span style={{ color: '#FF9800', fontWeight: 'bold' }} title="No Presentó">
                                    NP
                                  </span>
                                ) : calificacion.tipoCalificacion === 'inasistente' ? (
                                  <span style={{ color: '#FF9800', fontWeight: 'bold' }} title="Inasistente">
                                    I
                                  </span>
                                ) : (
                                  <span title={`Nota alfabética equivalente: ${calificacion.notaAlfabetica || 'N/A'}`}>
                                    {calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : 'N/A'}
                                  </span>
                                )}
                              </>
                            ) : 'N/A'}
                            {calificacion && calificacion.observaciones && (
                               <span 
                                 title={calificacion.observaciones}
                                 onClick={() => mostrarObservaciones(`Observaciones para ${alumno.nombre} ${alumno.apellido}`, calificacion.observaciones)}
                                 style={{ 
                                   marginLeft: '5px', 
                                   cursor: 'pointer',
                                   color: '#4CAF50'
                                 }}
                               >
                                 📝
                               </span>
                             )}
                             {calificacion && calificacion.evidencia && (
                               <span 
                                 title="Ver evidencia"
                                 onClick={() => mostrarEvidencia(calificacion.evidencia, `Evidencia de ${alumno.nombre} ${alumno.apellido}`)}
                                 style={{ 
                                   marginLeft: '5px', 
                                   cursor: 'pointer',
                                   color: '#E91E63',
                                   fontSize: '1.2em',
                                   fontWeight: 'bold'
                                 }}
                               >
                                 📷
                               </span>
                             )}
                          </div>
                          <button 
                            className={styles.smallButton}
                            onClick={() => {
                              if (calificacion) {
                                openEditCalificacionForm(actividad, calificacion);
                              } else {
                                setCalificacionFormData({
                                  actividadId: actividad._id,
                                  alumnoId: alumno._id || alumno.id,
                                  nota: 10,
                                  notaAlfabetica: 'C',
                                  tipoCalificacion: 'numerica',
                                  modoEdicion: false,
                                  calificacionId: null,
                                  observaciones: ''
                                });
                                setShowCalificacionForm(true);
                              }
                            }}
                          >
                            {calificacion ? 'Editar' : 'Calificar'}
                          </button>
                        </td>
                      );
                    })}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{promedio}</span>
                        <span style={{ 
                          marginLeft: '8px', 
                          fontWeight: 'bold', 
                          color: promedioAlfabetico === 'A' ? '#4CAF50' : 
                                 promedioAlfabetico === 'B' ? '#8BC34A' : 
                                 promedioAlfabetico === 'C' ? '#FFC107' : 
                                 promedioAlfabetico === 'D' ? '#FF9800' : 
                                 promedioAlfabetico === 'E' ? '#FF5722' : 
                                 promedioAlfabetico === 'F' ? '#F44336' : '#757575'
                        }}>
                          {promedioAlfabetico}
                        </span>
                      </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                         <div style={{ 
                           fontWeight: 'bold', 
                           fontSize: '16px',
                           color: '#4285F4',
                           backgroundColor: '#E8F0FE',
                           padding: '3px 8px',
                           borderRadius: '4px',
                           border: '1px solid #4285F4',
                           marginBottom: '5px'
                         }}>
                           {(() => {
                             const alumnoIdStr = alumno._id.toString();
                             let valorPuntos = 0;
                             const momentoKey = `momento2`;
                             
                             if (asignacion && asignacion.puntosPorMomento && 
                                 asignacion.puntosPorMomento[momentoKey] && 
                                 Array.isArray(asignacion.puntosPorMomento[momentoKey])) {
                               
                               const puntoAlumno = asignacion.puntosPorMomento[momentoKey].find(
                                 p => p.alumnoId === alumnoIdStr || 
                                      (p.alumnoId && p.alumnoId.toString() === alumnoIdStr)
                               );
                               
                               if (puntoAlumno && puntoAlumno.puntos !== undefined) {
                                 valorPuntos = Number(puntoAlumno.puntos);
                               }
                             }
                             
                             if (valorPuntos === 0) {
                               if (puntosMomento2[alumnoIdStr]) {
                                 valorPuntos = puntosMomento2[alumnoIdStr];
                               } 
                             }
                             
                             return valorPuntos;
                           })()}
                         </div>
                         {(() => {
                           const alumnoIdStr = alumno._id.toString();
                           const notaBase = promedioNumerico !== null ? Math.round(promedioNumerico) : 0;
                           let valorPuntos = 0;
                           const momentoKey = `momento2`;
                           
                           if (asignacion && asignacion.puntosPorMomento && 
                               asignacion.puntosPorMomento[momentoKey] && 
                               Array.isArray(asignacion.puntosPorMomento[momentoKey])) {
                             const puntoAlumno = asignacion.puntosPorMomento[momentoKey].find(
                               p => p.alumnoId === alumnoIdStr || 
                                    (p.alumnoId && p.alumnoId.toString() === alumnoIdStr)
                             );
                             
                             if (puntoAlumno && puntoAlumno.puntos !== undefined) {
                               valorPuntos = Number(puntoAlumno.puntos);
                             }
                           }
                           
                           if (valorPuntos === 0) {
                             if (puntosMomento2[alumnoIdStr]) {
                               valorPuntos = puntosMomento2[alumnoIdStr];
                             } 
                           }
                           
                           const isDisabled = notaBase >= 20 || momentosBloqueados[2];
                           const maxPuntosPermitidos = notaBase >= 20 ? 0 : Math.min(2, 20 - notaBase);
                           
                           return (
                             <input
                               type="number"
                               min="0"
                               max={maxPuntosPermitidos}
                               step="0.5"
                               value={valorPuntos}
                               onChange={(e) => {
                                 const valor = parseFloat(e.target.value);
                                 if (!isNaN(valor) && valor >= 0 && valor <= maxPuntosPermitidos) {
                                   handlePuntosMomentoChange(
                                     `momento2`,
                                     alumno._id.toString(),
                                     valor
                                   );
                                 } else if (valor > maxPuntosPermitidos) {
                                   handlePuntosMomentoChange(
                                     `momento2`,
                                     alumno._id.toString(),
                                     maxPuntosPermitidos
                                   );
                                 }
                               }}
                               style={{ 
                                 width: '60px', 
                                 textAlign: 'center',
                                 border: '1px solid #ccc',
                                 borderRadius: '4px',
                                 padding: '4px',
                                 backgroundColor: isDisabled ? '#f0f0f0' : 'white',
                                 cursor: isDisabled ? 'not-allowed' : 'auto'
                               }}
                               disabled={isDisabled}
                               title={notaBase >= 20 ? 'No se pueden agregar puntos extras cuando la calificación es 20' : `Máximo ${maxPuntosPermitidos} puntos permitidos`}
                             />
                           );
                         })()}
                         <small style={{ marginTop: '4px', color: '#666' }}>Puntos extras</small>
                       </div>
                     </td>
                     <td>
                       {promedioNumerico !== null ? (
                         <div style={{ 
                           fontWeight: 'bold', 
                           color: (promedioNumerico + 
                             (puntosMomento2[alumno._id.toString()] || 0)) >= 10 ? '#4CAF50' : '#F44336' 
                         }}>
                           {(() => {
                             const puntosExtra = puntosMomento2[alumno._id.toString()] || 0;
                             
                             const notaFinal = Math.min(20, Math.round(promedioNumerico + puntosExtra));
                             
                             if (puntosExtra > 0) {
                               return `${Math.round(promedioNumerico)}+${puntosExtra}`;
                             } else {
                               return notaFinal;
                             }
                           })()} 
                         </div>
                       ) : 'N/A'}
                     </td>
                  </tr>
                );
              })}
                </tbody>
              </table>
              </div>
            )}
            
            {/* TABLA DEL TERCER MOMENTO */}
            {momentoActivo === 3 && (
              <div className={styles.momentSection}>
                <div className={styles.momentHeader}>
                  <h3 className={styles.momentTitle}>Calificaciones del Tercer Momento</h3>
                  <div className={styles.botonesContainer}>
                    {esControl() && (
                      <button 
                        className={styles.botonGuardar} 
                        onClick={() => {
                          setGuardandoPuntosMomento(true);
                          guardarPuntosMomento('momento3').then(() => {
                            setGuardandoPuntosMomento(false);
                            setMensajePuntosMomento({
                              texto: 'Puntos extras guardados correctamente',
                              tipo: 'exito'
                            });
                            setTimeout(() => setMensajePuntosMomento(null), 3000);
                          }).catch(error => {
                            setGuardandoPuntosMomento(false);
                            setMensajePuntosMomento({
                              texto: 'Error al guardar los puntos extras',
                              tipo: 'error'
                            });
                          });
                        }} 
                        disabled={guardandoPuntosMomento || momentosBloqueados[3]}
                      >
                        {guardandoPuntosMomento ? 'Guardando...' : 'Guardar Puntos Extras'}
                      </button>
                    )}
                  </div>
                </div>
                {mensajePuntosMomento && (
                  <div className={`${styles.mensaje} ${mensajePuntosMomento.tipo === 'error' ? styles.mensajeError : styles.mensajeExito}`}>
                    {mensajePuntosMomento.texto}
                  </div>
                )}
                <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    {actividades
                      .filter(act => {
                        // Convertir a número si es una cadena
                        const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
                        return momento === 3;
                      })
                      .map((actividad) => (
                        <th key={actividad._id}>{actividad.nombre}</th>
                      ))}
                    <th>Promedio</th>
                    <th>Puntos Extras</th>
                    <th>Final</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((alumno) => {
                    // Calcular el promedio de calificaciones para este alumno - Tercer Momento
                    let totalNotas = 0;
                    let totalActividades = 0;
                    let usarCalificacionAlfabetica = asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación';
                    let notasAlfabeticas = [];
                    
                    // Filtrar solo las actividades del tercer momento
                    const actividadesMomento3 = actividades.filter(act => {
                      // Convertir a número si es una cadena
                      const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
                      return momento === 3;
                    });
                    
                    actividadesMomento3.forEach(actividad => {
                      const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumno._id || alumno.id);
                      if (calificacion) {
                        // Solo incluir si no es NP o Inasistente
                        if (calificacion.tipoCalificacion !== 'np' && calificacion.tipoCalificacion !== 'inasistente') {
                          if (usarCalificacionAlfabetica) {
                            const notaParaConvertir = calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : 0;
                            notasAlfabeticas.push(calificacion.notaAlfabetica || convertirNotaALetra(notaParaConvertir));
                          } else {
                            const notaNum = calificacion.nota !== null && calificacion.nota !== undefined ? parseFloat(calificacion.nota) : 0;
                            if (!isNaN(notaNum)) {
                              totalNotas += notaNum;
                            }
                          }
                          totalActividades++;
                        }
                      }
                    });
                    
                    let promedioNumerico = null;
                    let promedioAlfabetico = 'N/A';
                    
                    if (totalActividades > 0) {
                      if (usarCalificacionAlfabetica) {
                        // Calcular promedio alfabético
                        const conteoNotas = {
                          'A': 0, 'B': 0, 'C': 0, 'D': 0
                        };
                        
                        notasAlfabeticas.forEach(nota => {
                          if (conteoNotas.hasOwnProperty(nota)) {
                            conteoNotas[nota]++;
                          }
                        });
                        
                        // Determinar la nota más frecuente
                        let maxCount = 0;
                        let notaMasFrecuente = 'D';
                        
                        for (const [nota, count] of Object.entries(conteoNotas)) {
                          if (count > maxCount || (count === maxCount && nota < notaMasFrecuente)) {
                            maxCount = count;
                            notaMasFrecuente = nota;
                          }
                        }
                        
                        promedioAlfabetico = notaMasFrecuente;
                        promedioNumerico = convertirLetraANota(promedioAlfabetico);
                      } else {
                        // Calcular promedio numérico
                        promedioNumerico = totalNotas / totalActividades;
                        promedioAlfabetico = convertirNotaALetra(promedioNumerico);
                      }
                    }
                    
                    // Formatear el promedio para mostrarlo
                    const promedio = usarCalificacionAlfabetica ? promedioAlfabetico : (promedioNumerico !== null ? promedioNumerico.toFixed(2) : 'N/A');
                
                return (
                  <tr key={`alumno-${alumno._id || alumno.id}`}>
                    <td>
                      <StudentNameById studentId={alumno._id || alumno.id} fallback={alumno} />
                    </td>
                    {actividadesMomento3.map((actividad) => {
                      const alumnoId = alumno._id || alumno.id;
                      const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumnoId);
                      console.log(`Mostrando calificación para ${alumno.nombre} en ${actividad.nombre}:`, calificacion);
                      return (
                        <td key={`cal-${alumnoId}-${actividad._id}`}>
                          <div>
                            {calificacion ? (
                              <>
                                {calificacion.tipoCalificacion === 'alfabetica' ? (
                                  <span title={`Nota numérica equivalente: ${calificacion.nota}`}>
                                    {calificacion.notaAlfabetica || 'N/A'}
                                  </span>
                                ) : calificacion.tipoCalificacion === 'np' ? (
                                  <span style={{ color: '#FF9800', fontWeight: 'bold' }} title="No Presentó">
                                    NP
                                  </span>
                                ) : calificacion.tipoCalificacion === 'inasistente' ? (
                                  <span style={{ color: '#FF9800', fontWeight: 'bold' }} title="Inasistente">
                                    I
                                  </span>
                                ) : (
                                  <span title={`Nota alfabética equivalente: ${calificacion.notaAlfabetica || 'N/A'}`}>
                                    {calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : 'N/A'}
                                  </span>
                                )}
                              </>
                            ) : 'N/A'}
                            {calificacion && calificacion.observaciones && (
                               <span 
                                 title={calificacion.observaciones}
                                 onClick={() => mostrarObservaciones(`Observaciones para ${alumno.nombre} ${alumno.apellido}`, calificacion.observaciones)}
                                 style={{ 
                                   marginLeft: '5px', 
                                   cursor: 'pointer',
                                   color: '#4CAF50'
                                 }}
                               >
                                 📝
                               </span>
                             )}
                             {calificacion && calificacion.evidencia && (
                               <span 
                                 title="Ver evidencia"
                                 onClick={() => mostrarEvidencia(calificacion.evidencia, `Evidencia de ${alumno.nombre} ${alumno.apellido}`)}
                                 style={{ 
                                   marginLeft: '5px', 
                                   cursor: 'pointer',
                                   color: '#E91E63',
                                   fontSize: '1.2em',
                                   fontWeight: 'bold'
                                 }}
                               >
                                 📷
                               </span>
                             )}
                          </div>
                          <button 
                            className={styles.smallButton}
                            onClick={() => {
                              if (calificacion) {
                                openEditCalificacionForm(actividad, calificacion);
                              } else {
                                setCalificacionFormData({
                                  actividadId: actividad._id,
                                  alumnoId: alumno._id || alumno.id,
                                  nota: 10,
                                  notaAlfabetica: 'C',
                                  tipoCalificacion: 'numerica',
                                  modoEdicion: false,
                                  calificacionId: null,
                                  observaciones: ''
                                });
                                setShowCalificacionForm(true);
                              }
                            }}
                          >
                            {calificacion ? 'Editar' : 'Calificar'}
                          </button>
                        </td>
                      );
                    })}

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{promedio}</span>
                        <span style={{ 
                          marginLeft: '8px', 
                          fontWeight: 'bold', 
                          color: promedioAlfabetico === 'A' ? '#4CAF50' : 
                                 promedioAlfabetico === 'B' ? '#8BC34A' : 
                                 promedioAlfabetico === 'C' ? '#FFC107' : 
                                 promedioAlfabetico === 'D' ? '#FF9800' : 
                                 promedioAlfabetico === 'E' ? '#FF5722' : 
                                 promedioAlfabetico === 'F' ? '#F44336' : '#757575'
                        }}>
                          {promedioAlfabetico}
                        </span>
                      </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                         <div style={{ 
                           fontWeight: 'bold', 
                           fontSize: '16px',
                           color: '#4285F4',
                           backgroundColor: '#E8F0FE',
                           padding: '3px 8px',
                           borderRadius: '4px',
                           border: '1px solid #4285F4',
                           marginBottom: '5px'
                         }}>
                           {(() => {
                             const alumnoIdStr = alumno._id.toString();
                             let valorPuntos = 0;
                             const momentoKey = `momento3`;
                             
                             if (asignacion && asignacion.puntosPorMomento && 
                                 asignacion.puntosPorMomento[momentoKey] && 
                                 Array.isArray(asignacion.puntosPorMomento[momentoKey])) {
                               
                               const puntoAlumno = asignacion.puntosPorMomento[momentoKey].find(
                                 p => p.alumnoId === alumnoIdStr || 
                                      (p.alumnoId && p.alumnoId.toString() === alumnoIdStr)
                               );
                               
                               if (puntoAlumno && puntoAlumno.puntos !== undefined) {
                                 valorPuntos = Number(puntoAlumno.puntos);
                               }
                             }
                             
                             if (valorPuntos === 0) {
                               if (puntosMomento3[alumnoIdStr]) {
                                 valorPuntos = puntosMomento3[alumnoIdStr];
                               } 
                             }
                             
                             return valorPuntos;
                           })()}
                         </div>
                         {(() => {
                           const alumnoIdStr = alumno._id.toString();
                           const notaBase = promedioNumerico !== null ? Math.round(promedioNumerico) : 0;
                           let valorPuntos = 0;
                           const momentoKey = `momento3`;
                           
                           if (asignacion && asignacion.puntosPorMomento && 
                               asignacion.puntosPorMomento[momentoKey] && 
                               Array.isArray(asignacion.puntosPorMomento[momentoKey])) {
                             const puntoAlumno = asignacion.puntosPorMomento[momentoKey].find(
                               p => p.alumnoId === alumnoIdStr || 
                                    (p.alumnoId && p.alumnoId.toString() === alumnoIdStr)
                             );
                             
                             if (puntoAlumno && puntoAlumno.puntos !== undefined) {
                               valorPuntos = Number(puntoAlumno.puntos);
                             }
                           }
                           
                           if (valorPuntos === 0) {
                             if (puntosMomento3[alumnoIdStr]) {
                               valorPuntos = puntosMomento3[alumnoIdStr];
                             } 
                           }
                           
                           const isDisabled = notaBase >= 20 || momentosBloqueados[3];
                           const maxPuntosPermitidos = notaBase >= 20 ? 0 : Math.min(2, 20 - notaBase);
                           
                           return (
                             <input
                               type="number"
                               min="0"
                               max={maxPuntosPermitidos}
                               step="0.5"
                               value={valorPuntos}
                               onChange={(e) => {
                                 const valor = parseFloat(e.target.value);
                                 if (!isNaN(valor) && valor >= 0 && valor <= maxPuntosPermitidos) {
                                   handlePuntosMomentoChange(
                                     `momento3`,
                                     alumno._id.toString(),
                                     valor
                                   );
                                 } else if (valor > maxPuntosPermitidos) {
                                   handlePuntosMomentoChange(
                                     `momento3`,
                                     alumno._id.toString(),
                                     maxPuntosPermitidos
                                   );
                                 }
                               }}
                               style={{ 
                                 width: '60px', 
                                 textAlign: 'center',
                                 border: '1px solid #ccc',
                                 borderRadius: '4px',
                                 padding: '4px',
                                 backgroundColor: isDisabled ? '#f0f0f0' : 'white',
                                 cursor: isDisabled ? 'not-allowed' : 'auto'
                               }}
                               disabled={isDisabled}
                               title={notaBase >= 20 ? 'No se pueden agregar puntos extras cuando la calificación es 20' : `Máximo ${maxPuntosPermitidos} puntos permitidos`}
                             />
                           );
                         })()}
                         <small style={{ marginTop: '4px', color: '#666' }}>Puntos extras</small>
                       </div>
                     </td>
                     <td>
                       {promedioNumerico !== null ? (
                         <div style={{ 
                           fontWeight: 'bold', 
                           color: (promedioNumerico + 
                             (puntosMomento3[alumno._id.toString()] || 0)) >= 10 ? '#4CAF50' : '#F44336' 
                         }}>
                           {(() => {
                             const puntosExtra = puntosMomento3[alumno._id.toString()] || 0;
                             
                             const notaFinal = Math.min(20, Math.round(promedioNumerico + puntosExtra));
                             
                             if (puntosExtra > 0) {
                               return `${Math.round(promedioNumerico)}+${puntosExtra}`;
                             } else {
                               return notaFinal;
                             }
                           })()} 
                         </div>
                       ) : 'N/A'}
                     </td>
                  </tr>
                );
              })}
                </tbody>
              </table>
              </div>
            )}

            {/* TABLA DEL CUARTO MOMENTO (solo si el aula es de Nota Pendiente) */}
            {asignacion?.aula?.esPendiente && momentoActivo === 4 && (
              <div className={styles.momentSection}>
                <div className={styles.momentHeader}>
                  <h3 className={styles.momentTitle}>Calificaciones del Cuarto Momento</h3>
                  <div className={styles.botonesContainer}>
                    {esControl() && (
                      <button 
                        className={styles.botonGuardar} 
                        onClick={() => guardarPuntosMomento('momento4')} 
                        disabled={guardandoPuntosMomento || momentosBloqueados[4]}
                      >
                        {guardandoPuntosMomento ? 'Guardando...' : 'Guardar Puntos Extras'}
                      </button>
                    )}
                  </div>
                </div>
                {mensajePuntosMomento && (
                  <div className={`${styles.mensaje} ${mensajePuntosMomento.tipo === 'error' ? styles.mensajeError : styles.mensajeExito}`}>
                    {mensajePuntosMomento.texto}
                  </div>
                )}
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      {actividades
                        .filter(act => {
                          const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
                          return momento === 4;
                        })
                        .map((actividad) => (
                          <th key={actividad._id}>{actividad.nombre}</th>
                        ))}
                      <th>Promedio</th>
                      <th>Puntos Extras</th>
                      <th>Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map((alumno) => {
                      const alumnoId = alumno._id || alumno.id;
                      const actividadesMomento = actividades.filter(act => {
                        const momento = typeof act.momento === 'string' ? Number(act.momento) : act.momento;
                        return momento === 4;
                      });

                      const calificacionesValidas = actividadesMomento.reduce((acumulado, actividad) => {
                        const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumnoId);
                        if (!calificacion) return acumulado;

                        let notaConvertida = null;
                        if (calificacion.tipoCalificacion === 'alfabetica') {
                          notaConvertida = convertirLetraANota(calificacion.notaAlfabetica);
                        } else if (calificacion.nota !== null && calificacion.nota !== undefined) {
                          notaConvertida = parseFloat(calificacion.nota);
                        }

                        if (notaConvertida === null || Number.isNaN(notaConvertida)) {
                          return acumulado;
                        }

                        acumulado.push({
                          nota: notaConvertida,
                          porcentaje: parseFloat(actividad.porcentaje) || 0
                        });
                        return acumulado;
                      }, []);
                      
                      let promedioNumerico = null;
                      if (calificacionesValidas.length > 0) {
                        const sumaPonderada = calificacionesValidas.reduce(
                          (sum, item) => sum + (item.nota * (item.porcentaje / 100)),
                          0
                        );
                        promedioNumerico = sumaPonderada;

                        if (!Number.isFinite(promedioNumerico)) {
                          promedioNumerico = null;
                        }
                      }
                      
                      const promedio = promedioNumerico !== null ? Math.round(promedioNumerico) : 'N/A';

                      return (
                        <tr key={`alumno-${alumnoId}`}>
                          <td>
                            <StudentNameById studentId={alumnoId} fallback={alumno} />
                          </td>
                          {actividadesMomento.map((actividad) => {
                            const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumnoId);
                            return (
                              <td key={`cal-${alumnoId}-${actividad._id}`}>
                                <div>
                                  {calificacion ? (
                                    <>
                                      {calificacion.tipoCalificacion === 'alfabetica' ? (
                                        <span title={`Nota numérica equivalente: ${calificacion.nota}`}>
                                          {calificacion.notaAlfabetica || 'N/A'}
                                        </span>
                                      ) : calificacion.tipoCalificacion === 'np' ? (
                                        <span style={{ color: '#FF9800', fontWeight: 'bold' }} title="No Presentó">
                                          NP
                                        </span>
                                      ) : calificacion.tipoCalificacion === 'inasistente' ? (
                                        <span style={{ color: '#FF9800', fontWeight: 'bold' }} title="Inasistente">
                                          I
                                        </span>
                                      ) : (
                                        <span title={`Nota alfabética equivalente: ${calificacion.notaAlfabetica || 'N/A'}`}>
                                          {calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : 'N/A'}
                                        </span>
                                      )}
                                    </>
                                  ) : 'N/A'}
                                </div>
                                <button 
                                  className={styles.smallButton}
                                  onClick={() => {
                                    if (calificacion) {
                                      openEditCalificacionForm(actividad, calificacion);
                                    } else {
                                      setCalificacionFormData({
                                        actividadId: actividad._id,
                                        alumnoId: alumnoId,
                                        nota: 10,
                                        notaAlfabetica: 'C',
                                        tipoCalificacion: 'numerica',
                                        modoEdicion: false,
                                        calificacionId: null,
                                        observaciones: ''
                                      });
                                      setShowCalificacionForm(true);
                                    }
                                  }}
                                >
                                  {calificacion ? 'Editar' : 'Calificar'}
                                </button>
                              </td>
                            );
                          })}

                          <td>
                            <span>{promedio}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                              <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: '16px',
                                color: '#4285F4',
                                backgroundColor: '#E8F0FE',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: '1px solid #4285F4',
                                marginBottom: '5px'
                              }}>
                                {puntosMomento4[alumnoId?.toString()] || 0}
                              </div>
                              <input
                                type="number"
                                min="0"
                                max="2"
                                step="0.5"
                                value={puntosMomento4[alumnoId?.toString()] || 0}
                                onChange={(e) => {
                                  const valor = parseFloat(e.target.value);
                                  if (!isNaN(valor) && valor >= 0 && valor <= 2) {
                                    handlePuntosMomentoChange('momento4', alumnoId.toString(), valor);
                                  }
                                }}
                                style={{ 
                                  width: '60px', 
                                  textAlign: 'center',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px',
                                  padding: '4px',
                                  backgroundColor: momentosBloqueados[4] ? '#f0f0f0' : 'white',
                                  cursor: momentosBloqueados[4] ? 'not-allowed' : 'auto'
                                }}
                                disabled={momentosBloqueados[4]}
                              />
                              <small style={{ marginTop: '4px', color: '#666' }}>Puntos extras</small>
                            </div>
                          </td>
                          <td>
                            {promedioNumerico !== null ? (
                              <div style={{ 
                                fontWeight: 'bold', 
                                color: (promedioNumerico + (puntosMomento4[alumnoId?.toString()] || 0)) >= 10 ? '#4CAF50' : '#F44336' 
                              }}>
                                {(() => {
                                  const puntosExtra = puntosMomento4[alumnoId?.toString()] || 0;
                                  const notaFinal = Math.min(20, Math.round(promedioNumerico + puntosExtra));
                                  
                                  if (puntosExtra > 0) {
                                    return `${Math.round(promedioNumerico)}+${puntosExtra}`;
                                  } else {
                                    return notaFinal;
                                  }
                                })()}
                              </div>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para agregar/editar actividad */}
      {showActividadForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{actividadFormData.modoEdicion ? 'Editar Actividad' : 'Agregar Actividad'}</h2>
            <form onSubmit={actividadFormData.modoEdicion ? handleEditActividad : handleAddActividad}>
              <div className={styles.formGroup}>
                <label htmlFor="nombre">Nombre de la Actividad:</label>
                <input
                  type="text"
                  id="nombre"
                  value={actividadFormData.nombre}
                  onChange={(e) => setActividadFormData({...actividadFormData, nombre: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="descripcion">Descripción:</label>
                <textarea
                  id="descripcion"
                  value={actividadFormData.descripcion}
                  onChange={(e) => setActividadFormData({...actividadFormData, descripcion: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="fecha">Fecha de Asignación:</label>
                <input
                  type="date"
                  id="fecha"
                  value={actividadFormData.fecha}
                  onChange={(e) => setActividadFormData({...actividadFormData, fecha: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="porcentaje">Porcentaje (%):</label>
                <input
                  type="number"
                  id="porcentaje"
                  min="1"
                  max="100"
                  value={actividadFormData.porcentaje}
                  onChange={(e) => setActividadFormData({...actividadFormData, porcentaje: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="momento">Momento:</label>
                <select
                  id="momento"
                  value={actividadFormData.momento}
                  onChange={(e) => setActividadFormData({...actividadFormData, momento: Number(e.target.value)})}
                  required
                >
                  <option key="momento-select-1" value="1">Primer Momento</option>
                  <option key="momento-select-2" value="2">Segundo Momento</option>
                  <option key="momento-select-3" value="3">Tercer Momento</option>
                  {asignacion?.aula?.esPendiente && (
                    <option key="momento-select-4" value="4">Cuarto Momento</option>
                  )}
                </select>
              </div>
              
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.saveButton}>
                  {actividadFormData.modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowActividadForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal para agregar/editar calificación */}
      {console.log('Renderizando componente, showCalificacionForm:', showCalificacionForm)}
      {showCalificacionForm === true && (
        <div className={styles.modal} style={{zIndex: 9999}}>
          <div className={styles.modalContent}>
            <h2>{calificacionFormData.modoEdicion ? 'Editar Calificación' : 'Agregar Calificación'}</h2>
            <form onSubmit={handleSaveCalificacion}>
              <div className={styles.formGroup}>
                <label htmlFor="actividad">Actividad:</label>
                <select
                  id="actividad"
                  value={calificacionFormData.actividadId}
                  onChange={(e) => setCalificacionFormData({...calificacionFormData, actividadId: e.target.value})}
                  disabled={calificacionFormData.modoEdicion}
                  required
                >
                  <option key="select-actividad-default" value="">Seleccione una actividad</option>
                  {actividades.map((actividad) => (
                    <option key={`actividad-${actividad._id}`} value={actividad._id}>
                      {actividad.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="alumno">Alumno:</label>
                <select
                  id="alumno"
                  value={calificacionFormData.alumnoId}
                  onChange={(e) => setCalificacionFormData({...calificacionFormData, alumnoId: e.target.value})}
                  disabled={calificacionFormData.modoEdicion}
                  required
                >
                  <option key="select-alumno-default" value="">Seleccione un alumno</option>
                  {alumnos.map((alumno) => (
                    <option key={`alumno-${alumno.id || alumno._id}`} value={alumno.id || alumno._id}>
                      {`${alumno?.nombre || ''} ${alumno?.apellido || ''}`.trim() || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>Tipo de Calificación:</label>
                
                {/* Pestañas para seleccionar el tipo de calificación */}
                <div style={{ 
                  display: 'flex', 
                  borderBottom: '2px solid #e0e0e0',
                  marginBottom: '15px',
                  gap: '5px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (asignacion?.materia?.nombre !== 'Orientación' && asignacion?.materia?.nombre !== 'Grupo y Participación') {
                        setCalificacionFormData({
                          ...calificacionFormData,
                          tipoCalificacion: 'numerica'
                        });
                      }
                    }}
                    disabled={asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación'}
                    style={{
                      flex: 1,
                      padding: '10px 15px',
                      border: 'none',
                      borderBottom: calificacionFormData.tipoCalificacion === 'numerica' ? '3px solid #4CAF50' : '3px solid transparent',
                      backgroundColor: calificacionFormData.tipoCalificacion === 'numerica' ? '#f0f9f0' : 'transparent',
                      color: calificacionFormData.tipoCalificacion === 'numerica' ? '#4CAF50' : '#666',
                      fontWeight: calificacionFormData.tipoCalificacion === 'numerica' ? 'bold' : 'normal',
                      cursor: (asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación') ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    Numérica
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setCalificacionFormData({
                        ...calificacionFormData,
                        tipoCalificacion: 'alfabetica'
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 15px',
                      border: 'none',
                      borderBottom: calificacionFormData.tipoCalificacion === 'alfabetica' ? '3px solid #2196F3' : '3px solid transparent',
                      backgroundColor: calificacionFormData.tipoCalificacion === 'alfabetica' ? '#e3f2fd' : 'transparent',
                      color: calificacionFormData.tipoCalificacion === 'alfabetica' ? '#2196F3' : '#666',
                      fontWeight: calificacionFormData.tipoCalificacion === 'alfabetica' ? 'bold' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    Alfabética
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (asignacion?.materia?.nombre !== 'Orientación' && asignacion?.materia?.nombre !== 'Grupo y Participación') {
                        setCalificacionFormData({
                          ...calificacionFormData,
                          tipoCalificacion: 'np'
                        });
                      }
                    }}
                    disabled={asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación'}
                    style={{
                      flex: 1,
                      padding: '10px 15px',
                      border: 'none',
                      borderBottom: calificacionFormData.tipoCalificacion === 'np' || calificacionFormData.tipoCalificacion === 'inasistente' ? '3px solid #FF9800' : '3px solid transparent',
                      backgroundColor: (calificacionFormData.tipoCalificacion === 'np' || calificacionFormData.tipoCalificacion === 'inasistente') ? '#fff3e0' : 'transparent',
                      color: (calificacionFormData.tipoCalificacion === 'np' || calificacionFormData.tipoCalificacion === 'inasistente') ? '#FF9800' : '#666',
                      fontWeight: (calificacionFormData.tipoCalificacion === 'np' || calificacionFormData.tipoCalificacion === 'inasistente') ? 'bold' : 'normal',
                      cursor: (asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación') ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    NP / I
                  </button>
                </div>
                
                {/* Contenido según el tipo seleccionado */}
                {calificacionFormData.tipoCalificacion === 'numerica' ? (
                  <>
                    <label htmlFor="nota">Calificación numérica (1-20):</label>
                    <input
                      type="number"
                      id="nota"
                      min="1"
                      max="20"
                      step="1"
                      value={calificacionFormData.nota || ''}
                      onChange={(e) => {
                        // Forzar entero entre 1 y 20
                        const valor = parseInt(e.target.value, 10);
                        const clamped = isNaN(valor) ? '' : Math.max(1, Math.min(20, valor));
                        setCalificacionFormData({...calificacionFormData, nota: clamped});
                      }}
                      onBlur={(e) => {
                        // Normalizar a entero válido al perder el foco
                        const valor = parseInt(e.target.value, 10);
                        const clamped = isNaN(valor) ? 1 : Math.max(1, Math.min(20, valor));
                        setCalificacionFormData({...calificacionFormData, nota: clamped});
                      }}
                      required
                    />
                    <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                      La calificación máxima permitida es 20
                    </small>
                  </>
                ) : calificacionFormData.tipoCalificacion === 'alfabetica' ? (
                  <>
                    <label htmlFor="notaAlfabetica">Calificación alfabética:</label>
                    <select
                      id="notaAlfabetica"
                      value={calificacionFormData.notaAlfabetica}
                      onChange={(e) => setCalificacionFormData({...calificacionFormData, notaAlfabetica: e.target.value})}
                      required
                    >
                      <option key="nota-A" value="A">A (20-18)</option>
                      <option key="nota-B" value="B">B (17-14)</option>
                      <option key="nota-C" value="C">C (13-11)</option>
                      <option key="nota-D" value="D">D (10-01)</option>
                    </select>
                  </>
                ) : (calificacionFormData.tipoCalificacion === 'np' || calificacionFormData.tipoCalificacion === 'inasistente') ? (
                  <>
                    <label htmlFor="tipoNP">Seleccione el motivo:</label>
                    <select
                      id="tipoNP"
                      value={calificacionFormData.tipoCalificacion}
                      onChange={(e) => setCalificacionFormData({...calificacionFormData, tipoCalificacion: e.target.value})}
                      required
                    >
                      <option key="np-option" value="np">NP - No Presentó</option>
                      <option key="inasistente-option" value="inasistente">I - Inasistente</option>
                    </select>
                    <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                      NP: El estudiante no presentó la actividad | I: El estudiante estuvo inasistente
                    </small>
                  </>
                ) : null}
                
                {(asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación') && 
                  <small style={{ display: 'block', color: '#666', marginTop: '5px', fontStyle: 'italic' }}>
                    Esta materia requiere calificación alfabética
                  </small>
                }
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="observaciones" className={styles.formLabel}>Observaciones:</label>
                <div className={styles.textareaWrapper}>
                  <textarea
                    id="observaciones"
                    value={calificacionFormData.observaciones || ''}
                    onChange={(e) => setCalificacionFormData({...calificacionFormData, observaciones: e.target.value})}
                    rows="4"
                    className={styles.enhancedTextarea}
                    style={{
                      width: '100%',
                      padding: '12px',
                      resize: 'vertical',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      transition: 'border-color 0.3s, box-shadow 0.3s'
                    }}
                    placeholder="Ingrese sus observaciones sobre esta calificación"
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="evidencia">Evidencia (Imagen):</label>
                <input
                  type="file"
                  id="evidencia"
                  accept="image/*"
                  onChange={handleImagenChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                {previewUrl && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <p>Vista previa:</p>
                    <img 
                      src={previewUrl} 
                      alt="Vista previa de la evidencia" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                    />
                  </div>
                )}
                {calificacionFormData.evidencia && !previewUrl && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <p>Evidencia actual:</p>
                    <img 
                      src={calificacionFormData.evidencia} 
                      alt="Evidencia actual" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                    />
                  </div>
                )}
                {subiendoImagen && <p>Subiendo imagen...</p>}
              </div>
              
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.saveButton}>
                  {calificacionFormData.modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowCalificacionForm(false);
                    setImagenSeleccionada(null);
                    setPreviewUrl('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal para el reporte */}
      {showReportModal && (
        <div className={reportStyles.modalOverlay}>
          <div className={reportStyles.reportModal}>
            <div className={reportStyles.reportModalHeader}>
              <h2>Reporte de Calificaciones</h2>
              <div className={reportStyles.reportModalButtons}>
                <button onClick={handlePrint} className={reportStyles.printButton}>
                  Imprimir
                </button>
                <button onClick={closeReportModal} className={reportStyles.closeButton}>
                  Cerrar
                </button>
              </div>
            </div>
            <div className={reportStyles.reportContent}>
              <ReporteCalificaciones 
                ref={reportRef} 
                asignacion={asignacion} 
                actividades={actividades} 
                alumnos={alumnos} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para mostrar observaciones */}
      {modalObservaciones.visible && (
        <div className={styles.modalOverlay} onClick={cerrarModalObservaciones} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.3s ease-in-out',
            overflow: 'hidden'
          }}>
            <div className={styles.modalHeader} style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eaeaea',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{modalObservaciones.titulo}</h2>
              <button
                onClick={cerrarModalObservaciones}
                className={styles.closeButton}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0 8px',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalContent} style={{ 
              padding: '20px', 
              backgroundColor: '#fff',
              flex: 1
            }}>
              <div style={{
                backgroundColor: '#f9f9f9',
                border: '1px solid #eaeaea',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#333'
              }}>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{modalObservaciones.contenido}</p>
              </div>
            </div>
            <div className={styles.modalButtons} style={{
              padding: '16px 20px',
              borderTop: '1px solid #eaeaea',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f8f9fa'
            }}>
              <button
                onClick={cerrarModalObservaciones}
                className={styles.cancelButton}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  fontWeight: '500'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para mostrar evidencia */}
      {modalEvidencia.visible && (
        <div className={styles.modalOverlay} onClick={cerrarModalEvidencia} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ 
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.3s ease-in-out',
            overflow: 'hidden'
          }}>
            <div className={styles.modalHeader} style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eaeaea',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>{modalEvidencia.titulo}</h2>
              <button
                onClick={cerrarModalEvidencia}
                className={styles.closeButton}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0 8px',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalContent} style={{ 
              padding: '20px', 
              textAlign: 'center',
              backgroundColor: '#fff',
              flex: 1
            }}>
              {modalEvidencia.url ? (
                <>
                  <div style={{ 
                    marginBottom: '15px', 
                    backgroundColor: '#f0f7ff', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    fontSize: '0.9em',
                    border: '1px solid #d0e3ff'
                  }}>
                    <p style={{ margin: '0 0 8px 0' }}><strong>URL de la evidencia:</strong> 
                      <span style={{ fontFamily: 'monospace', backgroundColor: '#e9f2ff', padding: '3px 6px', borderRadius: '4px' }}>
                        {modalEvidencia.url}
                      </span>
                    </p>
                    {modalEvidencia.originalUrl && modalEvidencia.originalUrl !== modalEvidencia.url && (
                      <p style={{ margin: '0 0 8px 0' }}><strong>URL original:</strong> 
                        <span style={{ fontFamily: 'monospace', backgroundColor: '#e9f2ff', padding: '3px 6px', borderRadius: '4px' }}>
                          {modalEvidencia.originalUrl}
                        </span>
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button
                        onClick={cerrarModalEvidencia}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                  <div style={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    maxHeight: '50vh',
                    overflow: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <img 
                      src={modalEvidencia.url} 
                      alt="Evidencia de calificación" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '600px', 
                        objectFit: 'contain',
                        display: 'block',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }} 
                      onError={(e) => {
                        console.error('Error al cargar la imagen:', modalEvidencia.url);
                        e.target.onerror = null;
                        e.target.style.opacity = '0.5';
                        e.target.style.maxHeight = '200px';
                        e.target.insertAdjacentHTML('afterend', 
                          '<div style="margin-top: 15px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; color: #856404;">' +
                          '<p style="margin: 0 0 10px 0; font-weight: 600;">Error al cargar la imagen</p>' +
                          '<p style="margin: 0 0 10px 0;">La URL puede ser incorrecta o la imagen no está disponible.</p>' +
                          '<p style="margin: 0; font-family: monospace; background-color: #fff8e6; padding: 8px; border-radius: 4px;">URL intentada: ' + modalEvidencia.url + '</p>' +
                          '</div>'
                        );
                      }}
                    />
                  </div>
                </>
              ) : (
                <p>No hay imagen disponible</p>
              )}
            </div>
            <div className={styles.modalButtons}>
              <button
                onClick={cerrarModalEvidencia}
                className={styles.cancelButton}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para calificación por lote */}
      {showBatchCalificacionForm && (
        <div className={styles.modal} style={{zIndex: 9999}}>
          <div className={styles.modalContent} style={{maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto'}}>
            <h2>Calificar por Lote</h2>
            <form onSubmit={handleBatchCalificacion}>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={batchCalificacionData.tipoCalificacion === 'alfabetica'}
                    onChange={(e) => setBatchCalificacionData({
                      ...batchCalificacionData,
                      tipoCalificacion: e.target.checked ? 'alfabetica' : 'numerica'
                    })}
                  />
                  Usar calificación alfabética (A-D)
                </label>
              </div>
              
              
              <div style={{marginBottom: '20px'}}>
                <h3>Calificaciones por Estudiante:</h3>
                <div style={{border: '1px solid #ddd', padding: '10px'}}>
                  {batchCalificacionData.calificaciones.map((calificacion, index) => (
                    <div key={calificacion.alumnoId} style={{
                      marginBottom: '15px',
                      padding: '15px',
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      backgroundColor: calificacion.tieneCalificacion ? '#f0f8ff' : '#fff'
                    }}>
                      <div style={{marginBottom: '10px'}}>
                        <strong>{calificacion.alumnoNombre}</strong>
                        {calificacion.tieneCalificacion && (
                          <span style={{color: '#666', fontSize: '12px'}}> (Ya calificado)</span>
                        )}
                      </div>
                      
                      <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px'}}>
                        <label style={{fontSize: '14px', fontWeight: 'bold'}}>Calificación:</label>
                        {batchCalificacionData.tipoCalificacion === 'numerica' ? (
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={calificacion.nota !== null && calificacion.nota !== undefined ? calificacion.nota : ''}
                            onChange={(e) => {
                              const nuevasCalificaciones = [...batchCalificacionData.calificaciones];
                              nuevasCalificaciones[index].nota = e.target.value;
                              setBatchCalificacionData({
                                ...batchCalificacionData,
                                calificaciones: nuevasCalificaciones
                              });
                            }}
                            placeholder="Nota (1-20)"
                            style={{width: '80px'}}
                          />
                        ) : (
                          <select
                            value={calificacion.notaAlfabetica}
                            onChange={(e) => {
                              const nuevasCalificaciones = [...batchCalificacionData.calificaciones];
                              nuevasCalificaciones[index].notaAlfabetica = e.target.value;
                              setBatchCalificacionData({
                                ...batchCalificacionData,
                                calificaciones: nuevasCalificaciones
                              });
                            }}
                            style={{width: '80px'}}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        )}
                      </div>
                      
                      <div style={{marginBottom: '10px'}}>
                        <label style={{fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>
                          Observaciones:
                        </label>
                        <textarea
                          value={calificacion.observaciones}
                          onChange={(e) => {
                            const nuevasCalificaciones = [...batchCalificacionData.calificaciones];
                            nuevasCalificaciones[index].observaciones = e.target.value;
                            setBatchCalificacionData({
                              ...batchCalificacionData,
                              calificaciones: nuevasCalificaciones
                            });
                          }}
                          placeholder="Observaciones específicas para este estudiante"
                          rows={2}
                          style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                        />
                      </div>
                      
                      <div>
                        <label style={{fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>
                          Evidencia:
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const nuevasCalificaciones = [...batchCalificacionData.calificaciones];
                                nuevasCalificaciones[index].evidencia = e.target.result;
                                setBatchCalificacionData({
                                  ...batchCalificacionData,
                                  calificaciones: nuevasCalificaciones
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                        />
                        {calificacion.evidencia && (
                          <div style={{marginTop: '5px'}}>
                            <img 
                              src={calificacion.evidencia} 
                              alt="Evidencia" 
                              style={{maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '20px'}}>
                <button
                  type="button"
                  onClick={() => setShowBatchCalificacionForm(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar Calificaciones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de previsualización de notas */}
      {showPreviewNotas && (
        <div className={styles.modalOverlay} onClick={closePreviewNotas} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: '#fff', borderRadius: '12px', width: '90%', maxWidth: '900px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div className={styles.modalHeader} style={{
              padding: '14px 18px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Previsualización de notas (Momento {momentoActivo})</h2>
              <button onClick={closePreviewNotas} className={styles.closeButton} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className={styles.modalContent} style={{ padding: '16px', overflow: 'auto' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Momento</th>
                      <th>Actividad</th>
                      <th>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '12px' }}>Sin datos para mostrar</td></tr>
                    ) : (
                      previewRows.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.alumno}</td>
                          <td>{r.momento}</td>
                          <td>{r.actividad}</td>
                          <td>{r.calificacion ?? '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.modalButtons} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid #eee' }}>
              <button onClick={closePreviewNotas} className={styles.cancelButton}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fin de modales */}
    </div>
  );
}

export default function Calificaciones() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CalificacionesContent />
    </Suspense>
  );
}
