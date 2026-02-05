import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Estudiante from '@/database/models/Estudiante';

// Función para ordenar materias asegurando que Biología aparezca después de Educación Física
const ordenarMaterias = (items) => {
  if (!Array.isArray(items) || items.length === 0) return items;
  
  const normalizar = (texto) => {
    if (!texto) return '';
    return String(texto).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  
  // Función para obtener el nombre de la materia
  const obtenerNombreMateria = (item) => {
    // Si es un objeto con propiedad materia
    if (item && typeof item === 'object' && item.materia) {
      return item.materia.nombre || '';
    }
    // Si es un string directamente
    if (typeof item === 'string') {
      return item;
    }
    return '';
  };
  
  // Crear copia del array para no modificar el original
  const itemsOrdenados = [...items];
  
  // Encontrar índices de Educación Física y Biología
  let indiceEF = -1;
  let indiceBiologia = -1;
  
  itemsOrdenados.forEach((item, index) => {
    const nombreMateria = obtenerNombreMateria(item);
    const nombreNormalizado = normalizar(nombreMateria);
    if (nombreNormalizado.includes('educacion') && nombreNormalizado.includes('fisica')) {
      indiceEF = index;
    }
    if (nombreNormalizado.includes('biologia') || nombreNormalizado.includes('biología')) {
      indiceBiologia = index;
    }
  });
  
  // Si ambas existen, asegurar que Biología esté inmediatamente después de Educación Física
  if (indiceEF !== -1 && indiceBiologia !== -1) {
    // Si Biología no está inmediatamente después de Educación Física, reorganizar
    if (indiceBiologia !== indiceEF + 1) {
      // Remover Biología de su posición actual
      const biologia = itemsOrdenados.splice(indiceBiologia, 1)[0];
      // Ajustar índice de EF si Biología estaba antes de EF
      if (indiceBiologia < indiceEF) {
        indiceEF--;
      }
      // Insertar Biología inmediatamente después de Educación Física
      itemsOrdenados.splice(indiceEF + 1, 0, biologia);
    }
  }
  
  return itemsOrdenados;
};

export async function GET(request) {
  try {
    await connectDB();

    const XLSX = await import('xlsx');
    const searchParams = request.nextUrl.searchParams;
    const aulaId = searchParams.get('aulaId');
    const momento = parseInt(searchParams.get('momento') || '1', 10);

    if (!aulaId || ![1,2,3,4].includes(momento)) {
      return NextResponse.json({ success: false, message: 'Parámetros inválidos (aulaId y momento 1-4 requerido)' }, { status: 400 });
    }

    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      return NextResponse.json({ success: false, message: 'Aula no encontrada' }, { status: 404 });
    }

    const asignacionesAula = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];

    // Ordenar asignaciones (Biología después de Educación Física)
    const asignacionesOrdenadas = ordenarMaterias(asignacionesAula);

    // Materias únicas en el orden en que están en el aula (ya ordenadas)
    const materiasOrdenadas = Array.from(new Set(
      asignacionesOrdenadas
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
      for (const asig of asignacionesOrdenadas) {
        const nombreMateria = asig.materia?.nombre || 'Materia';
        const materiaId = asig.materia?.id;
        const bloqueado = asig.momentosBloqueados?.[momento] === true;
        
        if (!detallePorMateria[nombreMateria]) {
          detallePorMateria[nombreMateria] = { 
            ev: ['', '', '', '', '', '', '', ''], 
            porcentajes: ['', '', '', '', '', '', '', ''],
            resultados: ['', '', '', '', '', '', '', ''],
            nf: '',
            sumaTotal: ''
          };
        }
        
        if (bloqueado) {
          detallePorMateria[nombreMateria] = { 
            ev: ['', '', '', '', '', '', '', ''], 
            porcentajes: ['', '', '', '', '', '', '', ''],
            resultados: ['', '', '', '', '', '', '', ''],
            nf: '',
            sumaTotal: ''
          };
          continue;
        }

        // Si el estudiante tiene restricciones Y NO tiene esta materia asignada, mostrar "NC"
        if (tieneRestricciones && materiaId && !materiasAsignadas.includes(materiaId)) {
          console.log(`  📝 Sabana - Materia NO asignada con "NC": ${nombreMateria} (ID: ${materiaId}) para ${nombre} ${apellido}`);
          detallePorMateria[nombreMateria] = { 
            ev: ['NC', 'NC', 'NC', 'NC', 'NC', 'NC', 'NC', 'NC'], 
            porcentajes: ['', '', '', '', '', '', '', ''],
            resultados: ['', '', '', '', '', '', '', ''],
            nf: 'NC',
            sumaTotal: ''
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
        const porcentajes = ['', '', '', '', '', '', '', ''];
        const resultados = ['', '', '', '', '', '', '', ''];
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

        const normalizarCedula = (valor = '') => {
          const soloDigitos = String(valor || '').replace(/\D/g, '');
          if (!soloDigitos) return '';
          const sinCeros = soloDigitos.replace(/^0+/, '');
          return sinCeros || '0';
        };

        const posiblesIdsAlumno = [
          estudianteId,
          alumno.id && alumno.id.toString(),
          alumno.idU && alumno.idU.toString(),
          alumno.cedula && alumno.cedula.toString()
        ].filter(Boolean);

        const posiblesIdsNormalizados = posiblesIdsAlumno
          .map(normalizarCedula)
          .filter(Boolean);

        const coincideAlumno = (cal) => {
          const val = cal?.alumnoId;
          const str = val?.toString ? val.toString() : String(val);
          if (posiblesIdsAlumno.includes(str)) return true;
          const norm = normalizarCedula(str);
          return norm && posiblesIdsNormalizados.includes(norm);
        };

        for (const act of actsMomento) {
          const cal = (act.calificaciones || []).find(coincideAlumno);
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
              porcentajes[evIndex] = porcentaje > 0 ? `${porcentaje}%` : '';
              resultados[evIndex] = valorLiteral !== null ? (valorLiteral * (porcentaje / 100)).toFixed(2) : '';
              evIndex++;
            }
          } else if (valorNumerico !== null) {
            registrosPromedio.push({ valor: valorNumerico, porcentaje });
            if (evIndex < 8) {
              ev[evIndex] = entero(valorNumerico);
              porcentajes[evIndex] = porcentaje > 0 ? `${porcentaje}%` : '';
              resultados[evIndex] = (valorNumerico * (porcentaje / 100)).toFixed(2);
              evIndex++;
            }
          } else {
            if (evIndex < 8) {
              ev[evIndex] = '';
              porcentajes[evIndex] = porcentaje > 0 ? `${porcentaje}%` : '';
              resultados[evIndex] = '';
              evIndex++;
            }
          }
        }


        
        if (registrosPromedio.length === 0) {
          detallePorMateria[nombreMateria] = { 
            ev, 
            porcentajes, 
            resultados, 
            nf: '', 
            sumaTotal: '' 
          };
        } else {
          // TODAS las materias usan la misma fórmula: suma directa de nota * porcentaje/100
          const promedioBase = registrosPromedio.reduce((sum, item) => {
              const porcentaje = item.porcentaje > 0 ? item.porcentaje : 0;
            return sum + (item.valor * (porcentaje / 100));
            }, 0);
          const puntosExtraAlumno = obtenerPuntosExtraAlumno(puntosExtraMap, alumno);
          const promedioConPuntos = Math.min(20, Math.max(0, promedioBase + puntosExtraAlumno));
          const nfFinal = Math.min(20, Math.max(0, redondearPromedio(promedioConPuntos)));
          
          // Calcular suma total de los resultados
          const sumaResultados = resultados
            .filter(r => r !== '')
            .reduce((sum, r) => sum + parseFloat(r), 0);
          
          detallePorMateria[nombreMateria] = { 
            ev, 
            porcentajes, 
            resultados, 
            nf: nfFinal.toString(),
            sumaTotal: sumaResultados.toFixed(2)
          };
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

    // Construcción de hoja: N°, Nombre, Cédula + por materia: EV1..EV8 con porcentajes y resultados, NF, Suma
    // Encabezado principal: N°, Nombre, (columna separadora), Cédula, luego materias
    const headerMaterias = ['N°', 'Nombre', '', 'Cédula'];
    materiasOrdenadas.forEach(mat => {
      headerMaterias.push(mat); // Nombre de materia en la primera columna de cada grupo
      // Espacios para: EV1, %EV1, RES1, EV2, %EV2, RES2, ..., EV8, %EV8, RES8, NF, SUMA
      for (let i = 0; i < 26; i++) headerMaterias.push(''); // 8*3 + 2 = 26 columnas adicionales
    });

    // Subencabezados: vacíos para N°, Nombre, separador, Cédula, luego estructura detallada por materia
    const subHeaderRow = ['', '', '', '']; // N°, Nombre, separador, Cédula
    materiasOrdenadas.forEach(() => {
      // Por cada materia: EV1, %EV1, RES1, EV2, %EV2, RES2, ..., EV8, %EV8, RES8, NF, SUMA
      for (let i = 1; i <= 8; i++) {
        subHeaderRow.push(`EV${i}`, `%${i}`, `R${i}`);
      }
      subHeaderRow.push('NF', 'SUMA');
    });

    const data = [headerMaterias, subHeaderRow];

    estudiantesConNF.forEach(est => {
      const row = [est.orden, est.nombreCompleto, '', est.cedula];
      materiasOrdenadas.forEach(mat => {
        const det = est.detallePorMateria[mat] || { 
          ev: ['', '', '', '', '', '', '', ''], 
          porcentajes: ['', '', '', '', '', '', '', ''],
          resultados: ['', '', '', '', '', '', '', ''],
          nf: '',
          sumaTotal: ''
        };
        
        // Por cada evaluación: EV, %, Resultado
        for (let i = 0; i < 8; i++) {
          row.push(det.ev[i] || '', det.porcentajes[i] || '', det.resultados[i] || '');
        }
        
        // NF y Suma Total
        row.push(det.nf || '', det.sumaTotal || '');
      });
      data.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos optimizados: N°, Nombre, separador, Cédula, luego por materia: EV, %, RES (x8), NF, SUMA
    const cols = [{ wch: 4 }, { wch: 30 }, { wch: 2 }, { wch: 12 }];
    materiasOrdenadas.forEach(() => {
      // Por cada materia: 8 grupos de (EV, %, RES) + NF + SUMA = 27 columnas
      for (let i = 0; i < 8; i++) {
        cols.push(
          { wch: 4 },  // EV
          { wch: 5 },  // %
          { wch: 6 }   // Resultado
        );
      }
      cols.push({ wch: 4 }, { wch: 6 }); // NF, SUMA
    });
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


