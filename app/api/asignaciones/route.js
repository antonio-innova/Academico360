import { NextResponse } from 'next/server';
import dbConnection from '../../../database/db';
import Asignacion from '../../../database/models/Asignacion';
import Profesor from '../../../database/models/Profesor';
import Materia from '../../../database/models/Materia';
import Estudiante from '../../../database/models/Estudiante';
import mongoose from 'mongoose';

// GET - Obtener todas las asignaciones
export async function GET(request) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const { userId, alumnoId, idA, idI, idID, institucion, materiaId, creadorId, profesorId, userType, profesorNombre } = searchParams;
    
    
    // Construir el filtro de búsqueda
    const filter = {};
    
    // Filtrar por creador si se proporciona
    if (creadorId) {
      filter.creadoPor = creadorId;
    } else if (userId) {
      filter.creadoPor = userId;
    }
    
    // Filtrar por materia si se proporciona
    if (materiaId) {
      filter.materiaId = materiaId;
    }
    
    // Filtrar por profesor si se proporciona
    if (profesorId) {
      filter.profesorId = profesorId;
    }
    
    // Si es un docente, siempre filtrar por el nombre del profesor
    if (userType === 'docente' && profesorNombre) {
      
      // Crear un filtro más estricto y específico para docentes
      // Primero, normalizar el nombre del profesor (eliminar espacios extras, convertir a minúsculas)
      const nombreNormalizado = profesorNombre.trim().toLowerCase();
      
      // Dividir el nombre en partes para buscar coincidencias parciales
      const nombreParts = nombreNormalizado.split(/\s+/).filter(part => part.length > 2);
      
      // Crear condiciones para buscar coincidencias exactas o parciales
      const condicionesProfesor = [
        // Coincidencia exacta en campo profesor
        { profesor: { $regex: new RegExp(`^${nombreNormalizado}$`, 'i') } },
        // Coincidencia exacta en campo profesorNombre
        { profesorNombre: { $regex: new RegExp(`^${nombreNormalizado}$`, 'i') } },
        // Coincidencia parcial en campo profesor
        { profesor: { $regex: new RegExp(nombreNormalizado, 'i') } },
        // Coincidencia parcial en campo profesorNombre
        { profesorNombre: { $regex: new RegExp(nombreNormalizado, 'i') } }
      ];
      
      // Añadir condiciones para cada parte del nombre
      nombreParts.forEach(part => {
        // Solo para partes significativas (más de 2 caracteres)
        condicionesProfesor.push({ profesor: { $regex: new RegExp(`\\b${part}\\b`, 'i') } });
        condicionesProfesor.push({ profesorNombre: { $regex: new RegExp(`\\b${part}\\b`, 'i') } });
      });
      
      // Aplicar todas las condiciones como OR
      filter.$or = condicionesProfesor;
      
    } else if (profesorNombre) {
      // Para otros tipos de usuario, si se proporciona un nombre de profesor, filtrar por ese profesor
      filter.$or = [
        { profesor: { $regex: new RegExp(profesorNombre, 'i') } },
        { profesorNombre: { $regex: new RegExp(profesorNombre, 'i') } }
      ];
    }
    
    console.log('Filtro aplicado:', filter);

    // Si tenemos alumnoId, construimos una consulta basada en la estructura de la base de datos
    if (alumnoId) {
      // Condiciones básicas que siempre deben cumplirse: el alumno debe estar en la asignación
      const condicionesBasicas = { alumnos: alumnoId };
      
      // Verificar qué tipo de identificador tenemos disponible
      if (institucion === 'acacias' && idA) {
        // Para Acacias, buscamos asignaciones con idAAS
        filter.$and = [
          condicionesBasicas,
          { idAAS: { $exists: true } }  // Buscar asignaciones que tengan el campo idAAS
        ];
      } else if (institucion === 'iutcm' && idI) {
        // Para IUTCM, buscamos asignaciones con idIAS
        filter.$and = [
          condicionesBasicas,
          { idIAS: { $exists: true } }  // Buscar asignaciones que tengan el campo idIAS
        ];
      } else if (idA && !idI) {
        // Si tenemos idA pero no idI, solo mostrar asignaciones de Acacias
        filter.$and = [
          condicionesBasicas,
          { idAAS: { $exists: true } }
        ];
      } else if ((idI || idID) && !idA) {
        // Si tenemos idI o idID pero no idA, solo mostrar asignaciones de IUTCM
        filter.$and = [
          condicionesBasicas,
          { idIAS: { $exists: true } }
        ];
      } else if (idA) {
        // Si tenemos idA pero no institución definida, asumimos Acacias
        filter.$and = [
          condicionesBasicas,
          { idAAS: { $exists: true } }
        ];
      } else if (idI || idID) {
        // Si tenemos idI o idID pero no institución definida, asumimos IUTCM
        filter.$and = [
          condicionesBasicas,
          { idIAS: { $exists: true } }
        ];
      } else {
        // Si no tenemos identificadores específicos, solo usamos el alumnoId
        Object.assign(filter, condicionesBasicas);
      }
      
    } else {
      // Si no hay alumnoId, aplicamos los otros filtros de forma independiente
      // Filtrar por institución si se proporciona
      if (institucion) {
        filter.institucion = institucion;
      }
      
      // Filtrar por idI o idA si se proporcionan
      if (idI) {
        filter.idI = idI;
      } else if (idA) {
        filter.idA = idA;
      }
    }
    
    
    // Obtener todas las asignaciones que coincidan con el filtro
    let asignaciones = await Asignacion.find(filter).sort({ createdAt: -1 });
    
    
    // Filtrado adicional para docentes directamente en el servidor
    if (userType === 'docente' && profesorNombre) {
      
      // Filtrar las asignaciones para mostrar solo las del profesor actual
      asignaciones = asignaciones.filter(asignacion => {
        const profesor = asignacion.profesor || '';
        const profesorNombreField = asignacion.profesorNombre || '';
        
        // Convertir a minúsculas para comparación insensible a mayúsculas/minúsculas
        const nombreProfesorLower = profesorNombre.toLowerCase();
        const profesorLower = profesor.toLowerCase();
        const profesorNombreLower = profesorNombreField.toLowerCase();
        
        // Verificar coincidencia exacta con el nombre completo o parcial con nombre/apellido
        const coincideNombreCompleto = profesorLower.includes(nombreProfesorLower) || 
                                      profesorNombreLower.includes(nombreProfesorLower);
        
        // Si coincide el nombre completo, devolver true
        if (coincideNombreCompleto) {
          return true;
        }
        
        // Verificar coincidencia con partes del nombre
        const partes = profesorNombre.split(' ');
        for (const parte of partes) {
          if (parte.trim().length > 2) { // Solo considerar palabras de más de 2 caracteres
            if (profesorLower.includes(parte.toLowerCase()) || 
                profesorNombreLower.includes(parte.toLowerCase())) {
              return true;
            }
          }
        }
        
        return false;
      });
      
    }
    
    // Convertir a objetos planos para poder modificarlos
    asignaciones = asignaciones.map(doc => typeof doc.toObject === 'function' ? doc.toObject() : doc);
    
    // Obtener información completa de cada asignación
    const asignacionesConInfo = await Promise.all(asignaciones.map(async asignacion => {
      const materia = await Materia.findById(asignacion.materiaId);
      const profesor = await Profesor.findById(asignacion.profesorId);
      const alumnos = await Estudiante.find({ _id: { $in: asignacion.alumnos } });
      
      return {
        ...asignacion,
        materia: materia ? materia.toObject() : {},
        profesor: profesor ? profesor.toObject() : {},
        alumnos: alumnos.map(alumno => alumno.toObject())
      };
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Asignaciones obtenidas correctamente',
      data: asignacionesConInfo
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener asignaciones',
      error: error.message
    }, { status: 500 });
  }
}

//  - Crear una nueva asignación
export async function POST(request) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      console.log('Conectando a MongoDB...');
      await dbConnection.connectDB();
    }

    // Obtener los datos de la solicitud
    const data = await request.json();
    console.log('Datos recibidos para crear asignación:', data);
    
    // Validar datos requeridos
    if (!data.materiaId) {
      return NextResponse.json({
        success: false,
        message: 'Falta el campo materiaId que es obligatorio'
      }, { status: 400 });
    }
    
    if (!data.profesorId) {
      return NextResponse.json({
        success: false,
        message: 'Falta el campo profesorId que es obligatorio'
      }, { status: 400 });
    }
    
    // Verificar que el profesor existe
    const profesor = await Profesor.findById(data.profesorId);
    if (!profesor) {
      return NextResponse.json({
        success: false,
        message: 'El profesor especificado no existe'
      }, { status: 400 });
    }
    
    // Obtener el nombre del profesor
    const profesorNombre = profesor ? `${profesor.nombre} ${profesor.apellido || ''}` : 'Profesor sin nombre';
    
    // Buscar la materia por ID
    let materia;
    try {
      // Verificar si el materiaId es un ObjectId válido
      let materiaObjectId;
      
      try {
        if (data.materiaId && data.materiaId.match(/^[0-9a-fA-F]{24}$/)) {
          materiaObjectId = new mongoose.Types.ObjectId(data.materiaId);
          materia = await Materia.findById(materiaObjectId);
        }
      } catch (err) {
      }
      
      // Si no se encontró por ID, buscar por código
      if (!materia && data.materiaId) {
        materia = await Materia.findOne({ codigo: data.materiaId });
      }
      
      // Si no se encuentra la materia, devolver error
      if (!materia) {
        console.error('Error: No se encontró la materia con ID o código:', data.materiaId);
        return NextResponse.json({
          success: false,
          message: `No se encontró la materia con ID o código: ${data.materiaId}. Por favor, seleccione una materia existente.`
        }, { status: 404 });
      }
    } catch (error) {
      console.error('Error al buscar la materia:', error);
      return NextResponse.json({
        success: false,
        message: 'Error al buscar la materia',
        error: error.message
      }, { status: 500 });
    }
    
    // Procesar la información de alumnos
    let alumnosConNombres = [];
    if (data.alumnos && Array.isArray(data.alumnos) && data.alumnos.length > 0) {
      try {
        // Buscar información de los alumnos
        const alumnos = await Estudiante.find({
          _id: { $in: data.alumnos }
        }).select('_id nombre apellido idU cedula');
        
        alumnosConNombres = alumnos.map(alumno => ({
          id: alumno._id,
          nombre: `${alumno.nombre} ${alumno.apellido || ''}`,
          idU: alumno.idU || alumno.cedula || 'N/P',
          cedula: alumno.cedula || alumno.idU || 'N/A'
        }));
      } catch (error) {
        console.error('Error al obtener información de alumnos:', error);
      }
    } else if (data.alumnosInfo && Array.isArray(data.alumnosInfo)) {
      alumnosConNombres = data.alumnosInfo;
    }
    
    // Crear nueva asignación
    const nuevaAsignacion = new Asignacion({
      materiaId: materia._id,
      materiaNombre: materia.nombre,
      profesorId: data.profesorId,
      profesorNombre: profesorNombre,
      alumnos: data.alumnos || [],
      alumnosInfo: alumnosConNombres || [],
      periodo: data.periodo || '',
      periodoId: data.periodoId || '',
      anio: data.anio || '1 año',
      seccion: data.seccion || 'A',
      turno: data.turno || 'Mañana',
      creadoPor: data.userId || data.creadoPor,
      tipoCreador: data.userType || 'control',
      fechaCreacion: new Date(),
      idAAS: (data.userType === 'control' || data.userType === 'admin') ? `AAS${Date.now()}` : undefined
    });
    
    // Guardar la asignación con verificación adicional y método alternativo
    try {
      // Forzar conexión a MongoDB antes de guardar
      if (!dbConnection.isConnected()) {
        await dbConnection.connectDB();
        // Esperar un momento para asegurar que la conexión esté lista
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Verificar que la conexión esté activa
      if (mongoose.connection.readyState !== 1) {
        console.error('La conexión a MongoDB no está activa. Estado:', mongoose.connection.readyState);
        return NextResponse.json({
          success: false,
          message: 'Error de conexión a la base de datos'
        }, { status: 500 });
      }
      
      // Preparar los datos para guardar
      const asignacionData = {
        materiaId: nuevaAsignacion.materiaId,
        materiaNombre: nuevaAsignacion.materiaNombre,
        profesorId: nuevaAsignacion.profesorId,
        profesorNombre: nuevaAsignacion.profesorNombre,
        alumnos: nuevaAsignacion.alumnos || [],
        alumnosInfo: nuevaAsignacion.alumnosInfo || [],
        periodo: nuevaAsignacion.periodo || '',
        periodoId: nuevaAsignacion.periodoId || '',
        anio: nuevaAsignacion.anio || '1 año',
        seccion: nuevaAsignacion.seccion || 'A',
        turno: nuevaAsignacion.turno || 'Mañana',
        creadoPor: nuevaAsignacion.creadoPor,
        tipoCreador: nuevaAsignacion.tipoCreador,
        fechaCreacion: new Date(),
        idAAS: nuevaAsignacion.idAAS
      };

      
      // Método alternativo: usar insertOne directamente en la colección
      const resultado = await mongoose.connection.db.collection('asignacions').insertOne(asignacionData);
      
      if (!resultado.acknowledged || !resultado.insertedId) {
        console.error('Error: No se pudo insertar la asignación en la base de datos');
        return NextResponse.json({
          success: false,
          message: 'Error al insertar la asignación en la base de datos'
        }, { status: 500 });
      }
      
      
      // Verificar que la asignación se guardó correctamente
      const asignacionVerificada = await mongoose.connection.db.collection('asignacions').findOne({ _id: resultado.insertedId });
      
      if (!asignacionVerificada) {
        console.error('Error: La asignación no se encontró después de guardarla');
        return NextResponse.json({
          success: false,
          message: 'Error al verificar la asignación guardada'
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Asignación creada y verificada correctamente',
        data: asignacionVerificada
      }, { status: 201 });
    } catch (saveError) {
      console.error('Error al guardar asignación:', saveError);
      return NextResponse.json({
        success: false,
        message: 'Error al guardar asignación: ' + saveError.message,
        error: saveError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error general al crear asignación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear asignación',
      error: error.message
    }, { status: 500 });
  }
}
