import { NextResponse } from 'next/server';
import dbConnection from '../../../../../database/db';
import Asignacion from '../../../../../database/models/Asignacion';

// POST - Agregar una nueva actividad a una asignación
export async function POST(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const { id } = params; // ID de la asignación
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.nombre || !data.porcentaje || !data.momento) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: nombre, porcentaje y momento son obligatorios'
      }, { status: 400 });
    }

    // Validar que el momento sea un número válido (1, 2 o 3)
    const momentoNumerico = parseInt(data.momento);
    if (isNaN(momentoNumerico) || ![1, 2, 3].includes(momentoNumerico)) {
      return NextResponse.json({
        success: false,
        message: 'El momento debe ser 1, 2 o 3'
      }, { status: 400 });
    }
    
    // Verificar que el porcentaje sea válido
    if (data.porcentaje < 0 || data.porcentaje > 100) {
      return NextResponse.json({
        success: false,
        message: 'El porcentaje debe estar entre 0 y 100'
      }, { status: 400 });
    }
    
    // Buscar la asignación por ID
    const asignacion = await Asignacion.findById(id);
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    const nuevaActividad = {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      fecha: data.fecha || new Date(),
      porcentaje: data.porcentaje,
      momento: momentoNumerico,
      calificaciones: [],
      fechaCreacion: new Date()
    };
    
    // Si se proporcionan calificaciones iniciales, agregarlas
    if (data.calificaciones && Array.isArray(data.calificaciones)) {
      // Verificar que los alumnos estén asignados a la asignación
      for (const calificacion of data.calificaciones) {
        const alumnoAsignado = asignacion.alumnos.some(alumnoId => 
          alumnoId.toString() === calificacion.alumnoId
        );
        
        if (!alumnoAsignado) {
          return NextResponse.json({
            success: false,
            message: `El alumno con ID ${calificacion.alumnoId} no está asignado a esta asignación`
          }, { status: 400 });
        }
        
        nuevaActividad.calificaciones.push({
          alumnoId: calificacion.alumnoId,
          nota: calificacion.nota
        });
      }
    }
    
    // Agregar la actividad a la asignación
    asignacion.actividades.push(nuevaActividad);
    
    // Guardar los cambios
    await asignacion.save();
    
    // Obtener la asignación actualizada con los datos populados
    const asignacionActualizada = await Asignacion.findById(id)
      .populate('materiaId', 'codigo nombre descripcion')
      .populate('profesorId', 'nombre apellido email telefono especialidad')
      .populate('alumnos', 'nombre apellido idU fechaNacimiento');
    
    return NextResponse.json({
      success: true,
      message: 'Actividad agregada correctamente',
      data: asignacionActualizada
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al agregar actividad',
      error: error.message
    }, { status: 500 });
  }
}

// GET - Obtener todas las actividades de una asignación
export async function GET(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const { id } = params; // ID de la asignación
    
    // Buscar la asignación por ID
    const asignacion = await Asignacion.findById(id)
      .populate('materiaId', 'codigo nombre descripcion')
      .populate('profesorId', 'nombre apellido email telefono especialidad')
      .populate('alumnos', 'nombre apellido idU fechaNacimiento');
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Actividades obtenidas correctamente',
      data: {
        asignacion: {
          _id: asignacion._id,
          materiaId: asignacion.materiaId,
          profesorId: asignacion.profesorId,
          alumnos: asignacion.alumnos
        },
        actividades: asignacion.actividades
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al obtener actividades',
      error: error.message
    }, { status: 500 });
  }
}
