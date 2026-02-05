import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Estudiante from '@/database/models/Estudiante';

/**
 * Reporte de DISTRIBUCIÓN DE PROMEDIOS
 * Cuenta cuántos estudiantes tienen cada promedio (20, 19, 18, etc.) por momento en todas las aulas
 */
export async function GET(request) {
  try {
    await connectDB();

    const XLSX = await import('xlsx');
    const searchParams = request.nextUrl.searchParams;
    const momento = parseInt(searchParams.get('momento') || '1', 10);

    if (![1, 2, 3, 4].includes(momento)) {
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

    // Inicializar contador de promedios (0 a 20)
    const distribucionPromedios = {};
    for (let i = 0; i <= 20; i++) {
      distribucionPromedios[i] = 0;
    }

    // Distribución por aula
    const distribucionPorAula = {};

    // Procesar cada aula
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

      // Inicializar distribución para esta aula
      const nombreAula = aula.nombre || `${aula.anio}° ${aula.seccion}`;
      distribucionPorAula[nombreAula] = {};
      for (let i = 0; i <= 20; i++) {
        distribucionPorAula[nombreAula][i] = 0;
      }

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

        // Calcular promedio general del estudiante (promedio de todas sus materias)
        const promediosPorMateria = [];
        
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

          // Verificar si es materia alfabética
          const esAlfabetica = esNoCuantitativa(nombreMateria);

          if (esAlfabetica) {
            // Para materias alfabéticas, obtener la última calificación alfabética
            let ultimaNotaAlfabetica = '';
            
            const actsOrdenadas = [...actsMomento].sort((a, b) => {
              const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
              const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
              return fechaB - fechaA;
            });

            for (const act of actsOrdenadas) {
              const cal = (act.calificaciones || []).find(coincideAlumno);
              if (cal) {
                if (cal.tipoCalificacion === 'alfabetica' && cal.notaAlfabetica) {
                  ultimaNotaAlfabetica = String(cal.notaAlfabetica || '').trim().toUpperCase();
                  break;
                } else if (cal.nota !== undefined && cal.nota !== null) {
                  // Convertir nota numérica a alfabética
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

            // Convertir letra a número para el promedio
            if (ultimaNotaAlfabetica) {
              const map = { A: 19, B: 15.5, C: 12, D: 5.5, E: 3, F: 1 };
              const valorNumerico = map[ultimaNotaAlfabetica] ?? 0;
              if (valorNumerico > 0) {
                promediosPorMateria.push(valorNumerico);
              }
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
              promediosPorMateria.push(promedioFinal);
            }
          }
        }

        // Calcular promedio general del estudiante (promedio de todas sus materias)
        if (promediosPorMateria.length > 0) {
          const promedioGeneral = promediosPorMateria.reduce((sum, prom) => sum + prom, 0) / promediosPorMateria.length;
          const promedioRedondeado = Math.round(promedioGeneral);
          const promedioFinal = Math.min(20, Math.max(0, promedioRedondeado));

          // Contar en distribución general
          distribucionPromedios[promedioFinal] = (distribucionPromedios[promedioFinal] || 0) + 1;

          // Contar en distribución por aula
          distribucionPorAula[nombreAula][promedioFinal] = (distribucionPorAula[nombreAula][promedioFinal] || 0) + 1;
        }
      }
    }

    // Construir Excel
    const data = [];
    
    // Encabezado del reporte
    data.push(['REPORTE DE DISTRIBUCIÓN DE PROMEDIOS']);
    data.push([`Momento ${momento}`]);
    data.push([`Total de Aulas: ${aulas.length}`]);
    data.push([]); // Línea vacía

    // Sección 1: Distribución General
    data.push(['DISTRIBUCIÓN GENERAL DE PROMEDIOS']);
    data.push([]);
    data.push(['Promedio', 'Cantidad de Estudiantes', '% del Total']);

    // Calcular total de estudiantes
    const totalEstudiantes = Object.values(distribucionPromedios).reduce((sum, count) => sum + count, 0);

    // Mostrar de 20 a 0
    for (let i = 20; i >= 0; i--) {
      const cantidad = distribucionPromedios[i] || 0;
      const porcentaje = totalEstudiantes > 0 ? ((cantidad / totalEstudiantes) * 100).toFixed(2) : '0.00';
      data.push([i, cantidad, `${porcentaje}%`]);
    }

    data.push([]);
    data.push(['TOTAL', totalEstudiantes, '100.00%']);
    data.push([]); // Línea vacía
    data.push([]); // Línea vacía

    // Sección 2: Distribución por Aula
    data.push(['DISTRIBUCIÓN POR AULA']);
    data.push([]);

    // Encabezados
    const headersAula = ['Aula', '20', '19', '18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', 'Total'];
    data.push(headersAula);

    // Datos por aula
    Object.keys(distribucionPorAula).sort().forEach(nombreAula => {
      const distribucion = distribucionPorAula[nombreAula];
      const totalAula = Object.values(distribucion).reduce((sum, count) => sum + count, 0);
      
      const row = [nombreAula];
      for (let i = 20; i >= 0; i--) {
        row.push(distribucion[i] || 0);
      }
      row.push(totalAula);
      data.push(row);
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos de columna
    const cols = [
      { wch: 25 }, // Aula/Promedio
      { wch: 20 }, // Cantidad/20
      { wch: 12 }, // %/19
      ...Array(21).fill({ wch: 8 }), // 18-0
      { wch: 10 }  // Total
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

    XLSX.utils.book_append_sheet(wb, ws, `Distribución M${momento}`);

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const fecha = new Date().toISOString().split('T')[0];
    const archivo = `DISTRIBUCION_PROMEDIOS_Momento${momento}_${fecha}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${archivo}"`
      }
    });
  } catch (error) {
    console.error('Error al generar distribución de promedios:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error al generar reporte: ${error.message}` 
    }, { status: 500 });
  }
}

