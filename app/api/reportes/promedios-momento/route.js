import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Estudiante from '@/database/models/Estudiante';

/**
 * Reporte de PROMEDIOS por Momento
 * Genera un Excel con los promedios de cada estudiante por materia en un momento específico
 */
export async function GET(request) {
  try {
    await connectDB();

    const XLSX = await import('xlsx');
    const searchParams = request.nextUrl.searchParams;
    const aulaId = searchParams.get('aulaId');
    const momento = parseInt(searchParams.get('momento') || '1', 10);

    if (!aulaId || ![1, 2, 3, 4].includes(momento)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Parámetros inválidos (aulaId y momento 1-4 requerido)' 
      }, { status: 400 });
    }

    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      return NextResponse.json({ 
        success: false, 
        message: 'Aula no encontrada' 
      }, { status: 404 });
    }

    const asignacionesAula = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];

    // Obtener materias únicas en orden
    const materiasOrdenadas = Array.from(new Set(
      asignacionesAula
        .filter(a => a.materia && a.materia.nombre)
        .map(a => a.materia.nombre)
    ));

    // Obtener estudiantes con sus datos completos
    const estudiantesIds = (aula.alumnos || []).map(al => al._id?.toString()).filter(Boolean);
    const cedulasLista = (aula.alumnos || []).map(al => al.idU || al.cedula).filter(Boolean);
    const estudiantesDocs = await Estudiante.find({
      $or: [
        { _id: { $in: estudiantesIds } },
        { idU: { $in: cedulasLista } }
      ]
    }).select('_id idU nombre apellido').lean();

    const idToInfo = new Map(estudiantesDocs.map(e => [e._id.toString(), e]));
    const idUToInfo = new Map(estudiantesDocs.map(e => [(e.idU || '').toString(), e]));

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

    // Calcular promedios por estudiante y materia
    const estudiantesConPromedios = (aula.alumnos || []).map((alumno, idx) => {
      const estudianteId = alumno._id?.toString() || alumno.id || '';
      let estDoc = idToInfo.get(estudianteId);
      if (!estDoc && (alumno.idU || alumno.cedula)) {
        estDoc = idUToInfo.get(String(alumno.idU || alumno.cedula));
      }
      const cedula = estDoc?.idU || alumno.idU || alumno.cedula || '';
      const apellido = (estDoc?.apellido && estDoc.apellido.trim()) || alumno.apellido || '';
      const nombre = (estDoc?.nombre && estDoc.nombre.trim()) || alumno.nombre || '';

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

      const promediosPorMateria = {};
      
      for (const asig of asignacionesAula) {
        const nombreMateria = asig.materia?.nombre || 'Materia';
        const materiaId = asig.materia?.id;
        const bloqueado = asig.momentosBloqueados?.[momento] === true;
        
        if (!promediosPorMateria[nombreMateria]) promediosPorMateria[nombreMateria] = '';
        
        if (bloqueado) {
          promediosPorMateria[nombreMateria] = '';
          continue;
        }

        // Si tiene restricciones Y NO tiene esta materia asignada
        if (tieneRestricciones && materiaId && !materiasAsignadas.includes(materiaId)) {
          promediosPorMateria[nombreMateria] = 'NC';
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
          
          // Ordenar actividades por fecha para obtener la última
          const actsOrdenadas = [...actsMomento].sort((a, b) => {
            const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
            const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
            return fechaB - fechaA; // Más reciente primero
          });

          for (const act of actsOrdenadas) {
            const cal = (act.calificaciones || []).find(coincideAlumno);
            if (cal && cal.tipoCalificacion === 'alfabetica' && cal.notaAlfabetica) {
              ultimaNotaAlfabetica = String(cal.notaAlfabetica || '').trim().toUpperCase();
              break; // Tomar la primera (más reciente)
            }
          }

          promediosPorMateria[nombreMateria] = ultimaNotaAlfabetica || '';
        } else {
          // Para materias numéricas, calcular promedio
          const literalToNumeric = { NP: 1, I: 1 };

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

          if (registrosPromedio.length === 0) {
            promediosPorMateria[nombreMateria] = '';
          } else {
            // Calcular promedio con la fórmula: suma(nota * porcentaje/100) + puntosExtra
            const promedioBase = registrosPromedio.reduce((sum, item) => {
              const porcentaje = item.porcentaje > 0 ? item.porcentaje : 0;
              return sum + (item.valor * (porcentaje / 100));
            }, 0);
            const puntosExtraAlumno = obtenerPuntosExtraAlumno(puntosExtraMap, alumno);
            const promedioConPuntos = Math.min(20, Math.max(0, promedioBase + puntosExtraAlumno));
            const promedioFinal = Math.min(20, Math.max(0, redondearPromedio(promedioConPuntos)));
            promediosPorMateria[nombreMateria] = promedioFinal;
          }
        }
      }

      return {
        orden: idx + 1,
        cedula,
        nombreCompleto: `${apellido} ${nombre}`.trim(),
        promediosPorMateria
      };
    });

    // Ordenar por cédula
    estudiantesConPromedios.sort((a, b) => (a.cedula || '').localeCompare(b.cedula || '', undefined, { numeric: true }));
    estudiantesConPromedios.forEach((e, i) => { e.orden = i + 1; });

    // Construir Excel
    const data = [];
    
    // Encabezado del reporte
    data.push(['REPORTE DE PROMEDIOS']);
    data.push([`Aula: ${aula.nombre || ''} - ${aula.anio}° Año Sección ${aula.seccion}`]);
    data.push([`Turno: ${aula.turno} - Período: ${aula.periodo}`]);
    data.push([`Momento ${momento}`]);
    data.push([]); // Línea vacía

    // Encabezados de columnas
    const headers = ['N°', 'Cédula', 'Apellidos y Nombres', ...materiasOrdenadas];
    data.push(headers);

    // Datos de estudiantes
    estudiantesConPromedios.forEach(est => {
      const row = [est.orden, est.cedula, est.nombreCompleto];
      materiasOrdenadas.forEach(mat => {
        const promedio = est.promediosPorMateria[mat];
        row.push(promedio === '' ? '' : promedio);
      });
      data.push(row);
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos de columna
    const cols = [
      { wch: 5 },  // N°
      { wch: 12 }, // Cédula
      { wch: 35 }, // Nombres
      ...materiasOrdenadas.map(() => ({ wch: 15 })) // Materias
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

    const nombreAula = `${aula.anio || ''}${aula.seccion || ''}`.trim() || 'Aula';
    XLSX.utils.book_append_sheet(wb, ws, `Promedios ${nombreAula} M${momento}`);

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const fecha = new Date().toISOString().split('T')[0];
    const archivo = `PROMEDIOS_${nombreAula.replace(/\\s+/g, '_')}_Momento${momento}_${fecha}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${archivo}"`
      }
    });
  } catch (error) {
    console.error('Error al generar reporte de promedios:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error al generar reporte: ${error.message}` 
    }, { status: 500 });
  }
}

