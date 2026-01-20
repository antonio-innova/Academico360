import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Estudiante from '@/database/models/Estudiante';

/**
 * Reporte de ESTADÍSTICAS GENERALES - Aprobados y Reprobados
 * Genera un Excel con estadísticas de todas las aulas: número de aprobados y reprobados por materia
 */
export async function GET(request) {
  try {
    await connectDB();

    const XLSX = await import('xlsx');
    const searchParams = request.nextUrl.searchParams;
    const momento = parseInt(searchParams.get('momento') || '1', 10);

    if (![1, 2, 3].includes(momento)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Momento inválido (debe ser 1, 2 o 3)' 
      }, { status: 400 });
    }

    // Obtener todas las aulas activas
    const aulas = await Aula.find({ estado: 1 }).lean();
    
    if (!aulas || aulas.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No se encontraron aulas activas' 
      }, { status: 404 });
    }

    // Función para determinar si es no cuantitativa
    const esNoCuantitativa = (nombreMateria = '') => {
      const n = String(nombreMateria).toLowerCase().trim();
      return n.includes('orientación') || n.includes('orientacion') || 
             n.includes('grupo') || n.includes('participación') || n.includes('participacion') ||
             n === 'grupo y participación' || n === 'grupo y participacion';
    };

    // Función para obtener puntos extras
    const buildPuntosExtraMap = (asignacion, momento) => {
      const map = {};
      const key = `momento${momento}`;
      if (asignacion?.puntosPorMomento && Array.isArray(asignacion.puntosPorMomento[key])) {
        asignacion.puntosPorMomento[key].forEach((registro) => {
          const id = registro?.alumnoId;
          if (!id && id !== 0) return;
          const keyId = id?.toString ? id.toString() : String(id);
          map[keyId] = parseFloat(registro.puntos) || 0;
        });
      } else if (Array.isArray(asignacion?.puntosExtras)) {
        asignacion.puntosExtras.forEach((registro) => {
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

    const normalizarCedula = (valor = '') => {
      const soloDigitos = String(valor || '').replace(/\\D/g, '');
      if (!soloDigitos) return '';
      const sinCeros = soloDigitos.replace(/^0+/, '');
      return sinCeros || '0';
    };

    // Obtener todas las materias únicas
    const todasLasMaterias = new Set();
    aulas.forEach(aula => {
      const asignaciones = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];
      asignaciones.forEach(asig => {
        if (asig.materia && asig.materia.nombre) {
          todasLasMaterias.add(asig.materia.nombre);
        }
      });
    });
    const materiasOrdenadas = Array.from(todasLasMaterias).sort();

    // Estadísticas por aula
    const estadisticasPorAula = [];
    let totalGeneralAprobados = 0;
    let totalGeneralReprobados = 0;
    let totalGeneralEstudiantes = 0;

    // Estadísticas por materia (global)
    const estadisticasPorMateria = {};
    materiasOrdenadas.forEach(materia => {
      estadisticasPorMateria[materia] = { aprobados: 0, reprobados: 0, total: 0 };
    });

    for (const aula of aulas) {
      const asignacionesAula = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];
      const estudiantesAula = Array.isArray(aula.alumnos) ? aula.alumnos : [];
      
      if (estudiantesAula.length === 0) continue;

      // Obtener estudiantes con sus datos completos
      const estudiantesIds = estudiantesAula.map(al => al._id?.toString()).filter(Boolean);
      const cedulasLista = estudiantesAula.map(al => al.idU || al.cedula).filter(Boolean);
      const estudiantesDocs = await Estudiante.find({
        $or: [
          { _id: { $in: estudiantesIds } },
          { idU: { $in: cedulasLista } }
        ]
      }).select('_id idU nombre apellido').lean();

      const idToInfo = new Map(estudiantesDocs.map(e => [e._id.toString(), e]));
      const idUToInfo = new Map(estudiantesDocs.map(e => [(e.idU || '').toString(), e]));

      // Estadísticas del aula
      const estadisticasAula = {
        nombre: aula.nombre || `${aula.anio}° ${aula.seccion}`,
        anio: aula.anio,
        seccion: aula.seccion,
        turno: aula.turno,
        totalEstudiantes: estudiantesAula.length,
        materias: {}
      };

      // Inicializar estadísticas de materias para esta aula
      materiasOrdenadas.forEach(materia => {
        estadisticasAula.materias[materia] = { aprobados: 0, reprobados: 0, total: 0 };
      });

      // Procesar cada estudiante
      for (const alumno of estudiantesAula) {
        const estudianteId = alumno._id?.toString() || alumno.id || '';
        let estDoc = idToInfo.get(estudianteId);
        if (!estDoc && (alumno.idU || alumno.cedula)) {
          estDoc = idUToInfo.get(String(alumno.idU || alumno.cedula));
        }

        // Obtener materias asignadas
        let materiasAsignadas = [];
        let tieneRestricciones = false;
        
        if (alumno.materiasAsignadas === undefined || alumno.materiasAsignadas === null || 
            (Array.isArray(alumno.materiasAsignadas) && alumno.materiasAsignadas.length === 0)) {
          materiasAsignadas = asignacionesAula.map(asig => asig.materia?.id).filter(Boolean);
          tieneRestricciones = false;
        } else if (Array.isArray(alumno.materiasAsignadas) && alumno.materiasAsignadas.length > 0) {
          materiasAsignadas = alumno.materiasAsignadas;
          tieneRestricciones = true;
        }

        // Procesar cada asignación
        for (const asig of asignacionesAula) {
          const nombreMateria = asig.materia?.nombre || 'Materia';
          const materiaId = asig.materia?.id;
          const bloqueado = asig.momentosBloqueados?.[momento] === true;
          
          if (bloqueado) continue;

          // Si tiene restricciones Y NO tiene esta materia asignada, saltar
          if (tieneRestricciones && materiaId && !materiasAsignadas.includes(materiaId)) {
            continue;
          }

          const actividades = Array.isArray(asig.actividades) ? asig.actividades : [];
          const puntosExtraMap = buildPuntosExtraMap(asig, momento);
          
          const actsMomento = actividades.filter(a => parseInt(a.momento) === momento);
          const registrosPromedio = [];

          const posiblesIdsAlumno = [
            estudianteId,
            alumno.id && alumno.id.toString(),
            alumno.idU && alumno.idU.toString(),
            alumno.cedula && alumno.cedula.toString()
          ].filter(Boolean);

          const posiblesIdsNormalizados = posiblesIdsAlumno.map(normalizarCedula).filter(Boolean);

          const coincideAlumno = (cal) => {
            const val = cal?.alumnoId;
            const str = val?.toString ? val.toString() : String(val);
            if (posiblesIdsAlumno.includes(str)) return true;
            const norm = normalizarCedula(str);
            return norm && posiblesIdsNormalizados.includes(norm);
          };

          let estaAprobado = false;

          // Verificar si es materia alfabética
          const esAlfabetica = esNoCuantitativa(nombreMateria);

          if (esAlfabetica) {
            // Para materias alfabéticas, obtener la última calificación alfabética
            let ultimaNotaAlfabetica = '';
            let tieneCalificacion = false;
            
            const actsOrdenadas = [...actsMomento].sort((a, b) => {
              const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
              const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
              return fechaB - fechaA;
            });

            for (const act of actsOrdenadas) {
              const cal = (act.calificaciones || []).find(coincideAlumno);
              if (cal) {
                tieneCalificacion = true;
                if (cal.tipoCalificacion === 'alfabetica' && cal.notaAlfabetica) {
                  ultimaNotaAlfabetica = String(cal.notaAlfabetica || '').trim().toUpperCase();
                  break;
                } else if (cal.nota !== undefined && cal.nota !== null) {
                  // Si tiene nota numérica, convertirla a alfabética
                  const nota = parseFloat(cal.nota);
                  if (!isNaN(nota)) {
                    if (nota >= 18) ultimaNotaAlfabetica = 'A';
                    else if (nota >= 14) ultimaNotaAlfabetica = 'B';
                    else if (nota >= 10) ultimaNotaAlfabetica = 'C';
                    else if (nota >= 7) ultimaNotaAlfabetica = 'D';
                    else if (nota >= 4) ultimaNotaAlfabetica = 'E';
                    else ultimaNotaAlfabetica = 'F';
                    break;
                  }
                }
              }
            }

            // A, B, C = Aprobado; D, E, F = Reprobado
            if (tieneCalificacion) {
              estaAprobado = ultimaNotaAlfabetica === 'A' || ultimaNotaAlfabetica === 'B' || ultimaNotaAlfabetica === 'C';
              registrosPromedio.push({ valor: 1 }); // Marcar que tiene calificación
            }
          } else {
            // Para materias numéricas, calcular promedio
            for (const act of actsMomento) {
              const cal = (act.calificaciones || []).find(coincideAlumno);
              const porcentaje = parseFloat(act.porcentaje) || 0;
              let valorNumerico = null;

              if (cal) {
                const literalNota = cal.tipoCalificacion === 'np' || cal.tipoCalificacion === 'inasistente';
                if (literalNota) {
                  valorNumerico = 1;
                } else if (cal.tipoCalificacion === 'alfabetica' && cal.notaAlfabetica) {
                  const map = { A: 19, B: 15.5, C: 12, D: 5.5, E: 3, F: 1 };
                  valorNumerico = map[String(cal.notaAlfabetica || '').trim().toUpperCase()] ?? null;
                } else if (cal.nota !== undefined && cal.nota !== null) {
                  const valor = parseFloat(cal.nota);
                  if (!isNaN(valor)) valorNumerico = valor;
                }
              }

              if (valorNumerico !== null) {
                registrosPromedio.push({ valor: valorNumerico, porcentaje });
              }
            }

            if (registrosPromedio.length > 0) {
              const promedioBase = registrosPromedio.reduce((sum, item) => {
                const porcentaje = item.porcentaje > 0 ? item.porcentaje : 0;
                return sum + (item.valor * (porcentaje / 100));
              }, 0);
              const puntosExtraAlumno = obtenerPuntosExtraAlumno(puntosExtraMap, alumno);
              const promedioConPuntos = Math.min(20, Math.max(0, promedioBase + puntosExtraAlumno));
              const promedioFinal = Math.min(20, Math.max(0, redondearPromedio(promedioConPuntos)));
              
              estaAprobado = promedioFinal >= 10;
            }
          }

          // Actualizar estadísticas si el estudiante tiene calificaciones en esta materia
          if (registrosPromedio.length > 0) {
            estadisticasAula.materias[nombreMateria].total++;
            estadisticasPorMateria[nombreMateria].total++;

            if (estaAprobado) {
              estadisticasAula.materias[nombreMateria].aprobados++;
              estadisticasPorMateria[nombreMateria].aprobados++;
            } else {
              estadisticasAula.materias[nombreMateria].reprobados++;
              estadisticasPorMateria[nombreMateria].reprobados++;
            }
          }
        }
      }

      // Calcular totales del aula
      let aprobadosAula = 0;
      let reprobadosAula = 0;
      Object.values(estadisticasAula.materias).forEach(stats => {
        aprobadosAula += stats.aprobados;
        reprobadosAula += stats.reprobados;
      });

      estadisticasAula.totalAprobados = aprobadosAula;
      estadisticasAula.totalReprobados = reprobadosAula;

      totalGeneralAprobados += aprobadosAula;
      totalGeneralReprobados += reprobadosAula;
      totalGeneralEstudiantes += estudiantesAula.length;

      estadisticasPorAula.push(estadisticasAula);
    }

    // Construir Excel
    const data = [];
    
    // Encabezado del reporte
    data.push(['REPORTE ESTADÍSTICO GENERAL - APROBADOS Y REPROBADOS']);
    data.push([`Momento ${momento}`]);
    data.push([`Total de Aulas: ${estadisticasPorAula.length}`]);
    data.push([`Total de Estudiantes: ${totalGeneralEstudiantes}`]);
    data.push([`Total Aprobados: ${totalGeneralAprobados}`]);
    data.push([`Total Reprobados: ${totalGeneralReprobados}`]);
    data.push([]); // Línea vacía

    // Sección 1: Estadísticas por Aula
    data.push(['ESTADÍSTICAS POR AULA']);
    data.push([]);

    // Encabezados para estadísticas por aula
    const headersAula = ['Aula', 'Año', 'Sección', 'Turno', 'Total Estudiantes', 'Total Aprobados', 'Total Reprobados', '% Aprobados'];
    data.push(headersAula);

    // Datos por aula
    estadisticasPorAula.forEach(aula => {
      const totalCalificaciones = aula.totalAprobados + aula.totalReprobados;
      const porcentajeAprobados = totalCalificaciones > 0 ? ((aula.totalAprobados / totalCalificaciones) * 100).toFixed(1) : '0.0';
      
      data.push([
        aula.nombre,
        aula.anio,
        aula.seccion,
        aula.turno,
        aula.totalEstudiantes,
        aula.totalAprobados,
        aula.totalReprobados,
        `${porcentajeAprobados}%`
      ]);
    });

    data.push([]); // Línea vacía
    data.push([]); // Línea vacía

    // Sección 2: Estadísticas por Materia
    data.push(['ESTADÍSTICAS POR MATERIA']);
    data.push([]);

    const headersMateria = ['Materia', 'Total Calificaciones', 'Aprobados', 'Reprobados', '% Aprobados'];
    data.push(headersMateria);

    // Datos por materia
    materiasOrdenadas.forEach(materia => {
      const stats = estadisticasPorMateria[materia];
      const porcentajeAprobados = stats.total > 0 ? ((stats.aprobados / stats.total) * 100).toFixed(1) : '0.0';
      
      data.push([
        materia,
        stats.total,
        stats.aprobados,
        stats.reprobados,
        `${porcentajeAprobados}%`
      ]);
    });

    data.push([]); // Línea vacía
    data.push([]); // Línea vacía

    // Sección 3: Detalle por Aula y Materia (separado por aula)
    data.push(['DETALLE POR AULA Y MATERIA']);
    data.push([]);

    estadisticasPorAula.forEach((aula, indexAula) => {
      // Título del aula con información completa
      data.push([`AULA: ${aula.nombre} - ${aula.anio}° Año Sección ${aula.seccion} (${aula.turno})`]);
      
      // Encabezados de la tabla para esta aula
      const headersDetalle = ['Materia', 'Aprobados', 'Reprobados', 'Total', '% Aprobados'];
      data.push(headersDetalle);

      // Datos de materias de esta aula
      let aulaHayDatos = false;
      materiasOrdenadas.forEach(materia => {
        const stats = aula.materias[materia];
        if (stats.total > 0) {
          aulaHayDatos = true;
          const porcentajeAprobados = ((stats.aprobados / stats.total) * 100).toFixed(1);
          data.push([
            materia,
            stats.aprobados,
            stats.reprobados,
            stats.total,
            `${porcentajeAprobados}%`
          ]);
        }
      });

      // Si no hay datos, mostrar mensaje
      if (!aulaHayDatos) {
        data.push(['(Sin calificaciones registradas)', '', '', '', '']);
      }

      // Línea en blanco entre aulas (excepto después de la última)
      if (indexAula < estadisticasPorAula.length - 1) {
        data.push([]);
      }
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos de columna (ajustados para las diferentes secciones)
    const cols = [
      { wch: 30 }, // Aula/Materia (más ancho para nombres completos)
      { wch: 8 },  // Año
      { wch: 10 }, // Sección
      { wch: 12 }, // Turno
      { wch: 15 }, // Total Estudiantes/Total
      { wch: 15 }, // Total Aprobados/Aprobados
      { wch: 15 }, // Total Reprobados/Reprobados
      { wch: 12 }, // % Aprobados
      { wch: 12 }  // % Aprobados (detalle)
    ];
    ws['!cols'] = cols;

    // Configuración de página
    ws['!pageSetup'] = {
      paperSize: 9,
      orientation: 'landscape',
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
    };

    XLSX.utils.book_append_sheet(wb, ws, `Estadísticas M${momento}`);

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const fecha = new Date().toISOString().split('T')[0];
    const archivo = `ESTADISTICAS_GENERALES_Momento${momento}_${fecha}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${archivo}"`
      }
    });
  } catch (error) {
    console.error('Error al generar estadísticas generales:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error al generar reporte: ${error.message}` 
    }, { status: 500 });
  }
}
