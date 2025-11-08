import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnection from '../../../../database/db';
import Estudiante from '../../../../database/models/Estudiante';
import Asignacion from '../../../../database/models/Asignacion';

export async function GET(request) {
  try {
    await dbConnection.connectDB();
    
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const profesorId = searchParams.get('profesorId');
    const materiaId = searchParams.get('materiaId');
    const periodoId = searchParams.get('periodoId');
    const tipoReporte = searchParams.get('tipoReporte') || 'estudiantes';
    const idPrefix = searchParams.get('idPrefix') || 'idAA';
    const creadorId = searchParams.get('creadorId');
    
    // Inicializar variables para el reporte
    let estudiantes = [];
    let query = {};
    // Declarar variables para el reporte CSV
    let headers = [];
    let rows = [];
    
    // Si hay un creadorId, filtrar por él
    if (creadorId) {
      query.userId = creadorId;
    }
    
    // Determinar qué tipo de reporte generar
    switch (tipoReporte) {
      case 'todosDocentes':
        const Profesor = mongoose.models.Profesor || mongoose.model('Profesor', new mongoose.Schema({}));
        estudiantes = await Profesor.find().lean();
        break;
        
      case 'asignaciones':
        estudiantes = await Asignacion.find().lean();
        break;
        
      case 'todosEstudiantes':
        // Filtrar por año si se especifica
        const anio = searchParams.get('anio');
        let query = {};
        if (anio) {
          // Buscar asignaciones con el año especificado
          const asignacionesConAnio = await Asignacion.find({ anio }).lean();
          
          // Extraer los IDs de estudiantes de estas asignaciones
          const estudiantesIds = new Set();
          asignacionesConAnio.forEach(asignacion => {
            if (asignacion.alumnos && Array.isArray(asignacion.alumnos)) {
              asignacion.alumnos.forEach(alumnoId => {
                const idStr = typeof alumnoId === 'object' ? alumnoId.toString() : alumnoId;
                estudiantesIds.add(idStr);
              });
            }
          });
          
          if (estudiantesIds.size > 0) {
            query._id = { $in: Array.from(estudiantesIds) };
          }
        }
        
        // Obtener todos los estudiantes según el filtro
        estudiantes = await Estudiante.find(query).lean();
        
        // Obtener todas las asignaciones para estos estudiantes
        const estudiantesIds = estudiantes.map(e => e._id);
        const asignaciones = await Asignacion.find({
          alumnos: { $in: estudiantesIds }
        }).lean();
        
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
              calificacion
            };
          });
          
          return {
            ...estudiante,
            asignaciones: asignacionesConCalificaciones,
            anio: anio || (asignacionesConCalificaciones.length > 0 ? asignacionesConCalificaciones[0].anio : '')
          };
        });
        break;
        
      case 'estudiantes':
      default:
        estudiantes = await Estudiante.find(query).lean();
        break;
    }
    
    // Variable para almacenar el profesor encontrado (para usar en la generación del nombre del archivo)
    let profesorEncontrado = null;
    
    // Si hay filtros adicionales (profesor, materia, periodo), necesitamos filtrar por asignaciones
    if (profesorId || materiaId || periodoId) {
      // Construir consulta para asignaciones
      let asignacionQuery = {};
      
      if (profesorId) {
        try {
          // Importar el modelo Profesor
          const Profesor = mongoose.models.Profesor || mongoose.model('Profesor', new mongoose.Schema({}));
          
          // Buscar el profesor por cualquier campo que pueda contener la cédula
          const profesor = await Profesor.findOne({
            $or: [
              { idU: profesorId },
              { cedula: profesorId },
              { id: profesorId }
            ]
          }).lean();
          
          if (profesor) {
            profesorEncontrado = profesor;
            asignacionQuery.profesorId = profesor._id.toString();
          } else {
            // Intentar buscar por otros campos
            const profesorPorNombre = await Profesor.findOne({ 
              $or: [
                { cedula: profesorId },
                { idU: { $regex: profesorId, $options: 'i' } }
              ]
            }).lean();
            
            if (profesorPorNombre) {
              profesorEncontrado = profesorPorNombre;
              asignacionQuery.profesorId = profesorPorNombre._id.toString();
            }
          }
        } catch (error) {
          console.error('Error al buscar profesor:', error);
        }
      }
      
      if (materiaId) {
        asignacionQuery.materiaId = materiaId;
      }
      
      if (periodoId) {
        asignacionQuery.periodo = periodoId;
      }
      
      // Buscar asignaciones que coincidan con los criterios
      const asignaciones = await Asignacion.find(asignacionQuery).lean();
      
      // Array para almacenar la información completa de los estudiantes con sus datos de asignación
      let estudiantesConInfo = [];
      
      if (asignaciones.length > 0) {
        // Extraer información de estudiantes de las asignaciones
        for (const asignacion of asignaciones) {
          // Imprimir la estructura completa de la asignación para depurar
          console.log('Estructura de la asignación:', Object.keys(asignacion));
          
          // Verificar todos los posibles nombres de arrays de estudiantes
          const posiblesArrays = ['alumnosInfo', 'alumnos', 'estudiantesIds', 'estudiantes', 'alumnosData'];
          posiblesArrays.forEach(arrayName => {
            if (asignacion[arrayName]) {
              console.log(`La asignación tiene el array ${arrayName} con ${Array.isArray(asignacion[arrayName]) ? asignacion[arrayName].length : 'no es array'} elementos`);
              if (Array.isArray(asignacion[arrayName]) && asignacion[arrayName].length > 0) {
                console.log(`Primer elemento de ${arrayName}:`, asignacion[arrayName][0]);
              }
            }
          });
          
          // Intentar obtener el nombre de la materia
          let nombreMateria = 'No especificado';
          try {
            if (asignacion.materiaId) {
              // Importar el modelo Materia
              const Materia = mongoose.models.Materia || mongoose.model('Materia', new mongoose.Schema({}));
              const materia = await Materia.findById(asignacion.materiaId).lean();
              if (materia) {
                nombreMateria = materia.nombre || 'No especificado';
              }
            }
          } catch (error) {
            console.error('Error al obtener nombre de materia:', error);
          }
          
          // Crear un mapa para almacenar calificaciones de estudiantes
          const calificacionesMap = new Map();
          
          // Verificar si hay calificaciones en la asignación
          if (asignacion.calificaciones && Array.isArray(asignacion.calificaciones)) {
            console.log(`La asignación tiene ${asignacion.calificaciones.length} calificaciones`);
            
            // Recorrer las calificaciones y guardarlas en el mapa
            asignacion.calificaciones.forEach(cal => {
              if (cal.estudianteId && cal.valor) {
                const idStr = typeof cal.estudianteId === 'object' ? cal.estudianteId.toString() : cal.estudianteId;
                calificacionesMap.set(idStr, cal.valor);
              }
            });
          }
          
          // Buscar estudiantes en todos los posibles arrays
          for (const arrayName of posiblesArrays) {
            const estudiantesArray = asignacion[arrayName];
            
            if (estudiantesArray) {
              console.log(`Usando ${arrayName} como respaldo: ${estudiantesArray.length} IDs`);
              
              // Buscar los estudiantes por sus IDs
              for (const estudianteId of estudiantesArray) {
                // Convertir a string si es un ObjectId
                const idStr = typeof estudianteId === 'object' && estudianteId !== null ? 
                  (estudianteId.toString ? estudianteId.toString() : String(estudianteId)) : 
                  String(estudianteId);
                
                // Buscar en la colección de estudiantes
                const estudiante = estudiantes.find(e => {
                  const eId = e._id ? (typeof e._id === 'object' ? e._id.toString() : e._id) : null;
                  return eId === idStr;
                });
                
                if (estudiante) {
                  // Obtener la calificación del mapa si existe
                  const calificacion = calificacionesMap.has(idStr) ? calificacionesMap.get(idStr) : '';
                  
                  estudiantesConInfo.push({
                    id: estudiante._id,
                    nombre: estudiante.nombre || '',
                    apellido: estudiante.apellido || '',
                    cedula: estudiante.cedula || estudiante.idU || '',
                    correo: estudiante.correo || '',
                    telefono: estudiante.telefono || '',
                    menorEdad: estudiante.esMenorDeEdad || estudiante.menorEdad || false,
                    materia: nombreMateria,
                    profesor: profesorEncontrado ? `${profesorEncontrado.nombre} ${profesorEncontrado.apellido || ''}` : 'No especificado',
                    periodo: asignacion.periodoId || asignacion.periodo || 'No especificado',
                    calificacion: calificacion
                  });
                } else {
                  console.log(`No se encontró estudiante con ID: ${idStr}`);
                }
              }
            } else {
              console.log('No se encontró ningún array de estudiantes en la asignación');
            }
          }
        }
        
        console.log(`Total de estudiantes con información: ${estudiantesConInfo.length}`);
        
        // Reemplazar el array de estudiantes con la nueva información
        estudiantes = estudiantesConInfo;
      } else {
        // Si no hay asignaciones, mantener los estudiantes originales
        console.log('No se encontraron asignaciones, manteniendo estudiantes originales');
      }
      
      console.log(`Despues del filtrado: ${estudiantes.length} estudiantes`);
    }
    
    // Preparar los datos para el reporte CSV con un diseño mejorado según el tipo de reporte
    // Reiniciar los arrays para el reporte
    headers.length = 0;
    rows.length = 0;
    
    // Definir encabezados y filas según el tipo de reporte
    switch (tipoReporte) {
      case 'todosDocentes':
        // Encabezados para reporte de docentes
        headers = [
          'N', 'Cedula', 'Nombre', 'Apellido', 'Email', 'Telefono', 'Especialidad'
        ];
        
        // Generar filas para docentes
        rows = estudiantes.map((profesor, index) => {
          // Agregar prefijo idAP a la cédula
          const cedula = profesor.cedula || profesor.idU || '';
          const cedulaConPrefijo = cedula ? `${idPrefix}-${cedula}` : '';
          
          return [
            (index + 1).toString(),
            cedulaConPrefijo,
            profesor.nombre || '',
            profesor.apellido || '',
            profesor.email || '',
            profesor.telefono || '',
            profesor.especialidad || ''
          ];
        });
        break;
        
      case 'asignaciones':
        // Encabezados para reporte de asignaciones
        headers = [
          'N', 'ID', 'Materia', 'Profesor', 'Periodo', 'Estudiantes'
        ];
        
        // Generar filas para asignaciones
        rows = estudiantes.map((asignacion, index) => {
          // Agregar prefijo idAAS al ID
          const id = asignacion._id ? asignacion._id.toString() : '';
          const idConPrefijo = id ? `${idPrefix}-${id}` : '';
          
          // Contar estudiantes asignados
          let cantidadEstudiantes = 0;
          if (asignacion.alumnos && Array.isArray(asignacion.alumnos)) {
            cantidadEstudiantes = asignacion.alumnos.length;
          } else if (asignacion.estudiantesIds && Array.isArray(asignacion.estudiantesIds)) {
            cantidadEstudiantes = asignacion.estudiantesIds.length;
          } else if (asignacion.alumnosInfo && Array.isArray(asignacion.alumnosInfo)) {
            cantidadEstudiantes = asignacion.alumnosInfo.length;
          }
          
          return [
            (index + 1).toString(),
            idConPrefijo,
            asignacion.materiaId || '',
            asignacion.profesorId || '',
            asignacion.periodoId || asignacion.periodo || '',
            cantidadEstudiantes.toString()
          ];
        });
        break;
        
      case 'todosEstudiantes':
      case 'estudiantes':
      default:
        // Encabezados para reporte de estudiantes basados en la estructura de MongoDB
        headers = [
          'Cedula', 'Nombre', 'Fecha Nacimiento', 'Es Menor de Edad'
        ];
        
        console.log('Estructura de un estudiante para el CSV:', estudiantes.length > 0 ? Object.keys(estudiantes[0]) : 'No hay estudiantes');
        
        // Generar filas para estudiantes
        rows = estudiantes.map((estudiante) => {
          // Obtener la cédula del estudiante con el prefijo
          const cedula = estudiante.idU || '';
          const cedulaConPrefijo = cedula ? `${idPrefix}-${cedula}` : '';
          
          // Formatear fechas
          const fechaNacimiento = estudiante.fechaNacimiento ? new Date(estudiante.fechaNacimiento).toISOString().split('T')[0] : '';
          
          // Convertir valores booleanos a texto
          const esMenorEdad = estudiante.esMenorDeEdad === true ? 'Si' : 'No';
          
          return [
            cedulaConPrefijo,
            estudiante.nombre || '',
            fechaNacimiento,
            esMenorEdad
          ];
        });
        break;
    }
    
    // Función para formatear campos para Excel
    const formatExcelField = (field) => {
      if (field === null || field === undefined) {
        return '';
      }
      
      const stringField = String(field).trim();
      
      // Siempre encerrar en comillas para asegurar que Excel lo interprete como una celda
      return `"${stringField.replace(/"/g, '""')}"`;
    };
    
    // No eliminar duplicados, ya que queremos mostrar todas las ocurrencias
    // de un alumno en diferentes períodos o con diferentes calificaciones
    console.log(`Total de filas para el CSV: ${rows.length}`);
    
    // Ordenar las filas por cédula y luego por período para mejor organización
    rows.sort((a, b) => {
      // Primero ordenar por cédula (columna 1)
      if (a[1] !== b[1]) {
        return a[1].localeCompare(b[1]);
      }
      // Luego ordenar por período (columna 5)
      if (a.length > 5 && b.length > 5) {
        return a[5].localeCompare(b[5]);
      }
      return 0;
    });
    
    // Aplicar formato especial para Excel
    const rowsFormateadas = rows.map(row => row.map(formatExcelField));
    
    // Generar el contenido CSV optimizado para Excel usando punto y coma como separador
    const csvContent = [
      // Encabezados formateados
      headers.map(formatExcelField).join(';'),
      // Filas formateadas
      ...rowsFormateadas.map(row => row.join(';'))
    ].join('\r\n'); // Usar CRLF para mejor compatibilidad con Excel
    
    // Generar nombre del archivo CSV
    let nombreArchivo = 'Reporte_Estudiantes.csv';
    
    // Personalizar el nombre del archivo según los filtros aplicados
    if (profesorId || materiaId || periodoId) {
      const partes = ['Reporte_Estudiantes'];
      
      // Si se filtro por profesor, incluir su nombre en el archivo
      if (profesorId) {
        // Usar el profesor que ya encontramos anteriormente
        if (profesorEncontrado) {
          // Limpiar el nombre para usarlo en el nombre del archivo (quitar espacios)
          const nombreLimpio = profesorEncontrado.nombre.replace(/\s+/g, '_');
          partes.push(`Profesor_${nombreLimpio}`);
        } else {
          partes.push(`Profesor_Cedula_${profesorId}`);
        }
      }
      
      if (materiaId) partes.push('Materia');
      if (periodoId) partes.push('Periodo');
      
      nombreArchivo = `${partes.join('_')}.csv`;
    }
    
    console.log(`Generando archivo CSV: ${nombreArchivo}`);
    console.log(`Total de estudiantes en el reporte: ${estudiantes.length}`);
    
    // Preparar los datos para la respuesta JSON
    const responseData = {
      success: true,
      message: `Reporte generado con éxito. Total de registros: ${estudiantes.length}`,
      data: estudiantes.map(estudiante => {
        // Convertir ObjectId a string para evitar problemas de serialización
        const estudianteObj = { ...estudiante };
        if (estudianteObj._id) {
          estudianteObj.id = estudianteObj._id.toString();
        }
        
        // Asegurarse de que las fechas estén en formato ISO
        if (estudianteObj.fechaNacimiento) {
          estudianteObj.fechaNacimiento = new Date(estudianteObj.fechaNacimiento).toISOString();
        }
        
        // Incluir el año de las asignaciones si está disponible
        if (estudianteObj.asignaciones && Array.isArray(estudianteObj.asignaciones)) {
          estudianteObj.asignaciones = estudianteObj.asignaciones.map(asig => {
            const asigObj = { ...asig };
            if (asigObj._id) {
              asigObj.id = asigObj._id.toString();
            }
            return asigObj;
          });
        }
        
        return estudianteObj;
      }),
      tipoReporte: tipoReporte,
      filtros: {
        profesorId: profesorId || null,
        materiaId: materiaId || null,
        periodoId: periodoId || null,
        anio: searchParams.get('anio') || null
      }
    };
    
    // Devolver los datos en formato JSON
    return NextResponse.json(responseData, { status: 200 });
    
  } catch (error) {
    console.error('Error al generar reporte:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte', message: error.message },
      { status: 500 }
    );
  }
}
