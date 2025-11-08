import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../../database/db';
import Asignacion from '../../../../../../../database/models/Asignacion';
import Estudiante from '../../../../../../../database/models/Estudiante';
import mongoose from 'mongoose';

// POST - Agregar una nueva calificación a una actividad
export async function POST(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id, actividadId } = await params; // ID de la asignación y de la actividad
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.alumnoId || data.nota === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: alumnoId y nota son obligatorios'
      }, { status: 400 });
    }
    
    // Verificar que la nota sea válida (entre 1 y 20)
    if (isNaN(data.nota) || data.nota < 1 || data.nota > 20) {
      return NextResponse.json({
        success: false,
        message: 'La nota debe ser un número entre 1 y 20'
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
    
    // Verificar que el alumno esté asignado a la asignación
    const alumnoAsignado = asignacion.alumnos.some(alumnoId => 
      alumnoId.toString() === data.alumnoId
    );
    
    if (!alumnoAsignado) {
      return NextResponse.json({
        success: false,
        message: `El alumno con ID ${data.alumnoId} no está asignado a esta asignación`
      }, { status: 400 });
    }
    
    // Buscar la actividad en la asignación
    const actividadIndex = asignacion.actividades.findIndex(act => 
      act._id.toString() === actividadId
    );
    
    if (actividadIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Verificar si ya existe una calificación para este alumno en esta actividad
    const calificacionExistente = asignacion.actividades[actividadIndex].calificaciones.findIndex(cal => 
      cal.alumnoId.toString() === data.alumnoId
    );
    
    if (calificacionExistente !== -1) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe una calificación para este alumno en esta actividad. Use PUT para actualizar.'
      }, { status: 400 });
    }
    
    // Crear el objeto de calificación con la URL de la imagen
    const nuevaCalificacion = {
      alumnoId: data.alumnoId,
      nota: data.nota,
      imagenUrl: data.imagenUrl || '' // Garantizamos que siempre exista este campo
    };
    
    // Agregar la calificación a la actividad
    asignacion.actividades[actividadIndex].calificaciones.push(nuevaCalificacion);
    
    // Forzar la actualización del campo actividades
    asignacion.markModified('actividades');
    
    // Guardar los cambios
    await asignacion.save();
    
    return NextResponse.json({
      success: true,
      message: 'Calificación agregada correctamente',
      data: asignacion.actividades[actividadIndex]
    }, { status: 201 });

  } catch (error) {
    console.error('Error al agregar calificación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al agregar calificación',
      error: error.message
    }, { status: 500 });
  }
}

// GET - Obtener todas las calificaciones de una actividad
export async function GET(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id, actividadId } = await params;
    
    // Buscar la asignación por ID
    const asignacion = await Asignacion.findById(id);
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    // Buscar la actividad en la asignación
    const actividad = asignacion.actividades.find(act => 
      act._id.toString() === actividadId
    );
    
    if (!actividad) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Obtener las calificaciones
    const calificaciones = [...actividad.calificaciones];
    
    // Para cada calificación, obtener los datos del estudiante desde la colección de estudiantes
    const calificacionesConDatosEstudiante = await Promise.all(calificaciones.map(async (calificacion) => {
      try {
        const alumnoId = calificacion.alumnoId.toString();
        const estudiante = await Estudiante.findById(alumnoId);
        
        if (estudiante) {
          return {
            ...calificacion.toObject(),
            estudiante: {
              nombre: estudiante.nombre,
              idU: estudiante.idU
            }
          };
        }
        return calificacion;
      } catch (error) {
        console.error(`Error al obtener datos del estudiante ${calificacion.alumnoId}:`, error);
        return calificacion;
      }
    }));
    
    return NextResponse.json({
      success: true,
      data: calificacionesConDatosEstudiante
    });

  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener calificaciones',
      error: error.message
    }, { status: 500 });
  }
}
