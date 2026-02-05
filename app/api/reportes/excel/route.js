
import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Estudiante from '@/database/models/Estudiante';
import Asignacion from '@/database/models/Asignacion';
import Aula from '@/database/models/Aula';
import Materia from '@/database/models/Materia';
import Profesor from '@/database/models/Profesor';
import path from 'path';
import fs from 'fs';

// Función para generar reportes Excel
export async function GET(request) {
  try {
    await connectDB();
    
    // Importar xlsx de manera dinámica
    const XLSX = await import('xlsx');
    
    // Obtener parámetros de la consulta
    const searchParams = request.nextUrl.searchParams;
    const tipoReporte = searchParams.get('tipoReporte');
    const anio = searchParams.get('anio');
    const seccion = searchParams.get('seccion');
    const aulaId = searchParams.get('aulaId') || searchParams.get('aulald'); // Manejar ambos parámetros
    const momento = searchParams.get('momento');
    
    // Verificar que se ha proporcionado un tipo de reporte
    if (!tipoReporte) {
      return new Response(JSON.stringify({ error: 'Tipo de reporte no especificado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Validar tipo de reporte
    if (!tipoReporte) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tipo de reporte no especificado' 
      }, { status: 400 });
    }
    
    // Obtener datos según el tipo de reporte
    let estudiantes = [];
    let nombreArchivo = '';
    
    switch (tipoReporte) {
      case 'docentes':
        // Obtener todos los docentes
        const docentes = await Profesor.find().lean();
        
        // Crear un libro de Excel
        const workbook = XLSX.utils.book_new();
        
        // Preparar los datos para el Excel
        const docentesData = docentes.map((docente, index) => ({
          '#': index + 1,
          'Cédula': docente.idU || 'N/D',
          'Nombre': docente.nombre || 'N/D',
          'Apellido': docente.apellido || 'N/D',
          'Email': docente.email || 'N/D',
          'Teléfono': docente.telefono || 'N/D',
          'Especialidad': docente.especialidad || 'N/D',
          'Estado': docente.activo ? 'Activo' : 'Inactivo',
          'Fecha de Ingreso': docente.fechaIngreso ? new Date(docente.fechaIngreso).toLocaleDateString() : 'N/D'
        }));
        
        // Crear hoja de cálculo
        const worksheet = XLSX.utils.json_to_sheet(docentesData);
        
        // Ajustar ancho de columnas
        const docentesColWidths = [
          { wch: 5 },  // #
          { wch: 15 }, // Cédula
          { wch: 20 }, // Nombre
          { wch: 20 }, // Apellido
          { wch: 30 }, // Email
          { wch: 15 }, // Teléfono
          { wch: 20 }, // Especialidad
          { wch: 10 }, // Estado
          { wch: 15 }  // Fecha de Ingreso
        ];
        worksheet['!cols'] = docentesColWidths;
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Docentes');
        
        // Generar archivo Excel
        const docentesExcelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        
        // Configurar nombre del archivo
        nombreArchivo = `Reporte_Docentes_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Devolver el archivo Excel como respuesta
        return new Response(docentesExcelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${nombreArchivo}"`
          }
        });
        
      case 'notasPorAula':
        if (!aulaId) {
          return NextResponse.json({ 
            success: false, 
            message: 'ID de aula no especificado' 
          }, { status: 400 });
        }
        
        // Obtener información del aula con sus asignaciones (ya contiene alumnos y actividades)
        const aula = await Aula.findById(aulaId).lean();
        if (!aula) {
          return NextResponse.json({ 
            success: false, 
            message: 'Aula no encontrada' 
          }, { status: 404 });
        }
        
        const asignacionesAula = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];

        // Mapa de materias para orden fijo
        const materiasUnicasOrdenadas = asignacionesAula
          .filter(a => a.materia && a.materia.nombre)
          .map(a => a.materia.nombre);
        const materiasHeaders = Array.from(new Set(materiasUnicasOrdenadas));

        // Traer estudiantes por múltiples llaves: _id embebido (si coincide) y cédula/idU
        const estudiantesIds = (aula.alumnos || []).map(al => al._id?.toString()).filter(Boolean);
        const cedulasLista = (aula.alumnos || []).map(al => al.idU || al.cedula).filter(Boolean);
        const estudiantesDocs = await Estudiante.find({
          $or: [
            { _id: { $in: estudiantesIds } },
            { idU: { $in: cedulasLista } }
          ]
        })
          .select('_id idU nombre apellido')
          .lean();
        const idToInfo = new Map(
          estudiantesDocs.map(e => [e._id.toString(), e])
        );
        const cedulaToInfo = new Map(
          estudiantesDocs.map(e => [(e.idU || '').toString(), e])
        );

        // Función utilitaria
        const esNoCuantitativa = (nombreMateria = '') => {
          const n = String(nombreMateria).toLowerCase();
          return ['orientación','orientacion','grupo','participación','participacion'].includes(n);
        };

        // Calcular notas por estudiante, por materia y por momento
        const estudiantesConNotas = (aula.alumnos || []).map((alumno, index) => {
          const estudianteId = alumno._id?.toString() || alumno.id || '';
          let estDoc = idToInfo.get(estudianteId);
          if (!estDoc && (alumno.idU || alumno.cedula)) {
            estDoc = cedulaToInfo.get(String(alumno.idU || alumno.cedula));
          }
          // Priorizar datos del Estudiante si existen, sino usar los del aula
          const cedula = estDoc?.idU || alumno.idU || alumno.cedula || 'N/D';
          const apellidoFinal = (estDoc?.apellido && estDoc.apellido.trim()) || alumno.apellido || '';
          const nombreFinal = (estDoc?.nombre && estDoc.nombre.trim()) || alumno.nombre || '';

          const materiaToMomentos = {};

          for (const asig of asignacionesAula) {
            const nombreMateria = asig.materia?.nombre || 'Materia';

            const actividades = Array.isArray(asig.actividades) ? asig.actividades : [];

            // Agrupar notas por momento (incluye 4 para aulas de nota pendiente)
            const momentos = { 1: [], 2: [], 3: [], 4: [] };
            for (const act of actividades) {
              const m = parseInt(act.momento);
              if (![1,2,3,4].includes(m)) continue;
              if (!Array.isArray(act.calificaciones)) continue;
              const cal = act.calificaciones.find(c => (c.alumnoId?.toString?.() || String(c.alumnoId)) === estudianteId);
              if (!cal) continue;
              const valor = cal.nota;
              momentos[m].push(valor);
            }

            // Reducir a promedio por momento
            const calcularProm = (arr, noCuant) => {
              if (arr.length === 0) return 'N/P';
              if (noCuant) {
                // Para no cuantitativas, tomar el último valor pero redondear si es numérico
                const ultimoValor = arr[arr.length - 1];
                const num = parseFloat(ultimoValor);
                if (!isNaN(num)) {
                  return Math.round(num).toString();
                }
                return ultimoValor;
              }
              const nums = arr
                .map(v => parseFloat(v))
                .filter(v => !isNaN(v));
              if (nums.length === 0) return 'N/P';
              const suma = nums.reduce((a,b) => a + b, 0);
              return Math.round(suma / nums.length).toString();
            };

            const noCuant = esNoCuantitativa(nombreMateria);
            const m1 = calcularProm(momentos[1], noCuant);
            const m2 = calcularProm(momentos[2], noCuant);
            const m3 = calcularProm(momentos[3], noCuant);
            const m4 = calcularProm(momentos[4], noCuant);

            // Final: promedio de M1..M3 o M1..M4 según aula pendiente
            const esAulaPendiente = aula?.esPendiente === true;
            let final = 'N/P';
            if (noCuant) {
              const candidatos = esAulaPendiente ? [m4, m3, m2, m1] : [m3, m2, m1];
              const vals = candidatos.filter(v => v !== 'N/P');
              final = vals.length ? vals[0] : 'N/P';
            } else {
              const numsBase = [m1, m2, m3];
              if (esAulaPendiente) numsBase.push(m4);
              const nums = numsBase
                .map(v => parseFloat(v))
                .filter(v => !isNaN(v));
              if (nums.length) {
                const suma = nums.reduce((a,b) => a + b, 0);
                final = Math.round(suma / nums.length).toString();
              }
            }

            materiaToMomentos[nombreMateria] = { m1, m2, m3, m4, final };
          }

          return {
            orden: index + 1,
            id: estudianteId,
            cedula,
            apellido: apellidoFinal,
            nombre: nombreFinal,
            materiaToMomentos
          };
          });
        
        // Ordenar por cédula ascendente
        estudiantesConNotas.sort((a, b) => {
          const A = a.cedula || '';
          const B = b.cedula || '';
          return A.localeCompare(B, undefined, { numeric: true });
        });
        // Reenumerar '#' para que sea secuencial tras ordenar por cédula
        estudiantesConNotas.forEach((e, idx) => { e.orden = idx + 1; });

        // Construir hoja Excel según el momento solicitado:
        // - '1' | '2' | '3' => solo ese momento
        // - 'final' => solo Final
        // - defecto => M1, M2, M3 y Final
        const momentoSeleccion = (momento || '').toString().toLowerCase();

        const headers = ['#', 'Cédula', 'Apellido', 'Nombre'];
        const columnasMateriaExpandidas = [];
        materiasHeaders.forEach(mat => {
          if (momentoSeleccion === '1') {
            columnasMateriaExpandidas.push(`${mat} M1`);
          } else if (momentoSeleccion === '2') {
            columnasMateriaExpandidas.push(`${mat} M1`, `${mat} M2`);
          } else if (momentoSeleccion === '3') {
            columnasMateriaExpandidas.push(`${mat} M3`);
          } else if (momentoSeleccion === '4') {
            columnasMateriaExpandidas.push(`${mat} M4`);
          } else if (momentoSeleccion === 'final') {
            columnasMateriaExpandidas.push(`${mat} Final`);
          } else {
            columnasMateriaExpandidas.push(`${mat} M1`, `${mat} M2`, `${mat} M3`, `${mat} Final`);
          }
        });
        headers.push(...columnasMateriaExpandidas);

        const rows = [headers];
        // Helper para formatear números a enteros, preservando 'N/P' y valores no numéricos
        const formatearNota = (valor) => {
          if (!valor || valor === 'N/P' || (typeof valor === 'string' && valor.trim() === 'N/P')) {
            return 'N/P';
          }
          const num = parseFloat(valor);
          if (!isNaN(num) && isFinite(num)) {
            return Math.round(num).toString();
          }
          return valor;
        };

        estudiantesConNotas.forEach(est => {
          const base = [est.orden, est.cedula, est.apellido, est.nombre];
          materiasHeaders.forEach(mat => {
            const mm = est.materiaToMomentos[mat] || { m1: 'N/P', m2: 'N/P', m3: 'N/P', m4: 'N/P', final: 'N/P' };
            if (momentoSeleccion === '1') {
              base.push(formatearNota(mm.m1));
            } else if (momentoSeleccion === '2') {
              base.push(formatearNota(mm.m1), formatearNota(mm.m2));
            } else if (momentoSeleccion === '3') {
              base.push(formatearNota(mm.m3));
            } else if (momentoSeleccion === '4') {
              base.push(formatearNota(mm.m4));
            } else if (momentoSeleccion === 'final') {
              base.push(formatearNota(mm.final));
            } else {
              base.push(
                formatearNota(mm.m1),
                formatearNota(mm.m2),
                formatearNota(mm.m3),
                formatearNota(mm.final)
              );
            }
          });
          rows.push(base);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        
        // Anchos de columnas
        const cols = [
          { wch: 5 },
          { wch: 15 },
          { wch: 20 },
          { wch: 20 },
        ];
        materiasHeaders.forEach(() => {
          if (momentoSeleccion === '1') {
            cols.push({ wch: 8 });
          } else if (momentoSeleccion === '2') {
            cols.push({ wch: 8 }, { wch: 8 });
          } else if (momentoSeleccion === '3' || momentoSeleccion === '4' || momentoSeleccion === 'final') {
            cols.push({ wch: 10 });
          } else {
            cols.push({ wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 });
          }
        });
        ws['!cols'] = cols;

        const nombreAula = `${aula.anio || ''}${aula.seccion || ''}`.trim() || 'Aula';
        const sufijo = ['1','2','3','4','final'].includes(momentoSeleccion)
          ? `_${momentoSeleccion.toUpperCase()}`
          : '_M1_M2_M3_Final';
        XLSX.utils.book_append_sheet(wb, ws, `Notas ${nombreAula}${sufijo}`);

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        const fecha = new Date().toISOString().split('T')[0];
        const archivo = `Notas_${nombreAula.replace(/\s+/g,'_')}${sufijo}_${fecha}.xlsx`;

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${archivo}"`
          }
        });
        
      case 'todosEstudiantes':
        // Reporte de todos los estudiantes
        console.log('Generando reporte de todos los estudiantes');
        
        // Filtrar por año y sección si se especifican
        let query = {};
        
        if (anio || seccion) {
          console.log(`Filtrando estudiantes por año: ${anio || 'todos'} y sección: ${seccion || 'todas'}`);
          
          // Construir filtro directo para estudiantes
          if (anio) {
            query.anio = anio;
            console.log(`Filtrando por año: ${anio}`);
          }
          
          if (seccion) {
            query.seccion = seccion;
            console.log(`Filtrando por sección: ${seccion}`);
          }
        }
        
        // Obtener todos los estudiantes según el filtro
        estudiantes = await Estudiante.find(query).lean();
        
        // Ordenar por cédula de forma ascendente
        estudiantes.sort((a, b) => {
          const cedulaA = a.cedula || a.idU || '';
          const cedulaB = b.cedula || b.idU || '';
          return cedulaA.localeCompare(cedulaB, undefined, { numeric: true });
        });
        console.log(`Encontrados ${estudiantes.length} estudiantes con filtros:`, query);
        
        // Obtener todas las asignaciones para estos estudiantes
        const estudiantesIdsArray = estudiantes.map(e => e._id);
        const asignaciones = await Asignacion.find({
          alumnos: { $in: estudiantesIdsArray }
        }).lean();
        
        console.log(`Encontradas ${asignaciones.length} asignaciones para los estudiantes`);
        
        // Agregar las asignaciones a cada estudiante
        estudiantes = estudiantes.map(estudiante => {
          const estudianteId = estudiante._id ? estudiante._id.toString() : estudiante.id || estudiante.cedula;
          const asignacionesEstudiante = asignaciones.filter(asig => {
            if (!asig.alumnos || !Array.isArray(asig.alumnos)) return false;
            return asig.alumnos.some(alumnoId => {
              const idStr = typeof alumnoId === 'object' ? alumnoId.toString() : alumnoId;
              return idStr === estudianteId;
            });
          });
          
          // Obtener las calificaciones del estudiante
          const asignacionesConCalificaciones = asignacionesEstudiante.map(asig => {
            // Buscar la calificación del estudiante en esta asignación
            let calificacion = '';
            if (asig.calificaciones && Array.isArray(asig.calificaciones)) {
              const calEstudiante = asig.calificaciones.find(cal => {
                if (!cal.estudianteId) return false;
                const calEstId = typeof cal.estudianteId === 'object' ? cal.estudianteId.toString() : cal.estudianteId;
                return calEstId === estudianteId;
              });
              if (calEstudiante) {
                calificacion = calEstudiante.valor || '';
              }
            }
            
            return {
              ...asig,
              nombreMateria: asig.materia?.nombre || 'Sin nombre',
              calificacion
            };
          });
          
          return {
            ...estudiante,
            asignaciones: asignacionesConCalificaciones
            // Mantener el valor de anio que ya tiene el estudiante en lugar de sobrescribirlo
          };
        });
        
        // Crear un libro de Excel desde cero para estudiantes
        const estudiantesWorkbook = XLSX.utils.book_new();
        console.log(estudiantes);
        // Preparar los datos para el Excel
        const estudiantesData = estudiantes.map((estudiante, index) => {
          // Obtener información del representante
          const representanteNombre = estudiante.representante ? 
            `${estudiante.representante.nombre || ''} ${estudiante.representante.apellido || ''}`.trim() : 'N/D';
          
          // Calcular la edad basada en la fecha de nacimiento
          let edad = 'N/D';
          if (estudiante.fechaNacimiento) {
            const fechaNacimiento = new Date(estudiante.fechaNacimiento);
            const hoy = new Date();
            let edadCalculada = hoy.getFullYear() - fechaNacimiento.getFullYear();
            const mes = hoy.getMonth() - fechaNacimiento.getMonth();
            
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
              edadCalculada--;
            }
            edad = edadCalculada;
          }
          
          // Convertir sexo a formato legible
          let sexo = 'N/D';
          if (estudiante.sexo) {
            switch (estudiante.sexo.toUpperCase()) {
              case 'M':
                sexo = 'Masculino';
                break;
              case 'F':
                sexo = 'Femenino';
                break;
              default:
                sexo = estudiante.sexo;
                break;
            }
          }
          
          // Crear un objeto base con la información del estudiante
          const estudianteData = {
            '#': index + 1,
            'Cédula': estudiante.cedula || estudiante.idU || 'N/D',
            'Apellidos': estudiante.apellidos || estudiante.apellido || 'N/D',
            'Nombres': estudiante.nombres || estudiante.nombre || 'N/D',
            'Edad': edad,
            'Sexo': sexo,
            "Año": estudiante.anio || 'N/D',
            "Sección": estudiante.seccion || 'N/D',
          };
          
          return estudianteData;
        });
        
        // Crear hoja de cálculo
        const estudiantesWorksheet = XLSX.utils.json_to_sheet(estudiantesData);
        
        // Ajustar ancho de columnas
        const estudiantesColWidths = [
          { wch: 5 },  // #
          { wch: 15 }, // Cédula
          { wch: 25 }, // Apellidos
          { wch: 25 }, // Nombres
          { wch: 8 },  // Edad
          { wch: 12 }, // Sexo
          { wch: 15 }, // Año
          { wch: 15 }, // Sección
        ];
        estudiantesWorksheet['!cols'] = estudiantesColWidths;
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(estudiantesWorkbook, estudiantesWorksheet, 'Estudiantes');
        
        // Generar archivo Excel
        const estudiantesExcelBuffer = XLSX.write(estudiantesWorkbook, { bookType: 'xlsx', type: 'buffer' });
        
        // Configurar nombre del archivo
        let nombreArchivo = 'Reporte_Estudiantes';
        if (anio) {
          nombreArchivo += `_${anio.replace(/\s+/g, '_')}`;
        }
        if (seccion) {
          nombreArchivo += `_Seccion_${seccion}`;
        }
        nombreArchivo += `_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Devolver el archivo Excel como respuesta
        return new Response(estudiantesExcelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${nombreArchivo}"`
          }
        });

      case 'completo':
        // Reporte completo con estudiantes y representantes
        console.log('Generando reporte completo con estudiantes y representantes');
        
        // Filtrar por año y sección si se especifican
        let queryCompleto = {};
        
        if (anio || seccion) {
          console.log(`Filtrando estudiantes por año: ${anio || 'todos'} y sección: ${seccion || 'todas'}`);
          
          if (anio) {
            queryCompleto.anio = anio;
            console.log(`Filtrando por año: ${anio}`);
          }
          
          if (seccion) {
            queryCompleto.seccion = seccion;
            console.log(`Filtrando por sección: ${seccion}`);
          }
        }
        
        // Obtener todos los estudiantes según el filtro
        const estudiantesCompletos = await Estudiante.find(queryCompleto).lean();
        
        // Ordenar por cédula de forma ascendente
        estudiantesCompletos.sort((a, b) => {
          const cedulaA = a.cedula || a.idU || '';
          const cedulaB = b.cedula || b.idU || '';
          return cedulaA.localeCompare(cedulaB, undefined, { numeric: true });
        });
        console.log(`Encontrados ${estudiantesCompletos.length} estudiantes para reporte completo`);
        
        // Crear un libro de Excel desde cero para el reporte completo
        const completoWorkbook = XLSX.utils.book_new();
        
        // Preparar los datos para el Excel
        const datosCompletos = estudiantesCompletos.map((estudiante, index) => {
          // Calcular la edad basada en la fecha de nacimiento
          let edad = 'N/D';
          if (estudiante.fechaNacimiento) {
            const fechaNacimiento = new Date(estudiante.fechaNacimiento);
            const hoy = new Date();
            let edadCalculada = hoy.getFullYear() - fechaNacimiento.getFullYear();
            const mes = hoy.getMonth() - fechaNacimiento.getMonth();
            
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
              edadCalculada--;
            }
            edad = edadCalculada;
          }
          
          // Convertir sexo a formato legible
          let sexo = 'N/D';
          if (estudiante.sexo) {
            switch (estudiante.sexo.toUpperCase()) {
              case 'M':
                sexo = 'Masculino';
                break;
              case 'F':
                sexo = 'Femenino';
                break;
              default:
                sexo = estudiante.sexo;
                break;
            }
          }
          
          // Formatear fecha de nacimiento
          let fechaNacimientoFormateada = 'N/D';
          if (estudiante.fechaNacimiento) {
            const fecha = new Date(estudiante.fechaNacimiento);
            fechaNacimientoFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
          }
          
          // Información del representante
          let representanteCedula = 'N/D';
          let representanteApellidos = 'N/D';
          let representanteNombres = 'N/D';
          let representanteTelefono = 'N/D';
          let representanteCorreo = 'N/D';
          let representanteParentesco = 'N/D';
          
          if (estudiante.representante) {
            representanteCedula = estudiante.representante.cedula || 'N/D';
            representanteApellidos = estudiante.representante.apellido || 'N/D';
            representanteNombres = estudiante.representante.nombre || 'N/D';
            representanteTelefono = estudiante.representante.telefono || 'N/D';
            representanteCorreo = estudiante.representante.correo || 'N/D';
            representanteParentesco = estudiante.representante.parentesco || 'N/D';
          }
          
          // Crear un objeto con toda la información
          return {
            '#': index + 1,
            // Datos del Estudiante
            'CINº Estudiante': estudiante.cedula || estudiante.idU || 'N/D',
            'Apellidos Estudiante': estudiante.apellidos || estudiante.apellido || 'N/D',
            'Nombres Estudiante': estudiante.nombres || estudiante.nombre || 'N/D',
            'F D N': fechaNacimientoFormateada,
            'EDAD': edad,
            'GÉNERO': sexo,
            'AÑO': estudiante.anio || 'N/D',
            'SECCIÓN': estudiante.seccion || 'N/D',
            // Nuevos campos
            'LUGAR NACIMIENTO': estudiante.lugarNacimiento || 'N/D',
            'MUNICIPIO': estudiante.ef || estudiante.municipio || 'N/D',
            'DIRECCIÓN': '',
            // Datos del Representante
            'CINº Representante': representanteCedula,
            'Apellidos Representante': representanteApellidos,
            'Nombres Representante': representanteNombres,
            'Nº TLF': representanteTelefono,
            'CORREO': representanteCorreo,
            'PARENTESCO': representanteParentesco
          };
        });
        
        // Crear hoja de cálculo
        const completoWorksheet = XLSX.utils.json_to_sheet(datosCompletos);
        
        // Ajustar ancho de columnas
        const completoColWidths = [
          { wch: 5 },  // #
          { wch: 15 }, // CINº Estudiante
          { wch: 25 }, // Apellidos Estudiante
          { wch: 25 }, // Nombres Estudiante
          { wch: 12 }, // F D N
          { wch: 8 },  // EDAD
          { wch: 12 }, // GÉNERO
          { wch: 8 },  // AÑO
          { wch: 12 }, // SECCIÓN
          { wch: 22 }, // LUGAR NACIMIENTO
          { wch: 18 }, // MUNICIPIO
          { wch: 28 }, // DIRECCIÓN
          { wch: 15 }, // CINº Representante
          { wch: 25 }, // Apellidos Representante
          { wch: 25 }, // Nombres Representante
          { wch: 15 }, // Nº TLF
          { wch: 30 }, // CORREO
          { wch: 15 }, // PARENTESCO
        ];
        completoWorksheet['!cols'] = completoColWidths;
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(completoWorkbook, completoWorksheet, 'Reporte Completo');
        
        // Generar archivo Excel
        const completoExcelBuffer = XLSX.write(completoWorkbook, { bookType: 'xlsx', type: 'buffer' });
        
        // Configurar nombre del archivo
        let nombreArchivoCompleto = 'Reporte_Completo_Estudiantes_Representantes';
        if (anio) {
          nombreArchivoCompleto += `_${anio.replace(/\s+/g, '_')}`;
        }
        if (seccion) {
          nombreArchivoCompleto += `_Seccion_${seccion}`;
        }
        nombreArchivoCompleto += `_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Devolver el archivo Excel como respuesta
        return new Response(completoExcelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${nombreArchivoCompleto}"`
          }
        });
        
      default:
        return NextResponse.json({ 
          success: false, 
          message: `Tipo de reporte '${tipoReporte}' no soportado` 
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error al generar reporte Excel:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error al generar reporte Excel: ${error.message}` 
    }, { status: 500 });
  }
}
