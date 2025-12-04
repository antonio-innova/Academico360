import { NextResponse } from 'next/server';
import { connectDB } from '../../../database/db';
import Aula from '../../../database/models/Aula';
import Estudiante from '../../../database/models/Estudiante';
import * as XLSX from 'xlsx';

export async function GET(request) {
  try {
    console.log('🚀 INICIO - Endpoint planilla-momento llamado');
    await connectDB();
    console.log('🚀 Base de datos conectada');

    const { searchParams } = new URL(request.url);
    const aulaId = searchParams.get('aulaId');
    const materiaId = searchParams.get('materiaId');
    const momento = parseInt(searchParams.get('momento')) || 1;

    console.log('🚀 Parámetros recibidos:', { aulaId, materiaId, momento });

    if (!aulaId || !materiaId) {
      console.log('🚀 ERROR: Faltan parámetros requeridos');
      return NextResponse.json({
        success: false,
        message: 'aulaId y materiaId son requeridos'
      }, { status: 400 });
    }

    console.log(`🚀 Generando planilla para aula: ${aulaId}, materia: ${materiaId}, momento: ${momento}`);

    // Obtener el aula con sus asignaciones
    const aula = await Aula.findById(aulaId).exec();

    console.log('🚀 Aula encontrada:', aula ? 'SÍ' : 'NO');
    if (!aula) {
      console.log('🚀 ERROR: Aula no encontrada');
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    // Encontrar la asignación de la materia
    console.log('🚀 Buscando asignación para materia:', materiaId);
    console.log('🚀 Asignaciones disponibles:', aula.asignaciones?.map(a => ({ 
      id: a.materia?.id, 
      nombre: a.materia?.nombre,
      profesor: a.profesor 
    })));
    
    const asignacion = aula.asignaciones.find(a => a.materia.id === materiaId);
    console.log('🚀 Asignación encontrada:', asignacion ? 'SÍ' : 'NO');
    
    if (!asignacion) {
      console.log('🚀 ERROR: Materia no encontrada en el aula');
      return NextResponse.json({
        success: false,
        message: 'Materia no encontrada en el aula'
      }, { status: 404 });
    }

    // Obtener actividades del momento específico
    console.log('🚀 Actividades totales:', asignacion.actividades?.length || 0);
    const actividadesMomento = asignacion.actividades.filter(act => act.momento === momento);
    console.log(`🚀 Actividades del momento ${momento}:`, actividadesMomento.length);
    
    // Filtrar alumnos: solo los que tienen esta materia asignada
    const alumnosFiltrados = (aula.alumnos || []).filter(alumno => {
      const alumnoId = alumno._id?.toString() || alumno.id?.toString() || '';
      const materiasAsignadas = alumno.materiasAsignadas;
      
      // Si el alumno no tiene materiasAsignadas definidas o tiene array vacío, asume que ve todas (compatibilidad hacia atrás)
      if (materiasAsignadas === undefined || materiasAsignadas === null || (Array.isArray(materiasAsignadas) && materiasAsignadas.length === 0)) {
        console.log(`✅ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): Sin materiasAsignadas o array vacío → VER TODAS`);
        return true; // Por defecto para estudiantes antiguos o sin restricciones, ver todas las materias
      }
      
      // Si tiene materias asignadas, verificar si la materia actual está en la lista
      // Normalizar IDs para comparación (convertir a string y trim)
      const materiaIdNormalizado = String(materiaId || '').trim();
      const tieneMateria = Array.isArray(materiasAsignadas) && materiasAsignadas.some(matId => {
        const matIdNormalizado = String(matId || '').trim();
        return matIdNormalizado === materiaIdNormalizado;
      });
      
      if (tieneMateria) {
        console.log(`✅ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): Tiene materia ${materiaIdNormalizado} asignada → VER`);
      } else {
        console.log(`❌ Estudiante ${alumno.nombre} ${alumno.apellido || ''} (${alumnoId}): NO tiene materia ${materiaIdNormalizado} (tiene: ${materiasAsignadas.join(', ')}) → NO VER`);
      }
      
      return tieneMateria;
    });
    
    console.log(`📚 RESUMEN - Filtrando alumnos para planilla (materia ${materiaId}):`, {
      total: aula.alumnos?.length || 0,
      filtrados: alumnosFiltrados.length,
      excluidos: (aula.alumnos?.length || 0) - alumnosFiltrados.length
    });
    
    // Obtener datos completos de los estudiantes ordenados por cédula
    const estudiantesCompletos = await Promise.all(
      alumnosFiltrados.map(async (alumno) => {
        try {
          const estudiante = await Estudiante.findById(alumno._id);
          return {
            ...alumno.toObject(),
            cedulaReal: estudiante?.idU || estudiante?.cedula || 'N/P',
            nombreCompleto: `${estudiante?.apellido || alumno.apellido || ''} ${estudiante?.nombre || alumno.nombre || ''}`.trim()
          };
        } catch (error) {
          return {
            ...alumno.toObject(),
            cedulaReal: 'N/P',
            nombreCompleto: `${alumno.apellido || ''} ${alumno.nombre || ''}`.trim()
          };
        }
      })
    );

    // Ordenar estudiantes por cédula
    const estudiantesOrdenados = estudiantesCompletos.sort((a, b) => {
      const cedulaA = String(a.cedulaReal || '').trim();
      const cedulaB = String(b.cedulaReal || '').trim();
      
      if (cedulaA === 'N/P' || cedulaA === '') return 1;
      if (cedulaB === 'N/P' || cedulaB === '') return -1;
      
      const numA = parseInt(cedulaA.replace(/\D/g, ''), 10);
      const numB = parseInt(cedulaB.replace(/\D/g, ''), 10);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      return cedulaA.localeCompare(cedulaB);
    });

    // Crear el workbook
    const wb = XLSX.utils.book_new();

    // Helpers para puntos extras y redondeo (mismas reglas que en reportes)
    const buildPuntosExtraMap = (asignacionLocal, momentoLocal) => {
      const map = {};
      const key = `momento${momentoLocal}`;
      if (asignacionLocal?.puntosPorMomento && Array.isArray(asignacionLocal.puntosPorMomento[key])) {
        asignacionLocal.puntosPorMomento[key].forEach((registro) => {
          const id = registro?.alumnoId;
          if (!id && id !== 0) return;
          const keyId = id?.toString ? id.toString() : String(id);
          map[keyId] = parseFloat(registro.puntos) || 0;
        });
      } else if (Array.isArray(asignacionLocal?.puntosExtras)) {
        asignacionLocal.puntosExtras.forEach((registro) => {
          const id = registro?.alumnoId;
          if (!id && id !== 0) return;
          const keyId = id?.toString ? id.toString() : String(id);
          map[keyId] = parseFloat(registro.puntos) || 0;
        });
      }
      return map;
    };

    const obtenerPuntosExtraAlumno = (map, alumno) => {
      if (!map) return 0;
      const posibles = [
        alumno._id && alumno._id.toString(),
        alumno.id && alumno.id.toString(),
        alumno.idU && alumno.idU.toString(),
        alumno.cedulaReal && alumno.cedulaReal.toString(),
        alumno.cedula && alumno.cedula.toString()
      ];
      for (const key of posibles) {
        if (key && map[key] !== undefined) {
          return parseFloat(map[key]) || 0;
        }
      }
      return 0;
    };

    const redondearPromedio = (valor) => {
      if (!isFinite(valor)) return 0;
      const enteroBase = Math.floor(valor);
      const decimal = valor - enteroBase;
      if (decimal >= 0.5) return enteroBase + 1;
      return enteroBase;
    };

    // Mapa de puntos extra para este momento
    const puntosExtraMap = buildPuntosExtraMap(asignacion, momento);

    // Crear encabezados con información real
    const nombreAula = `${aula.anio}° AÑO "${aula.seccion}"`;
    const nombreMateria = asignacion.materia?.nombre || 'MATERIA';
    const nombreDocente = asignacion.profesor ? 
      `${asignacion.profesor.nombre || ''} ${asignacion.profesor.apellido || ''}`.trim() || 'DOCENTE' : 
      'DOCENTE';
    
    console.log('🚀 Información para planilla:', {
      nombreAula,
      nombreMateria,
      nombreDocente,
      profesor: asignacion.profesor
    });
    
    // Encabezados de columnas de evaluación: EV1..EV8 y DEF (definitivo)
    const nombresActividades = [];
    const maxActividadesHeader = 8;
    for (let i = 0; i < maxActividadesHeader; i++) {
      nombresActividades.push(`EV${i + 1}`);
    }
    // Agregar columna de definitivo al final
    nombresActividades.push('DEF');

    const headers = [
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', nombreAula, '', '', '', `${momento}° MOMENTO`, '', '', '', '', '', '', '', ''],
      ['', 'COLEGIO LAS ACACIAS', '', '', '', 'ÁREA DE APRENDIZAJE:', '', '', '', '', '', '', '', ''],
      ['', 'CURSO ACADÉMICO:', '', '', '', nombreMateria, '', '', '', '', '', '', '', ''],
      ['', '2025-2026', '', '', '', 'DOCENTE:', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', nombreDocente, '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['N°', 'CÉDULA', 'APELLIDOS Y NOMBRES', '', '', ...nombresActividades]
    ];

    // Crear filas de datos
    const filas = estudiantesOrdenados.map((estudiante, index) => {
      const fila = [
        index + 1,
        estudiante.cedulaReal,
        estudiante.nombreCompleto,
        '', // Columna vacía para separación
        '', // Columna vacía para separación
      ];

      // Agregar calificaciones de cada actividad (EV1..EV8) y calcular definitivo con porcentaje
      const maxActividades = 8;
      const registrosPromedio = [];

      for (let i = 0; i < maxActividades; i++) {
        if (i < actividadesMomento.length) {
          const actividad = actividadesMomento[i];
          const calificacion = actividad.calificaciones?.find(c =>
            c.alumnoId === estudiante._id.toString()
          );

          const porcentaje = parseFloat(actividad.porcentaje) || 0;
          let valorNumerico = null;

          if (calificacion && calificacion.nota !== undefined && calificacion.nota !== null && calificacion.nota !== '') {
            const notaNumber = typeof calificacion.nota === 'number'
              ? calificacion.nota
              : parseFloat(calificacion.nota);
            if (!Number.isNaN(notaNumber)) {
              valorNumerico = notaNumber;
            }
          }

          if (valorNumerico !== null) {
            registrosPromedio.push({ valor: valorNumerico, porcentaje });
            fila.push(valorNumerico);
          } else {
            fila.push('');
          }
        } else {
          fila.push(''); // Columnas vacías si no hay más actividades
        }
      }

      // Calcular definitivo como sum(nota * porcentaje / 100) + puntosExtra, limitado entre 0 y 20
      let definitivo = '';
      if (registrosPromedio.length > 0) {
        const sumaPonderada = registrosPromedio.reduce((sum, item) => {
          const porcentaje = item.porcentaje > 0 ? item.porcentaje : 0;
          return sum + (item.valor * (porcentaje / 100));
        }, 0);
        const puntosExtraAlumno = obtenerPuntosExtraAlumno(puntosExtraMap, estudiante);
        const baseConPuntos = Math.min(20, Math.max(0, sumaPonderada + puntosExtraAlumno));
        const notaRedondeada = Math.min(20, Math.max(0, redondearPromedio(baseConPuntos)));
        definitivo = notaRedondeada;
      }

      fila.push(definitivo);

      return fila;
    });

    // Combinar encabezados y datos
    const wsData = [...headers, ...filas];

    // Crear la hoja de trabajo
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Configurar anchos de columna (sin promedio ni observaciones)
    const colWidths = [
      { wch: 5 },   // N°
      { wch: 12 },  // CÉDULA
      { wch: 35 },  // APELLIDOS Y NOMBRES
      { wch: 4 },   // Separación
      { wch: 4 },   // Separación
      { wch: 8 },   // EV1
      { wch: 8 },   // EV2
      { wch: 8 },   // EV3
      { wch: 8 },   // EV4
      { wch: 8 },   // EV5
      { wch: 8 },   // EV6
      { wch: 8 },   // EV7
      { wch: 8 },   // EV8
      { wch: 8 }    // DEF
    ];
    ws['!cols'] = colWidths;

    // Configurar combinación de celdas para el encabezado
    ws['!merges'] = [
      { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }, // Nombre del aula
      { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } }, // "COLEGIO LAS ACACIAS"
      { s: { r: 4, c: 1 }, e: { r: 4, c: 4 } }, // "CURSO ACADÉMICO"
      { s: { r: 5, c: 1 }, e: { r: 5, c: 4 } }, // "2025-2026"
      { s: { r: 2, c: 5 }, e: { r: 2, c: 10 } }, // "X° MOMENTO"
      { s: { r: 3, c: 5 }, e: { r: 3, c: 10 } }, // "ÁREA DE APRENDIZAJE:"
      { s: { r: 4, c: 5 }, e: { r: 4, c: 10 } }, // Nombre de la materia
      { s: { r: 5, c: 5 }, e: { r: 5, c: 10 } }, // "DOCENTE:"
      { s: { r: 6, c: 5 }, e: { r: 6, c: 10 } }, // Nombre del docente
      { s: { r: 8, c: 2 }, e: { r: 8, c: 4 } }  // "APELLIDOS Y NOMBRES"
    ];

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, `Momento ${momento}`);

    // Generar el buffer del archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Crear el nombre del archivo
    const fechaHoy = new Date().toISOString().split('T')[0];
    const fileName = `Planilla_${nombreMateria.replace(/[^a-zA-Z0-9]/g, '_')}_${momento}Momento_${aula.anio}${aula.seccion}_${fechaHoy}.xlsx`;

    // Retornar el archivo
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error al generar planilla:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al generar planilla',
      error: error.message
    }, { status: 500 });
  }
}


