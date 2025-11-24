import { NextResponse } from 'next/server';
import dbConnection from '@/database/db';
import mongoose from 'mongoose';
import Aula from '@/database/models/Aula';
import Asignacion from '@/database/models/Asignacion';
import Estudiante from '@/database/models/Estudiante';
import Materia from '@/database/models/Materia';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Función para convertir nota numérica a alfabética
function convertirNotaAlfabetica(nota) {
  if (nota >= 19) return 'A+';
  if (nota >= 16) return 'A';
  if (nota >= 13) return 'B';
  if (nota >= 10) return 'C';
  if (nota >= 7) return 'D';
  return 'E';
}

const DEFAULT_TEXT_CALIFICACION = 'NC';

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

export async function GET(request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const aulaId = searchParams.get('aulaId');
    const momento = parseInt(searchParams.get('momento'));
    const studentId = searchParams.get('studentId');

    if (!aulaId || !momento) {
      return NextResponse.json({
        success: false,
        error: 'Parámetros incompletos'
      }, { status: 400 });
    }

    await dbConnection.connectDB();

    // Obtener el aula directamente (ya tiene estudiantes y asignaciones embebidos)
    const aulaData = await Aula.findById(aulaId);

    if (!aulaData) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    // Filtrar estudiantes si se especificó un ID
    const estudiantesAula = studentId ? 
      aulaData.alumnos.filter(est => est._id.toString() === studentId) : 
      aulaData.alumnos;

    if (!estudiantesAula || estudiantesAula.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se encontraron estudiantes en el aula'
      }, { status: 404 });
    }

    // Log para debug: ver qué datos tienen los estudiantes
    console.log('🔍 DEBUG: Datos de estudiantes desde la base de datos:');
    estudiantesAula.forEach(est => {
      console.log(`  - ${est.nombre} ${est.apellido}:`, {
        _id: est._id,
        materiasAsignadas: est.materiasAsignadas,
        tipo: typeof est.materiasAsignadas,
        esArray: Array.isArray(est.materiasAsignadas),
        length: Array.isArray(est.materiasAsignadas) ? est.materiasAsignadas.length : 'N/A',
        raw: JSON.stringify(est)
      });
    });

    // Obtener las asignaciones
    const asignaciones = aulaData.asignaciones || [];

    // Inicializar el objeto de calificaciones para todos los estudiantes
    const calificacionesPorMateria = {};
    estudiantesAula.forEach(estudiante => {
      const estudianteId = estudiante._id ? estudiante._id.toString() : estudiante.id || estudiante.cedula;
      if (estudianteId) {
        calificacionesPorMateria[estudianteId] = [];
      }
    });

    // Procesar cada asignación
    asignaciones.forEach(asignacion => {
      const materia = asignacion.materia;
      
      // Inicializar estructura para almacenar notas por momento
      const notasPorMomento = {};
      
      // Función auxiliar para verificar si un estudiante tiene la materia asignada
      const estudianteTieneMateria = (estudianteId) => {
        const estudiante = estudiantesAula.find(est => {
          const estId = est._id ? est._id.toString() : est.id || est.cedula;
          return estId === estudianteId;
        });
        
        // Si el estudiante no existe, no tiene la materia
        if (!estudiante) {
          return false;
        }
        
        // Si el estudiante no tiene materiasAsignadas definidas o tiene array vacío, asume que ve todas (compatibilidad hacia atrás)
        const materiasAsignadas = normalizeMateriasAsignadas(estudiante.materiasAsignadas);
        if (!materiasAsignadas.length) {
          return true; // Por defecto para estudiantes antiguos sin el campo o con array vacío, ve todas las materias
        }
        
        // Verificar si la materia está en la lista de materias asignadas del estudiante
        const materiaIdNormalizado = materia?.id ? String(materia.id).trim().toLowerCase() : '';
        const materiaCodigoNormalizado = materia?.codigo ? String(materia.codigo).trim().toLowerCase() : '';

        return materiasAsignadas.some((matId) => {
          const normalized = String(matId || '').trim().toLowerCase();
          return (
            (materiaIdNormalizado && normalized === materiaIdNormalizado) ||
            (materiaCodigoNormalizado && normalized === materiaCodigoNormalizado)
          );
        });
      };
      
      // Obtener los puntos extras por momento de la asignación
      const puntosPorMomento = asignacion.puntosPorMomento || {};
      
      // Crear objetos que mapeen los puntos extras por estudiante para cada momento
      const puntosExtrasMomento1 = {};
      const puntosExtrasMomento2 = {};
      const puntosExtrasMomento3 = {};
      
      // Procesar puntos extras del momento 1
      if (puntosPorMomento.momento1 && Array.isArray(puntosPorMomento.momento1)) {
        puntosPorMomento.momento1.forEach(punto => {
          if (punto.alumnoId && punto.puntos !== undefined) {
            puntosExtrasMomento1[punto.alumnoId.toString()] = parseFloat(punto.puntos) || 0;
          }
        });
      }
      
      // Procesar puntos extras del momento 2
      if (puntosPorMomento.momento2 && Array.isArray(puntosPorMomento.momento2)) {
        puntosPorMomento.momento2.forEach(punto => {
          if (punto.alumnoId && punto.puntos !== undefined) {
            puntosExtrasMomento2[punto.alumnoId.toString()] = parseFloat(punto.puntos) || 0;
          }
        });
      }
      
      // Procesar puntos extras del momento 3
      if (puntosPorMomento.momento3 && Array.isArray(puntosPorMomento.momento3)) {
        puntosPorMomento.momento3.forEach(punto => {
          if (punto.alumnoId && punto.puntos !== undefined) {
            puntosExtrasMomento3[punto.alumnoId.toString()] = parseFloat(punto.puntos) || 0;
          }
        });
      }
      
      // Procesar actividades del primer momento
      const actividadesPrimerMomento = (asignacion.actividades || []).filter(act => 
        parseInt(act.momento) === 1
      );
      
      // Procesar actividades del segundo momento
      const actividadesSegundoMomento = (asignacion.actividades || []).filter(act => 
        parseInt(act.momento) === 2
      );

      // Procesar actividades del tercer momento
      const actividadesTercerMomento = (asignacion.actividades || []).filter(act => 
        parseInt(act.momento) === 3
      );
      
      // Procesar notas del primer momento (solo para estudiantes que tienen la materia asignada)
      actividadesPrimerMomento.forEach(actividad => {
        (actividad.calificaciones || []).forEach(cal => {
          const alumnoId = cal.alumnoId;
          // Solo procesar si el estudiante tiene la materia asignada
          if (estudianteTieneMateria(alumnoId)) {
            if (!notasPorMomento[alumnoId]) {
              notasPorMomento[alumnoId] = { momento1: [], momento2: [], momento3: [] };
            }
            notasPorMomento[alumnoId].momento1.push(cal.nota);
          }
        });
      });
      
      // Procesar notas del segundo momento (solo para estudiantes que tienen la materia asignada)
      if (momento >= 2) {
        actividadesSegundoMomento.forEach(actividad => {
          (actividad.calificaciones || []).forEach(cal => {
            const alumnoId = cal.alumnoId;
            // Solo procesar si el estudiante tiene la materia asignada
            if (estudianteTieneMateria(alumnoId)) {
              if (!notasPorMomento[alumnoId]) {
                notasPorMomento[alumnoId] = { momento1: [], momento2: [], momento3: [] };
              }
              notasPorMomento[alumnoId].momento2.push(cal.nota);
            }
          });
        });
      }

      // Procesar notas del tercer momento (solo para estudiantes que tienen la materia asignada)
      if (momento === 3) {
        actividadesTercerMomento.forEach(actividad => {
          (actividad.calificaciones || []).forEach(cal => {
            const alumnoId = cal.alumnoId;
            // Solo procesar si el estudiante tiene la materia asignada
            if (estudianteTieneMateria(alumnoId)) {
              if (!notasPorMomento[alumnoId]) {
                notasPorMomento[alumnoId] = { momento1: [], momento2: [], momento3: [] };
              }
              notasPorMomento[alumnoId].momento3.push(cal.nota);
            }
          });
        });
      }

      // Procesar las notas acumuladas para cada alumno
      // Nota: Solo se procesan notas de estudiantes que tienen la materia asignada
      Object.keys(notasPorMomento).forEach(alumnoId => {
        const notas = notasPorMomento[alumnoId];
        
        // Calcular promedio del primer momento
        let promedioMomento1;
        if (notas.momento1.length > 0) {
          const sumaNotas1 = notas.momento1.reduce((a, b) => {
            const nota = b === 'N/A' || b === null || b === undefined ? 1 : Number(b);
            return a + (isNaN(nota) ? 1 : nota);
          }, 0);
          promedioMomento1 = sumaNotas1 / notas.momento1.length;
          
          // Sumar puntos extras del momento 1 si existen
          const puntosExtra1 = puntosExtrasMomento1[alumnoId] || 0;
          promedioMomento1 += puntosExtra1;
          
          // Limitar a 20 puntos máximo
          promedioMomento1 = Math.min(20, promedioMomento1);
        } else {
          promedioMomento1 = 1;
        }
        
        // Calcular promedio del segundo momento
        let promedioMomento2;
        if (notas.momento2.length > 0) {
          const sumaNotas2 = notas.momento2.reduce((a, b) => {
            const nota = b === 'N/A' || b === null || b === undefined ? 1 : Number(b);
            return a + (isNaN(nota) ? 1 : nota);
          }, 0);
          promedioMomento2 = sumaNotas2 / notas.momento2.length;
          
          // Sumar puntos extras del momento 2 si existen
          const puntosExtra2 = puntosExtrasMomento2[alumnoId] || 0;
          promedioMomento2 += puntosExtra2;
          
          // Limitar a 20 puntos máximo
          promedioMomento2 = Math.min(20, promedioMomento2);
        } else {
          promedioMomento2 = 1;
        }

        // Calcular promedio del tercer momento
        let promedioMomento3;
        if (notas.momento3.length > 0) {
          const sumaNotas3 = notas.momento3.reduce((a, b) => {
            const nota = b === 'N/A' || b === null || b === undefined ? 1 : Number(b);
            return a + (isNaN(nota) ? 1 : nota);
          }, 0);
          promedioMomento3 = sumaNotas3 / notas.momento3.length;
          
          // Sumar puntos extras del momento 3 si existen
          const puntosExtra3 = puntosExtrasMomento3[alumnoId] || 0;
          promedioMomento3 += puntosExtra3;
          
          // Limitar a 20 puntos máximo
          promedioMomento3 = Math.min(20, promedioMomento3);
        } else {
          promedioMomento3 = 1;
        }
        
        if (!calificacionesPorMateria[alumnoId]) {
          calificacionesPorMateria[alumnoId] = [];
        }
        
        // Calcular calificación final según el momento
        let calificacionFinal;
        if (momento === 3) {
          calificacionFinal = (promedioMomento1 + promedioMomento2 + promedioMomento3) / 3;
        } else if (momento === 2) {
          calificacionFinal = (promedioMomento1 + promedioMomento2) / 2;
        } else {
          calificacionFinal = promedioMomento1;
        }
        
        // Limitar la calificación final a 20 puntos máximo
        calificacionFinal = Math.min(20, calificacionFinal);
        
        // Solo agregar la calificación si el estudiante tiene esta materia asignada
        // (ya se verificó antes al procesar las notas, pero verificamos de nuevo por seguridad)
        if (estudianteTieneMateria(alumnoId)) {
          calificacionesPorMateria[alumnoId].push({
            materia: materia.nombre,
            materiaId: materia.id, // Agregar el ID de la materia para facilitar el filtrado
            momento1: promedioMomento1,
            momento2: promedioMomento2,
            momento3: promedioMomento3,
            puntosExtra1: puntosExtrasMomento1[alumnoId] || 0, // Puntos extras del momento 1
            puntosExtra2: puntosExtrasMomento2[alumnoId] || 0, // Puntos extras del momento 2
            puntosExtra3: puntosExtrasMomento3[alumnoId] || 0, // Puntos extras del momento 3
            calificacion: calificacionFinal
          });
        }
      });
    });

    // Filtrar estudiantes si se especificó un ID
    const estudiantesFiltrados = studentId ? 
      estudiantesAula.filter(est => est._id.toString() === studentId) : 
      estudiantesAula;

    // Para cada estudiante, asegurar que TODAS las materias del aula aparezcan en el boletín
    // Si el estudiante tiene la materia asignada → mostrar notas
    // Si el estudiante NO tiene la materia asignada → mostrar "AP" (No Aplica)
    estudiantesFiltrados.forEach(estudiante => {
      const estudianteId = estudiante._id ? estudiante._id.toString() : estudiante.id || estudiante.cedula;
      
      // Obtener las materias asignadas del estudiante
      let materiasAsignadas = [];
      let tieneRestricciones = false; // Flag para saber si el estudiante tiene restricciones de materias
      
      // Si el estudiante no tiene materiasAsignadas definidas o tiene array vacío, asume que ve todas (compatibilidad hacia atrás)
      if (estudiante.materiasAsignadas === undefined || estudiante.materiasAsignadas === null || 
          (Array.isArray(estudiante.materiasAsignadas) && estudiante.materiasAsignadas.length === 0)) {
        // Para estudiantes antiguos sin el campo o con array vacío, todas las materias están asignadas
        materiasAsignadas = asignaciones.map(asig => asig.materia.id);
        tieneRestricciones = false; // No tiene restricciones, ve todas
        console.log(`📊 Estudiante ${estudiante.nombre} ${estudiante.apellido}: Sin materiasAsignadas o array vacío, todas las materias asignadas (${materiasAsignadas.length} materias)`);
      } else if (Array.isArray(estudiante.materiasAsignadas) && estudiante.materiasAsignadas.length > 0) {
        // Si tiene materias asignadas, usar solo esas (tiene restricciones)
        materiasAsignadas = estudiante.materiasAsignadas;
        tieneRestricciones = true; // Tiene restricciones
        console.log(`📊 Estudiante ${estudiante.nombre} ${estudiante.apellido}: Tiene ${materiasAsignadas.length} materias asignadas:`, materiasAsignadas);
      }
      
      // Inicializar calificaciones si no existen
      if (!calificacionesPorMateria[estudianteId]) {
        calificacionesPorMateria[estudianteId] = [];
      }
      
      // Para cada materia del aula, asegurar que esté en el boletín
      asignaciones.forEach(asignacion => {
        const materiaId = asignacion.materia.id;
        const materiaNombre = asignacion.materia.nombre;
        
        // Verificar si ya existe una calificación para esta materia
        const calificacionExistente = calificacionesPorMateria[estudianteId].find(cal => 
          (cal.materiaId && cal.materiaId === materiaId) || cal.materia === materiaNombre
        );
        
        // Si el estudiante tiene restricciones Y NO tiene esta materia asignada, agregar entrada con "AP"
        if (tieneRestricciones && !materiasAsignadas.includes(materiaId)) {
          if (!calificacionExistente) {
            console.log(`  📝 Agregando materia NO asignada con "${DEFAULT_TEXT_CALIFICACION}": ${materiaNombre} (ID: ${materiaId})`);
            calificacionesPorMateria[estudianteId].push({
              materia: materiaNombre,
              materiaId: materiaId,
              momento1: DEFAULT_TEXT_CALIFICACION,
              momento2: DEFAULT_TEXT_CALIFICACION,
              momento3: DEFAULT_TEXT_CALIFICACION,
              calificacion: DEFAULT_TEXT_CALIFICACION,
              noAplica: true // Marcar como "No Aplica"
            });
          } else {
            // Si existe pero el estudiante no tiene la materia asignada, marcar como "NC"
            console.log(`  📝 Marcando materia existente como "${DEFAULT_TEXT_CALIFICACION}": ${materiaNombre} (ID: ${materiaId})`);
            calificacionExistente.momento1 = DEFAULT_TEXT_CALIFICACION;
            calificacionExistente.momento2 = DEFAULT_TEXT_CALIFICACION;
            calificacionExistente.momento3 = DEFAULT_TEXT_CALIFICACION;
            calificacionExistente.calificacion = DEFAULT_TEXT_CALIFICACION;
            calificacionExistente.noAplica = true;
          }
        } else {
          // Si el estudiante NO tiene restricciones (ve todas) O tiene la materia asignada, mantener las notas normales
          // (ya fueron procesadas anteriormente)
          if (calificacionExistente) {
            calificacionExistente.noAplica = false;
          }
          // Si no existe calificación pero el estudiante ve todas las materias, las notas se procesaron antes
          // y deberían estar en calificacionesPorMateria
        }
      });
    });

    // Si no hay actividades, agregar N/A para todos los estudiantes
    if (!asignaciones || asignaciones.length === 0) {
      estudiantesAula.forEach(estudiante => {
        const estudianteId = estudiante._id ? estudiante._id.toString() : estudiante.id || estudiante.cedula;
        if (!calificacionesPorMateria[estudianteId]) {
          calificacionesPorMateria[estudianteId] = [];
        }
        calificacionesPorMateria[estudianteId].push({
          materia: 'Sin materias asignadas',
          momento1: 1,
          momento2: 1,
          calificacion: 1, // Agregar N/A como 1
          tipoCalificacion: 'numerica'
        });
      });
    }

    if (Object.keys(calificacionesPorMateria).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron calificaciones para este momento'
      }, { status: 404 });
    }

    // Asegurarse de que la conexión a la base de datos esté establecida
    await dbConnection.connectDB();
    
    // Generar el reporte
    const reporte = {
      aula: {
        nombre: aulaData.nombre,
        anio: aulaData.anio,
        seccion: aulaData.seccion,
        turno: aulaData.turno,
        periodo: aulaData.periodo || 'N/D' // Agregar el período académico
      },
      momento,
      estudiantes: await Promise.all(estudiantesFiltrados.map(async estudiante => {
        const estudianteId = estudiante._id ? estudiante._id.toString() : estudiante.id || estudiante.cedula;
        
        // Obtener las materias asignadas del estudiante ANTES de obtener las calificaciones
        let materiasAsignadasEstudiante = [];
        if (estudiante.materiasAsignadas === undefined || estudiante.materiasAsignadas === null) {
          // Para estudiantes antiguos sin el campo, mostrar todas las materias
          materiasAsignadasEstudiante = asignaciones.map(asig => asig.materia.id);
          console.log(`📋 Estudiante ${estudiante.nombre} ${estudiante.apellido}: Sin materiasAsignadas en reporte, mostrando todas`);
        } else if (Array.isArray(estudiante.materiasAsignadas) && estudiante.materiasAsignadas.length > 0) {
          materiasAsignadasEstudiante = estudiante.materiasAsignadas;
          console.log(`📋 Estudiante ${estudiante.nombre} ${estudiante.apellido}: Tiene ${materiasAsignadasEstudiante.length} materias asignadas en reporte:`, materiasAsignadasEstudiante);
        } else {
          materiasAsignadasEstudiante = [];
          console.log(`📋 Estudiante ${estudiante.nombre} ${estudiante.apellido}: Array vacío en reporte, no verá ninguna materia`);
        }
        
        // Obtener todas las calificaciones (incluyendo las marcadas como "AP")
        let calificacionesEstudiante = calificacionesPorMateria[estudianteId] || [];
        
        // Ordenar las calificaciones según el orden de las asignaciones en el aula
        // Crear un mapa de índice por materiaId para mantener el orden original
        const indicePorMateria = {};
        asignaciones.forEach((asig, index) => {
          const materiaId = asig.materia?.id;
          if (materiaId) {
            indicePorMateria[materiaId] = index;
          }
        });
        
        // Ordenar las calificaciones según el índice en el array de asignaciones
        calificacionesEstudiante.sort((a, b) => {
          const indiceA = a.materiaId ? (indicePorMateria[a.materiaId] ?? 999) : 999;
          const indiceB = b.materiaId ? (indicePorMateria[b.materiaId] ?? 999) : 999;
          
          // Si ambas tienen índice, ordenar por índice
          if (indiceA !== 999 && indiceB !== 999) {
            return indiceA - indiceB;
          }
          
          // Si solo una tiene índice, la que tiene índice va primero
          if (indiceA !== 999) return -1;
          if (indiceB !== 999) return 1;
          
          // Si ninguna tiene índice, mantener orden alfabético como fallback
          const nombreA = a.materia || '';
          const nombreB = b.materia || '';
          return nombreA.localeCompare(nombreB);
        });
        
        console.log(`📋 Calificaciones para ${estudiante.nombre} ${estudiante.apellido}: ${calificacionesEstudiante.length} materias (incluyendo "AP") en orden del aula`);
        
        // Buscar la información completa del estudiante en la colección Estudiante
        let cedula = 'N/D';
        let representante = null;
        try {
          // Buscar el estudiante en la colección usando el _id
          const estudianteInfo = await Estudiante.findById(estudianteId);
          if (estudianteInfo) {
            // Si existe el estudiante, obtener su cédula (idU) y datos del representante
            cedula = estudianteInfo.idU || 'N/D';
            representante = estudianteInfo.representante || null;
            // Corregir posibles des-sincronizaciones tomando nombre/apellido desde la colección Estudiante
            if (estudianteInfo.nombre) {
              estudiante.nombre = estudianteInfo.nombre;
            }
            if (estudianteInfo.apellido || estudianteInfo.apellidos) {
              estudiante.apellido = estudianteInfo.apellido || estudianteInfo.apellidos;
            }
          } else {
            console.log(`No se encontró información para el estudiante ${estudianteId}`);
          }
        } catch (error) {
          console.error(`Error al buscar la información del estudiante ${estudianteId}:`, error);
        }
        
        return {
          id: estudianteId,
          nombre: estudiante.nombre,
          apellido: estudiante.apellido,
          cedula: cedula, // Añadir la cédula al objeto de retorno
          representante: representante, // Añadir datos del representante
          calificaciones: calificacionesEstudiante
        };
      }))
    };

    // Ordenar estudiantes por cédula de menor a mayor (ascendente)
    reporte.estudiantes.sort((a, b) => {
      const cedulaA = a.cedula || 'N/D';
      const cedulaB = b.cedula || 'N/D';
      return cedulaA.localeCompare(cedulaB, undefined, { numeric: true });
    });

    // Generar el PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Configuración básica de la página
    const margin = 50;
    const fontSize = 9;
    const titleSize = 18;
    const headerSize = 10;
    const rowHeight = 20;
    
    // Colores según el modelo
    const azulOscuro = rgb(0.0, 0.29, 0.61); // Color azul del modelo
    const grisOscuro = rgb(0.3, 0.3, 0.3);
    const grisClaro = rgb(0.85, 0.85, 0.85);
    const blanco = rgb(1, 1, 1);
    const verde = rgb(0.0, 0.5, 0.0);
    const negro = rgb(0, 0, 0);
    
    // Cargar logo con manejo de errores
    const logoUrl = 'https://i.imgur.com/uopht0t.png';
    let logoImage;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const logoResponse = await fetch(logoUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      clearTimeout(timeoutId);
      
      const logoImageBytes = await logoResponse.arrayBuffer();
      logoImage = await pdfDoc.embedPng(logoImageBytes);
    } catch (error) {
      console.error('Error al cargar el logo:', error);
      logoImage = null;
    }

    // Generar una página por cada estudiante
    reporte.estudiantes.forEach((estudiante, estudianteIndex) => {
      const currentPage = pdfDoc.addPage([595, 842]); // Tamaño A4
      const { width: pageWidth, height: pageHeight } = currentPage.getSize();
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = pageHeight - margin;

      // ========== ENCABEZADO ==========
      // Logo (izquierda) - MÁS GRANDE
      if (logoImage) {
        const logoWidth = 120; // Aumentado a 120 para hacerlo aún más grande
        const logoHeight = logoWidth * (logoImage.height / logoImage.width);
        currentPage.drawImage(logoImage, {
          x: margin,
          y: yPosition - logoHeight,
          width: logoWidth,
          height: logoHeight
        });
      }

      // Título "BOLETIN DE NOTAS" (derecha del logo)
      const titleText = 'BOLETIN DE NOTAS';
      const titleWidth = helveticaBoldFont.widthOfTextAtSize(titleText, titleSize);
      currentPage.drawText(titleText, {
        x: pageWidth - margin - titleWidth,
        y: yPosition - 25,
        size: titleSize,
        font: helveticaBoldFont,
        color: azulOscuro
      });

      yPosition -= 80;

      // ========== LÍNEA SEPARADORA SUPERIOR ==========
      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 1.5,
        color: azulOscuro
      });

      yPosition -= 18;

      // Eliminado: bloque de representante aquí para moverlo debajo de los datos del estudiante

      // ========== INFORMACIÓN DEL AULA ==========
      // Primera línea: Año y Sección
      // Extraer el número del año (ej: "1 año" -> "1")
      const anioNumero = reporte.aula.anio.toString().replace(/[^\d]/g, '').trim() || reporte.aula.anio;
      currentPage.drawText(`Año: ${anioNumero}° Año`, {
        x: margin,
        y: yPosition,
        size: headerSize,
        font: helveticaBoldFont,
        color: negro
      });

      currentPage.drawText(`Sección: ${reporte.aula.seccion}`, {
        x: pageWidth - margin - 150,
        y: yPosition,
        size: headerSize,
        font: helveticaBoldFont,
        color: negro
      });

      yPosition -= 16;

      // Segunda línea: Año Escolar
      currentPage.drawText(`Año Escolar: ${reporte.aula.periodo}`, {
        x: margin,
        y: yPosition,
        size: headerSize,
        font: helveticaBoldFont,
        color: negro
      });

      yPosition -= 20;

      // ========== LÍNEA SEPARADORA ==========
      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 1.5,
        color: azulOscuro
      });

      yPosition -= 30;

      // ========== NOMBRE DEL ESTUDIANTE Y CÉDULA ==========
      currentPage.drawText(`Estudiante:`, {
        x: margin,
        y: yPosition,
        size: headerSize,
        font: helveticaBoldFont,
        color: negro
      });

      currentPage.drawText(`${estudiante.nombre} ${estudiante.apellido}`, {
        x: margin + 80,
        y: yPosition,
        size: headerSize,
        font: helveticaFont,
        color: negro
      });

      yPosition -= 18;

      currentPage.drawText(`CI: ${estudiante.cedula || 'N/D'}`, {
        x: margin + 80,
        y: yPosition,
        size: headerSize - 1,
        font: helveticaFont,
        color: grisOscuro
      });

      yPosition -= 30;

      // ========== TABLA DE CALIFICACIONES ==========
      const tablaInicioY = yPosition;
      
      // Encabezado de tabla con fondo azul
      currentPage.drawRectangle({
        x: margin,
        y: yPosition - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: azulOscuro
      });

      // Columnas con nueva distribución: Evaluaciones | 1M | 2M | 3M | Final
      const colEvaluacionesX = margin + 10; // Evaluaciones (antes Materias)
      const col1MX = pageWidth - margin - 250; // 1er M (movido más a la derecha para dar más espacio al nombre)
      const col2MX = pageWidth - margin - 190; // 2do M
      const col3MX = pageWidth - margin - 130; // 3er M
      const colFinalX = pageWidth - margin - 50; // Final

      // Encabezados en blanco
      currentPage.drawText('Evaluaciones', {
        x: colEvaluacionesX,
        y: yPosition - 14,
        size: fontSize,
        font: helveticaBoldFont,
        color: blanco
      });

      currentPage.drawText('1M', {
        x: col1MX + 5,
        y: yPosition - 14,
        size: fontSize,
        font: helveticaBoldFont,
        color: blanco
      });

      currentPage.drawText('2M', {
        x: col2MX + 5,
        y: yPosition - 14,
        size: fontSize,
        font: helveticaBoldFont,
        color: blanco
      });

      currentPage.drawText('3M', {
        x: col3MX + 5,
        y: yPosition - 14,
        size: fontSize,
        font: helveticaBoldFont,
        color: blanco
      });

      currentPage.drawText('Final', {
        x: colFinalX - 5,
        y: yPosition - 14,
        size: fontSize,
        font: helveticaBoldFont,
        color: blanco
      });

      yPosition -= rowHeight;

      // ========== FILAS DE MATERIAS ==========
      const calificaciones = estudiante.calificaciones || [];
      let sumaTotalCalificaciones = 0;
      let totalMaterias = 0;

      // Función para normalizar el nombre de la materia
      const normalizarNombreMateria = (nombreMateria) => {
        if (!nombreMateria) return nombreMateria;
        
        const nombreLower = nombreMateria.toLowerCase().trim();
        
        // Normalizar "Orientación" a "Orientación y convivencia"
        if (nombreLower.includes('orientacion') || nombreLower.includes('orientación')) {
          return 'Orientación y convivencia';
        }
        
        // Normalizar "Grupo y Participación" a "Participación en grupos de Creación, Recreación y Producción"
        if (nombreLower.includes('grupo') && nombreLower.includes('participacion') || 
            nombreLower.includes('grupo') && nombreLower.includes('participación') ||
            nombreLower.includes('participacion') && nombreLower.includes('grupos') ||
            nombreLower.includes('participación') && nombreLower.includes('grupos')) {
          return 'Participación en grupos de Creación, Recreación y Producción';
        }
        
        return nombreMateria;
      };

      calificaciones.forEach((calificacion, index) => {
        // Fondo alternado
        if (index % 2 === 0) {
          currentPage.drawRectangle({
            x: margin,
            y: yPosition - rowHeight,
            width: contentWidth,
            height: rowHeight,
            color: grisClaro
          });
        }

        // Normalizar el nombre de la materia antes de mostrarla
        let nombreMateriaNormalizado = normalizarNombreMateria(calificacion.materia);
        // Calcular el ancho máximo disponible para el nombre de la materia
        // Dejamos espacio hasta donde empieza la columna 1M (con un margen de seguridad)
        const anchoMaximoNombre = col1MX - colEvaluacionesX - 10; // 10px de margen de seguridad
        
        // Tamaño de fuente para el nombre de la materia - empezar con el tamaño normal
        let tamanoFuenteNombre = fontSize - 1;
        
        // Medir el ancho del texto con el tamaño de fuente actual
        let anchoTexto = helveticaFont.widthOfTextAtSize(nombreMateriaNormalizado, tamanoFuenteNombre);
        
        // Si el texto es muy largo, reducir progresivamente el tamaño de fuente hasta que quepa
        // Reducir hasta un mínimo de 6pt para mantener legibilidad
        const tamanoMinimo = 6;
        while (anchoTexto > anchoMaximoNombre && tamanoFuenteNombre > tamanoMinimo) {
          tamanoFuenteNombre -= 0.5; // Reducir en 0.5pt cada vez
          anchoTexto = helveticaFont.widthOfTextAtSize(nombreMateriaNormalizado, tamanoFuenteNombre);
        }
        
        // Si aún no cabe con el tamaño mínimo, usar el tamaño mínimo de todas formas
        // (mejor mostrar texto pequeño que truncado)
        if (anchoTexto > anchoMaximoNombre && tamanoFuenteNombre <= tamanoMinimo) {
          tamanoFuenteNombre = tamanoMinimo;
        }

        // Nombre de la materia (en columna "Evaluaciones") con ancho máximo
        currentPage.drawText(nombreMateriaNormalizado, {
          x: colEvaluacionesX,
          y: yPosition - 14,
          size: tamanoFuenteNombre,
          font: helveticaFont,
          color: negro
        });

        // Nota 1er Momento (siempre mostrar)
        let nota1 = '';
        if (calificacion.noAplica) {
          nota1 = DEFAULT_TEXT_CALIFICACION;
        } else if (calificacion.momento1) {
          nota1 = Math.round(calificacion.momento1).toString();
        }
        currentPage.drawText(nota1, {
          x: col1MX + 10,
          y: yPosition - 14,
          size: fontSize - 1,
          font: helveticaFont,
          color: negro
        });

        // Nota 2do Momento (mostrar "-" si el boletín es del 1er momento o no hay nota, "AP" si no aplica)
        let nota2 = '-';
        if (calificacion.noAplica) {
          nota2 = DEFAULT_TEXT_CALIFICACION;
        } else if (reporte.momento >= 2 && calificacion.momento2) {
          nota2 = Math.round(calificacion.momento2).toString();
        }
        currentPage.drawText(nota2, {
          x: col2MX + 10,
          y: yPosition - 14,
          size: fontSize - 1,
          font: helveticaFont,
          color: negro
        });

        // Nota 3er Momento (mostrar "-" si el boletín es del 1er o 2do momento o no hay nota, "AP" si no aplica)
        let nota3 = '-';
        if (calificacion.noAplica) {
          nota3 = DEFAULT_TEXT_CALIFICACION;
        } else if (reporte.momento === 3 && calificacion.momento3) {
          nota3 = Math.round(calificacion.momento3).toString();
        }
        currentPage.drawText(nota3, {
          x: col3MX + 10,
          y: yPosition - 14,
          size: fontSize - 1,
          font: helveticaFont,
          color: negro
        });

        // Calificación Final (mostrar "-" si no es momento 3, "AP" si no aplica)
        let notaFinal = '-';
        let colorNota = negro;
        
        if (calificacion.noAplica) {
          notaFinal = DEFAULT_TEXT_CALIFICACION;
        } else if (reporte.momento === 3 && calificacion.calificacion !== undefined && calificacion.calificacion !== DEFAULT_TEXT_CALIFICACION) {
          notaFinal = Math.round(calificacion.calificacion).toString();
          
          colorNota = calificacion.calificacion < 10 ? rgb(0.8, 0, 0) : verde;

          // Acumular para promedio (solo si no es "AP")
          if (!isNaN(calificacion.calificacion)) {
            sumaTotalCalificaciones += calificacion.calificacion;
            totalMaterias++;
          }
        }
        
        currentPage.drawText(notaFinal, {
          x: colFinalX,
          y: yPosition - 14,
          size: fontSize - 1,
          font: helveticaBoldFont,
          color: colorNota
        });

        yPosition -= rowHeight;
      });

      // ========== LÍNEA SEPARADORA ANTES DEL PROMEDIO ==========
      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 1,
        color: azulOscuro
      });

      yPosition -= 25;

      // ========== PROMEDIO FINAL ==========
      // Ocultado temporalmente - no se muestra el promedio final
      // const promedioFinal = totalMaterias > 0 ? Math.round(sumaTotalCalificaciones / totalMaterias).toString() : '0';
      // const colorPromedio = parseInt(promedioFinal) < 10 ? rgb(0.8, 0, 0) : verde;

      // currentPage.drawText('PROMEDIO FINAL:', {
      //   x: pageWidth - margin - 250,
      //   y: yPosition,
      //   size: headerSize + 2,
      //   font: helveticaBoldFont,
      //   color: negro
      // });

      // currentPage.drawText(promedioFinal, {
      //   x: pageWidth - margin - 70,
      //   y: yPosition,
      //   size: headerSize + 2,
      //   font: helveticaBoldFont,
      //   color: colorPromedio
      // });

      // yPosition -= 30;

      // ========== ÁREA SOMBREADA CON COMENTARIOS ==========
      // Bajamos más el bloque gris para dar espacio a las firmas
      yPosition -= 40; // Separación adicional antes del bloque de comentarios
      const areaComentariosY = yPosition;
      const alturaAreaComentarios = 120; // Altura reducida
      
      // Fondo azul claro para toda el área de comentarios
      currentPage.drawRectangle({
        x: margin,
        y: areaComentariosY - alturaAreaComentarios,
        width: contentWidth,
        height: alturaAreaComentarios,
        color: rgb(0.85, 0.9, 0.95) // Azul muy claro
      });

      // Borde del área de comentarios
      currentPage.drawRectangle({
        x: margin,
        y: areaComentariosY - alturaAreaComentarios,
        width: contentWidth,
        height: alturaAreaComentarios,
        borderColor: azulOscuro,
        borderWidth: 1
      });

      yPosition -= 15;

      // Título "Comentarios para el Estudiante"
      currentPage.drawText('Comentarios para el Estudiante', {
        x: margin + 10,
        y: yPosition,
        size: fontSize,
        font: helveticaBoldFont,
        color: azulOscuro
      });

      yPosition -= 35;

      // Línea divisoria horizontal
      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 0.5,
        color: azulOscuro
      });

      yPosition -= 15;

      // Fila con Ausencias Justificadas, Ausencias No Justificadas y Sello
      // Reducimos el ancho de las columnas numéricas (ausencias) y ampliamos el área del sello
      const col1Width = (contentWidth - 20) * 0.25; // Ausencias Justificadas
      const col2Width = (contentWidth - 20) * 0.25; // Ausencias no Justificadas
      const col3Width = (contentWidth - 20) * 0.50; // Sello de la Institución

      // Ausencias Justificadas (reducir tamaño de fuente si es necesario)
      currentPage.drawText('Ausencias Justificadas:', {
        x: margin + 5,
        y: yPosition,
        size: fontSize - 1.5,
        font: helveticaBoldFont,
        color: negro
      });

      // Línea vertical divisoria 1
      currentPage.drawLine({
        start: { x: margin + col1Width, y: yPosition + 12 },
        end: { x: margin + col1Width, y: yPosition - 22 },
        thickness: 0.5,
        color: azulOscuro
      });

      // Ausencias No Justificadas (reducir tamaño de fuente si es necesario)
      currentPage.drawText('Ausencias no Justificadas:', {
        x: margin + col1Width + 5,
        y: yPosition,
        size: fontSize - 1.5,
        font: helveticaBoldFont,
        color: negro
      });

      // Línea vertical divisoria 2
      currentPage.drawLine({
        start: { x: margin + col1Width + col2Width, y: yPosition + 12 },
        end: { x: margin + col1Width + col2Width, y: yPosition - 22 },
        thickness: 0.5,
        color: azulOscuro
      });

      // Sello de la Institución
      currentPage.drawText('Sello de la Institución', {
        x: margin + col1Width + col2Width + 15,
        y: yPosition,
        size: fontSize - 1,
        font: helveticaBoldFont,
        color: negro
      });

      yPosition -= 35;

      // Línea divisoria horizontal
      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 0.5,
        color: azulOscuro
      });

      yPosition -= 15;

      // Retrasos
      currentPage.drawText('Retrasos:', {
        x: margin + 10,
        y: yPosition,
        size: fontSize - 1,
        font: helveticaBoldFont,
        color: negro
      });

      // Salir del cuadro gris (después de yPosition actual)
      yPosition -= 35;

      // ========== FIRMAS FUERA DEL CUADRO GRIS ==========
      // Bajamos más para dar espacio suficiente entre el recuadro y las firmas
      yPosition -= 25;

      // Firmas: Directora y Representante (dos líneas separadas)
      const anchoFirma = (contentWidth - 80) / 2;
      const xFirma1 = margin + 20;
      const xFirma2 = margin + 60 + anchoFirma;

      // Firma de la Directora
      currentPage.drawText('Firma de la Directora:', {
        x: xFirma1,
        y: yPosition,
        size: fontSize - 1,
        font: helveticaBoldFont,
        color: negro
      });

      // Línea para firma de la directora
      currentPage.drawLine({
        start: { x: xFirma1, y: yPosition - 20 },
        end: { x: xFirma1 + anchoFirma, y: yPosition - 20 },
        thickness: 0.5,
        color: negro
      });

      // Firma del Representante
      currentPage.drawText('Firma del Representante:', {
        x: xFirma2,
        y: yPosition,
        size: fontSize - 1,
        font: helveticaBoldFont,
        color: negro
      });

      // Línea para firma del representante
      currentPage.drawLine({
        start: { x: xFirma2, y: yPosition - 20 },
        end: { x: xFirma2 + anchoFirma, y: yPosition - 20 },
        thickness: 0.5,
        color: negro
      });
    });

    try {
      // Generar el PDF final
      const pdfBytes = await pdfDoc.save();

      // Devolver el PDF como respuesta
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=reporte-${reporte.aula.anio}-${reporte.aula.seccion}-momento${reporte.momento}.pdf`
        }
      });
    } catch (error) {
      console.error('Error al generar reporte:', error);
      let errorMessage = 'Error al generar reporte';
      let statusCode = 500;

      if (error.code === 'MODULE_NOT_FOUND') {
        errorMessage = 'Error: Falta una dependencia necesaria';
      } else if (error.name === 'CastError') {
        errorMessage = 'Error: ID de aula inválido';
        statusCode = 400;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return new NextResponse(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error al procesar request:', error);
    return new NextResponse(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
