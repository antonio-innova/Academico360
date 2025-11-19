import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Estudiante from '@/database/models/Estudiante';

export async function GET(request) {
  try {
    await connectDB();

    const XLSX = await import('xlsx');
    const searchParams = request.nextUrl.searchParams;
    const aulaId = searchParams.get('aulaId');
    const momento = parseInt(searchParams.get('momento') || '1', 10);

    if (!aulaId || ![1,2,3].includes(momento)) {
      return NextResponse.json({ success: false, message: 'Parámetros inválidos (aulaId y momento requerido)' }, { status: 400 });
    }

    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      return NextResponse.json({ success: false, message: 'Aula no encontrada' }, { status: 404 });
    }

    const asignacionesAula = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];

    // Materias únicas en el orden en que están en el aula
    const materiasOrdenadas = Array.from(new Set(
      asignacionesAula
        .filter(a => a.materia && a.materia.nombre)
        .map(a => a.materia.nombre)
    ));

    // Obtener estudiantes desde la colección principal para nombres correctos
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

    // Utilitarios
    const esNoCuantitativa = (nombreMateria = '') => {
      const n = String(nombreMateria).toLowerCase();
      return ['orientación','orientacion','grupo','participación','participacion','orientación y convivencia','orientacion y convivencia'].includes(n);
    };

    const entero = (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? '' : Math.round(n).toString();
    };

    const convertirLetraANota = (letra = '') => {
      const map = {
        A: 19,
        B: 15.5,
        C: 12,
        D: 5.5,
        E: 3,
        F: 1
      };
      return map[String(letra || '').trim().toUpperCase()] ?? null;
    };

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

    // Calcular EV1..EV8 y NF por materia para el momento seleccionado
    const estudiantesConNF = (aula.alumnos || []).map((alumno, idx) => {
      const estudianteId = alumno._id?.toString() || alumno.id || '';
      let estDoc = idToInfo.get(estudianteId);
      if (!estDoc && (alumno.idU || alumno.cedula)) {
        estDoc = idUToInfo.get(String(alumno.idU || alumno.cedula));
      }
      const cedula = estDoc?.idU || alumno.idU || alumno.cedula || '';
      const apellido = (estDoc?.apellido && estDoc.apellido.trim()) || alumno.apellido || '';
      const nombre = (estDoc?.nombre && estDoc.nombre.trim()) || alumno.nombre || '';

      // Obtener las materias asignadas del estudiante
      let materiasAsignadas = [];
      let tieneRestricciones = false;
      
      // Si el estudiante no tiene materiasAsignadas definidas o tiene array vacío, asume que ve todas (compatibilidad hacia atrás)
      if (alumno.materiasAsignadas === undefined || alumno.materiasAsignadas === null || 
          (Array.isArray(alumno.materiasAsignadas) && alumno.materiasAsignadas.length === 0)) {
        // Para estudiantes antiguos sin el campo o con array vacío, todas las materias están asignadas
        materiasAsignadas = asignacionesAula.map(asig => asig.materia?.id).filter(Boolean);
        tieneRestricciones = false; // No tiene restricciones, ve todas
        console.log(`📊 Sabana - Estudiante ${nombre} ${apellido}: Sin materiasAsignadas o array vacío, todas las materias asignadas (${materiasAsignadas.length} materias)`);
      } else if (Array.isArray(alumno.materiasAsignadas) && alumno.materiasAsignadas.length > 0) {
        // Si tiene materias asignadas, usar solo esas (tiene restricciones)
        materiasAsignadas = alumno.materiasAsignadas;
        tieneRestricciones = true; // Tiene restricciones
        console.log(`📊 Sabana - Estudiante ${nombre} ${apellido}: Tiene ${materiasAsignadas.length} materias asignadas:`, materiasAsignadas);
      }

      const detallePorMateria = {};
      for (const asig of asignacionesAula) {
        const nombreMateria = asig.materia?.nombre || 'Materia';
        const materiaId = asig.materia?.id;
        const bloqueado = asig.momentosBloqueados?.[momento] === true;
        
        if (!detallePorMateria[nombreMateria]) detallePorMateria[nombreMateria] = { ev: ['', '', '', '', '', '', '', ''], nf: '' };
        
        if (bloqueado) {
          detallePorMateria[nombreMateria] = { ev: ['', '', '', '', '', '', '', ''], nf: '' };
          continue;
        }

        // Si el estudiante tiene restricciones Y NO tiene esta materia asignada, mostrar "AP"
        if (tieneRestricciones && materiaId && !materiasAsignadas.includes(materiaId)) {
          console.log(`  📝 Sabana - Materia NO asignada con "AP": ${nombreMateria} (ID: ${materiaId}) para ${nombre} ${apellido}`);
          detallePorMateria[nombreMateria] = { 
            ev: ['AP', 'AP', 'AP', 'AP', 'AP', 'AP', 'AP', 'AP'], 
            nf: 'AP' 
          };
          continue;
        }

        // Si el estudiante NO tiene restricciones O tiene la materia asignada, procesar notas normalmente
        const actividades = Array.isArray(asig.actividades) ? asig.actividades : [];
        const puntosExtraMap = buildPuntosExtraMap(asig, momento);
        const parseFecha = (f) => {
          if (!f) return 0;
          if (typeof f === 'string' && f.includes('/')) {
            const parts = f.split(/[\/\-]/).map(p => parseInt(p, 10));
            // dd/mm/yyyy
            if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
              return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
            }
          }
          const t = new Date(f).getTime();
          return isNaN(t) ? 0 : t;
        };
        const actsMomento = actividades
          .filter(a => parseInt(a.momento) === momento)
          .sort((a, b) => parseFecha(a.fecha) - parseFecha(b.fecha));

        const registrosPromedio = [];
        const ev = ['', '', '', '', '', '', '', ''];
        let evIndex = 0;

        const parseLiteralNota = (calificacion) => {
          if (!calificacion) return '';
          const candidatos = [
            calificacion.nota,
            calificacion.notaAlfabetica,
            calificacion.tipoCalificacion
          ];
          for (const valor of candidatos) {
            if (valor === undefined || valor === null) continue;
            if (typeof valor === 'string') {
              const up = valor.trim().toUpperCase();
              if (up === 'NP' || up === 'I') return up;
            }
          }
          return '';
        };

        const literalToNumeric = {
          NP: 1,
          I: 1
        };

        for (const act of actsMomento) {
          const cal = (act.calificaciones || []).find(c => (c.alumnoId?.toString?.() || String(c.alumnoId)) === estudianteId);
          const porcentaje = parseFloat(act.porcentaje) || 0;
          let literal = '';
          let valorNumerico = null;

          if (cal) {
            literal = parseLiteralNota(cal);
            if (!literal) {
              if (cal.tipoCalificacion === 'alfabetica' && cal.notaAlfabetica) {
                const convertido = convertirLetraANota(cal.notaAlfabetica);
                if (convertido !== null && !Number.isNaN(convertido)) {
                  valorNumerico = convertido;
                }
              } else if (cal.nota !== undefined && cal.nota !== null) {
                const valor = parseFloat(cal.nota);
                if (!isNaN(valor)) {
                  valorNumerico = valor;
                }
              }
            }
          }

          if (literal) {
            const valorLiteral = literalToNumeric[literal] !== undefined ? literalToNumeric[literal] : null;
            if (valorLiteral !== null) {
              registrosPromedio.push({ valor: valorLiteral, porcentaje });
            }
            if (evIndex < 8) {
              ev[evIndex] = literal;
              evIndex++;
            }
          } else if (valorNumerico !== null) {
            registrosPromedio.push({ valor: valorNumerico, porcentaje });
            if (evIndex < 8) {
              ev[evIndex] = entero(valorNumerico);
              evIndex++;
            }
          } else {
            if (evIndex < 8) {
              ev[evIndex] = '';
              evIndex++;
            }
          }
        }

        if (registrosPromedio.length === 0) {
          detallePorMateria[nombreMateria] = { ev, nf: '' };
        } else if (esNoCuantitativa(nombreMateria)) {
          const ultimo = registrosPromedio[registrosPromedio.length - 1]?.valor;
          const puntosExtraAlumno = obtenerPuntosExtraAlumno(puntosExtraMap, alumno);
          const promedioConPuntos = Math.min(20, Math.max(0, ultimo + puntosExtraAlumno));
          detallePorMateria[nombreMateria] = { ev, nf: entero(promedioConPuntos) };
        } else {
          const totalPorcentaje = registrosPromedio.reduce((sum, item) => sum + (item.porcentaje > 0 ? item.porcentaje : 0), 0);
          let promedioBase;
          if (totalPorcentaje > 0) {
            promedioBase = registrosPromedio.reduce((sum, item) => {
              const porcentaje = item.porcentaje > 0 ? item.porcentaje : 0;
              return sum + (item.valor * (porcentaje / totalPorcentaje));
            }, 0);
          } else {
            const suma = registrosPromedio.reduce((sum, item) => sum + item.valor, 0);
            promedioBase = suma / registrosPromedio.length;
          }
          const puntosExtraAlumno = obtenerPuntosExtraAlumno(puntosExtraMap, alumno);
          const promedioConPuntos = Math.min(20, Math.max(0, promedioBase + puntosExtraAlumno));
          const nfFinal = Math.min(20, Math.max(0, redondearPromedio(promedioConPuntos)));
          detallePorMateria[nombreMateria] = { ev, nf: nfFinal.toString() };
        }
      }

      return {
        orden: idx + 1,
        cedula,
        nombreCompleto: `${apellido} ${nombre}`.trim(),
        detallePorMateria
      };
    });

    // Orden por cédula
    estudiantesConNF.sort((a, b) => (a.cedula || '').localeCompare(b.cedula || '', undefined, { numeric: true }));
    estudiantesConNF.forEach((e, i) => { e.orden = i + 1; });

    // Construcción de hoja: N°, Nombre, Cédula + por materia: EV1..EV8, NF
    // Encabezado principal: N°, Nombre, (columna separadora), Cédula, luego materias
    const headerMaterias = ['N°', 'Nombre', '', 'Cédula'];
    materiasOrdenadas.forEach(mat => {
      headerMaterias.push(mat); // Nombre de materia en la primera columna de cada grupo
      for (let i = 0; i < 8; i++) headerMaterias.push(''); // Espacios para EV2-EV8
    });

    // Subencabezados: vacíos para N°, Nombre, separador, Cédula, luego EV1-EV8, NF por materia
    const subHeaderRow = ['', '', '', '']; // N°, Nombre, separador, Cédula
    materiasOrdenadas.forEach(() => {
      subHeaderRow.push('EV1','EV2','EV3','EV4','EV5','EV6','EV7','EV8','NF');
    });

    const data = [headerMaterias, subHeaderRow];

    estudiantesConNF.forEach(est => {
      const row = [est.orden, est.nombreCompleto, '', est.cedula];
      materiasOrdenadas.forEach(mat => {
        const det = est.detallePorMateria[mat] || { ev: ['', '', '', '', '', '', '', ''], nf: '' };
        row.push(...det.ev, det.nf);
      });
      data.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos optimizados para que todo quepa en una sola página: N°, Nombre, separador, Cédula, resto estrechos
    const cols = [{ wch: 4 }, { wch: 30 }, { wch: 2 }, { wch: 12 }];
    materiasOrdenadas.forEach(() => cols.push({ wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }));
    ws['!cols'] = cols;

    // Configuración de página para una sola hoja sin cortar (horizontal)
    ws['!pageSetup'] = {
      paperSize: 9, // A4
      orientation: 'landscape', // Horizontal
      fitToWidth: 1, // Ajustar a 1 página de ancho
      fitToHeight: 1, // Ajustar a 1 página de alto
      scale: 60, // Escala reducida para que quepa todo
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.2,
        bottom: 0.2,
        header: 0.1,
        footer: 0.1
      }
    };

    // Configurar vista para mostrar todo sin dividir
    ws['!sheetView'] = [{
      zoomScale: 60, // Zoom reducido para ver más contenido
      showGridLines: true,
      view: 'pageBreakPreview' // Vista de saltos de página
    }];

    // Nombre de hoja
    const nombreAula = `${aula.anio || ''}${aula.seccion || ''}`.trim() || 'Aula';
    XLSX.utils.book_append_sheet(wb, ws, `${nombreAula} ${momento}M`);

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const fecha = new Date().toISOString().split('T')[0];
    const archivo = `SABANA_${nombreAula.replace(/\s+/g,'_')}_${momento}M_${fecha}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${archivo}"`
      }
    });
  } catch (error) {
    console.error('Error al generar sábana:', error);
    return NextResponse.json({ success: false, message: `Error al generar sábana: ${error.message}` }, { status: 500 });
  }
}


