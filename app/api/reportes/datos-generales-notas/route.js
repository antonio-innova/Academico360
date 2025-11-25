import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Estudiante from '@/database/models/Estudiante';

const normalizeMateriasAsignadas = (materias) => {
  if (!materias) return [];
  const baseArray = Array.isArray(materias)
    ? materias
    : typeof materias === 'object'
      ? Object.values(materias)
      : [];
  return baseArray
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'object') {
        return String(item.id || item.codigo || item.value || item._id || '').trim();
      }
      return String(item).trim();
    })
    .filter(Boolean);
};

export async function GET(request) {
  try {
    await connectDB();

    const XLSX = await import('xlsx');
    const searchParams = request.nextUrl.searchParams;
    const aulaId = searchParams.get('aulaId');
    const momentoParam = searchParams.get('momento') || '1'; // Por defecto momento 1

    if (!aulaId) {
      return NextResponse.json({ success: false, message: 'El parámetro aulaId es requerido' }, { status: 400 });
    }

    // Validar momento
    const momentosValidos = ['1', '2', '3', 'final'];
    if (!momentosValidos.includes(momentoParam)) {
      return NextResponse.json({ success: false, message: 'Momento inválido. Debe ser 1, 2, 3 o final' }, { status: 400 });
    }

    // Obtener el aula con sus datos
    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      return NextResponse.json({ success: false, message: 'Aula no encontrada' }, { status: 404 });
    }

    const asignacionesAula = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];

    const normalizarClaveMateria = (nombre = '') =>
      nombre
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    // Construir lista de materias restringidas por alumnos (si existe)
    const materiasAsignadasSet = new Set();
    const materiasAsignadasNombreSet = new Set();
    (aula.alumnos || []).forEach((alumno) => {
      normalizeMateriasAsignadas(alumno.materiasAsignadas).forEach((materiaId) => {
        if (!materiaId) return;
        const value = materiaId.toString();
        materiasAsignadasSet.add(value);
        materiasAsignadasNombreSet.add(normalizarClaveMateria(value));
      });
    });

    const asignacionTieneProfesor = (asignacion = {}) => {
      if (asignacion.profesorId) return true;
      const profesor = asignacion.profesor || {};
      const nombre = typeof profesor.nombre === 'string' ? profesor.nombre.trim() : '';
      const apellido = typeof profesor.apellido === 'string' ? profesor.apellido.trim() : '';
      return Boolean(nombre || apellido);
    };

    const asignacionesActivas = asignacionesAula.filter((asignacion) => {
      const nombreMateria = asignacion?.materia?.nombre;
      if (!nombreMateria) return false;
      if (asignacionTieneProfesor(asignacion)) return true;

      const posiblesIds = [
        asignacion.materia?.id,
        asignacion.materia?._id,
        asignacion.materia?.codigo
      ]
        .map((id) => (id && id.toString ? id.toString() : id))
        .filter(Boolean);

      const idCoincide = posiblesIds.some((id) => materiasAsignadasSet.has(id));
      const nombreCoincide = materiasAsignadasNombreSet.has(normalizarClaveMateria(nombreMateria));
      return idCoincide || nombreCoincide;
    });

    const asignacionesParaProcesar =
      asignacionesActivas.length > 0 ? asignacionesActivas : asignacionesAula;

    // Mapear IDs/códigos de materias a su nombre para facilitar búsqueda
    const materiasOrdenAula = [];
    asignacionesParaProcesar.forEach((asignacion) => {
      const nombreMateria = asignacion?.materia?.nombre;
      if (nombreMateria) {
        materiasOrdenAula.push(nombreMateria);
      }
    });

    const materiasRestrictivasOrdenadas = [];
    if (materiasAsignadasSet.size || materiasAsignadasNombreSet.size) {
      asignacionesParaProcesar.forEach((asignacion) => {
        const nombreMateria = asignacion?.materia?.nombre;
        if (!nombreMateria) return;
        const posiblesIds = [
          asignacion.materia?.id,
          asignacion.materia?._id,
          asignacion.materia?.codigo
        ]
          .map((id) => (id && id.toString ? id.toString() : id))
          .filter(Boolean);

        const nombreNormalizado = normalizarClaveMateria(nombreMateria);

        const coincide =
          posiblesIds.some((id) => materiasAsignadasSet.has(id)) ||
          materiasAsignadasNombreSet.has(nombreNormalizado);

        if (coincide) {
          materiasRestrictivasOrdenadas.push(nombreMateria);
        }
      });
    }

    // Obtener materias únicas en orden considerando restricciones
    const materiasOrdenadas = materiasRestrictivasOrdenadas.length
      ? Array.from(new Set(materiasRestrictivasOrdenadas))
      : Array.from(new Set(materiasOrdenAula));

    // Obtener estudiantes desde la colección principal
    const estudiantesIds = (aula.alumnos || []).map(al => al._id?.toString()).filter(Boolean);
    const cedulasLista = (aula.alumnos || []).map(al => al.idU || al.cedula).filter(Boolean);
    const estudiantesDocs = await Estudiante.find({
      $or: [
        { _id: { $in: estudiantesIds } },
        { idU: { $in: cedulasLista } }
      ]
    }).lean();

    const idToInfo = new Map(estudiantesDocs.map(e => [e._id.toString(), e]));
    const idUToInfo = new Map(estudiantesDocs.map(e => [(e.idU || '').toString(), e]));

    const normalizarTexto = (texto = '') => {
      return texto
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const CODIGOS_EF = {
      amazonas: 'AM',
      anzoategui: 'AN',
      apure: 'AP',
      aragua: 'AR',
      barinas: 'BA',
      bolivar: 'BO',
      carabobo: 'CA',
      cojedes: 'CO',
      deltaamacuro: 'DA',
      deltamacuro: 'DA',
      deltadelamacuro: 'DA',
      'delta amacuro': 'DA',
      'delta del amacuro': 'DA',
      'delta deltas': 'DA', // fallback improbable
      'distrito capital': 'DC',
      distrito: 'DC',
      falcon: 'FA',
      guarico: 'GU',
      'la guaira': 'LG',
      laguaira: 'LG',
      vargas: 'LG',
      lara: 'LA',
      merida: 'ME',
      miranda: 'MI',
      monagas: 'MO',
      nuevaesparta: 'NE',
      'nueva esparta': 'NE',
      portuguesa: 'PO',
      sucre: 'SU',
      tachira: 'TA',
      trujillo: 'TR',
      yaracuy: 'YA',
      zulia: 'ZU',
      esequibo: 'ES',
      'guayana esequiba': 'ES',
      'dependencias federales': 'DF',
      bolivariano: 'DC' // fallback
    };

    const obtenerCodigoEF = (lugar) => {
      if (!lugar) return '';
      const normalizado = normalizarTexto(lugar).replace(/\s+/g, ' ');
      if (CODIGOS_EF[normalizado]) return CODIGOS_EF[normalizado];

      const sinEspacios = normalizado.replace(/\s+/g, '');
      if (CODIGOS_EF[sinEspacios]) return CODIGOS_EF[sinEspacios];

      // Manejar prefijos como "estado"
      if (normalizado.startsWith('estado ')) {
        const base = normalizado.replace('estado ', '');
        if (CODIGOS_EF[base]) return CODIGOS_EF[base];
        const baseSinEspacios = base.replace(/\s+/g, '');
        if (CODIGOS_EF[baseSinEspacios]) return CODIGOS_EF[baseSinEspacios];
      }
      return '';
    };

    // Función para convertir letra a nota
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

    // Función para verificar si es materia no cuantitativa
    const esNoCuantitativa = (nombreMateria = '') => {
      const n = String(nombreMateria).toLowerCase();
      return ['orientación','orientacion','grupo','participación','participacion','orientación y convivencia','orientacion y convivencia'].includes(n);
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

    // Función para calcular nota final de un momento para una materia
    const calcularNotaFinalMomento = (asignacion, estudianteId, momento, alumno) => {
      const actividades = Array.isArray(asignacion.actividades) ? asignacion.actividades : [];
      const puntosExtraMap = buildPuntosExtraMap(asignacion, momento);
      
      const actsMomento = actividades.filter(a => parseInt(a.momento) === momento);
      const registrosPromedio = [];

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
        } else if (valorNumerico !== null) {
          registrosPromedio.push({ valor: valorNumerico, porcentaje });
        }
      }

      if (registrosPromedio.length === 0) {
        return '';
      } else if (esNoCuantitativa(asignacion.materia?.nombre)) {
        const ultimo = registrosPromedio[registrosPromedio.length - 1]?.valor;
        const puntosExtraAlumno = obtenerPuntosExtraAlumno(puntosExtraMap, alumno);
        const promedioConPuntos = Math.min(20, Math.max(0, ultimo + puntosExtraAlumno));
        return Math.round(promedioConPuntos);
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
        return nfFinal;
      }
    };

    // Procesar cada estudiante
    const datosEstudiantes = (aula.alumnos || []).map((alumno) => {
      const estudianteId = alumno._id?.toString() || alumno.id || '';
      let estDoc = idToInfo.get(estudianteId);
      if (!estDoc && (alumno.idU || alumno.cedula)) {
        estDoc = idUToInfo.get(String(alumno.idU || alumno.cedula));
      }

      // Datos básicos del estudiante
      const cedula = estDoc?.idU || alumno.idU || alumno.cedula || '';
      const apellido = (estDoc?.apellido && estDoc.apellido.trim()) || alumno.apellido || '';
      const nombre = (estDoc?.nombre && estDoc.nombre.trim()) || alumno.nombre || '';
      const lugarNacimiento = estDoc?.lugarNacimiento || '';
      const ef = obtenerCodigoEF(lugarNacimiento) || estDoc?.ef || '';
      const sexo = estDoc?.sexo || '';
      
      // Fecha de nacimiento separada
      const fechaNacimiento = estDoc?.fechaNacimiento ? new Date(estDoc.fechaNacimiento) : null;
      const dia = fechaNacimiento ? fechaNacimiento.getDate() : '';
      const mes = fechaNacimiento ? fechaNacimiento.getMonth() + 1 : '';
      const anio = fechaNacimiento ? fechaNacimiento.getFullYear() : '';

      // Obtener las materias asignadas del estudiante
      let materiasAsignadas = [];
      let tieneRestricciones = false;
      
      if (alumno.materiasAsignadas === undefined || alumno.materiasAsignadas === null || 
          (Array.isArray(alumno.materiasAsignadas) && alumno.materiasAsignadas.length === 0)) {
        materiasAsignadas = asignacionesParaProcesar.map(asig => asig.materia?.id).filter(Boolean);
        tieneRestricciones = false;
      } else if (Array.isArray(alumno.materiasAsignadas) && alumno.materiasAsignadas.length > 0) {
        materiasAsignadas = alumno.materiasAsignadas;
        tieneRestricciones = true;
      }

      // Calcular notas por materia según el momento seleccionado
      const notasPorMateria = {};
      
      for (const asig of asignacionesParaProcesar) {
        const nombreMateria = asig.materia?.nombre || 'Materia';
        const materiaId = asig.materia?.id;
        
        // Si el estudiante tiene restricciones y no tiene esta materia asignada, mostrar "NC"
        if (tieneRestricciones && materiaId && !materiasAsignadas.includes(materiaId)) {
          if (momentoParam === 'final') {
            notasPorMateria[nombreMateria] = { definitiva: 'NC' };
          } else {
            notasPorMateria[nombreMateria] = { nota: 'NC' };
          }
          continue;
        }

        if (momentoParam === 'final') {
          // Mostrar solo la definitiva calculada como promedio de los 3 momentos
          const bloqueado1 = asig.momentosBloqueados?.[1] === true;
          const bloqueado2 = asig.momentosBloqueados?.[2] === true;
          const bloqueado3 = asig.momentosBloqueados?.[3] === true;
          
          const nota1 = bloqueado1 ? '' : calcularNotaFinalMomento(asig, estudianteId, 1, alumno);
          const nota2 = bloqueado2 ? '' : calcularNotaFinalMomento(asig, estudianteId, 2, alumno);
          const nota3 = bloqueado3 ? '' : calcularNotaFinalMomento(asig, estudianteId, 3, alumno);

          const valorPromedio = (nota) => {
            if (nota === '' || nota === null || nota === undefined) return 1;
            if (nota === 'NC') return 1;
            const numero = typeof nota === 'number' ? nota : parseFloat(nota);
            return Number.isFinite(numero) ? numero : 1;
          };

          const valores = [valorPromedio(nota1), valorPromedio(nota2), valorPromedio(nota3)];
          const definitiva = Math.round((valores[0] + valores[1] + valores[2]) / 3);

          notasPorMateria[nombreMateria] = { definitiva };
        } else {
          // Mostrar solo el momento seleccionado
          const momentoNum = parseInt(momentoParam);
          const bloqueado = asig.momentosBloqueados?.[momentoNum] === true;
          const nota = bloqueado ? '' : calcularNotaFinalMomento(asig, estudianteId, momentoNum, alumno);
          
          notasPorMateria[nombreMateria] = { nota: nota === '' ? '' : nota };
        }
      }

      return {
        cedula,
        apellido,
        nombre,
        lugarNacimiento,
        ef,
        sexo,
        dia,
        mes,
        anio,
        notasPorMateria
      };
    });

    // Ordenar por cédula
    datosEstudiantes.sort((a, b) => (a.cedula || '').localeCompare(b.cedula || '', undefined, { numeric: true }));

    // Construir hoja de Excel
    const headers = [
      'Cédula',
      'Apellido',
      'Nombre',
      'Lugar de Nacimiento',
      'EF',
      'Sexo',
      'Día',
      'Mes',
      'Año'
    ];

    // Agregar columnas para cada materia según el momento seleccionado
    if (momentoParam === 'final') {
      materiasOrdenadas.forEach(materia => {
        headers.push(`${materia} - DEF`);
      });
    } else {
      const momentoLabel = momentoParam === '1' ? '1M' : momentoParam === '2' ? '2M' : '3M';
      materiasOrdenadas.forEach(materia => {
        headers.push(`${materia} - ${momentoLabel}`);
      });
    }

    const data = [headers];

    // Agregar filas de estudiantes
    datosEstudiantes.forEach(est => {
      const row = [
        est.cedula,
        est.apellido,
        est.nombre,
        est.lugarNacimiento,
        est.ef,
        est.sexo,
        est.dia,
        est.mes,
        est.anio
      ];

      materiasOrdenadas.forEach(materia => {
        if (momentoParam === 'final') {
          const notas = est.notasPorMateria[materia] || { definitiva: '' };
          row.push(notas.definitiva);
        } else {
          const notas = est.notasPorMateria[materia] || { nota: '' };
          row.push(notas.nota);
        }
      });

      data.push(row);
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar anchos de columna
    const cols = [
      { wch: 12 }, // Cédula
      { wch: 20 }, // Apellido
      { wch: 20 }, // Nombre
      { wch: 25 }, // Lugar de Nacimiento
      { wch: 5 },  // EF
      { wch: 6 },  // Sexo
      { wch: 5 },  // Día
      { wch: 5 },  // Mes
      { wch: 6 }   // Año
    ];

    // Agregar anchos para columnas de materias según el momento
    if (momentoParam === 'final') {
      materiasOrdenadas.forEach(() => {
        cols.push({ wch: 8 }); // DEF
      });
    } else {
      materiasOrdenadas.forEach(() => {
        cols.push({ wch: 8 }); // Nota del momento seleccionado
      });
    }

    ws['!cols'] = cols;

    // Configuración de página
    ws['!pageSetup'] = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.2,
        bottom: 0.2,
        header: 0.1,
        footer: 0.1
      }
    };

    // Nombre de hoja
    const nombreAula = `${aula.anio || ''}${aula.seccion || ''}`.trim() || 'Aula';
    XLSX.utils.book_append_sheet(wb, ws, 'Datos Generales con Notas');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const fecha = new Date().toISOString().split('T')[0];
    const momentoLabel = momentoParam === 'final' ? 'Definitiva' : `${momentoParam}M`;
    const archivo = `Datos_Generales_Notas_${nombreAula.replace(/\s+/g,'_')}_${momentoLabel}_${fecha}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${archivo}"`
      }
    });
  } catch (error) {
    console.error('Error al generar reporte de datos generales con notas:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error al generar reporte: ${error.message}` 
    }, { status: 500 });
  }
}

