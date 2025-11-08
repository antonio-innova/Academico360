import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../../../database/db';
import Asignacion from '../../../../../../../../database/models/Asignacion';
import mongoose from 'mongoose';

// PUT - Actualizar una calificación existente
export async function PUT(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id, actividadId, calificacionId } = await params;
    const data = await request.json();
    
    // Validar datos requeridos
    if (data.nota === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Falta el campo requerido: nota'
      }, { status: 400 });
    }
    
    // Verificar que la nota sea válida (entre 1 y 20)
    if (isNaN(data.nota) || data.nota < 1 || data.nota > 20) {
      return NextResponse.json({
        success: false,
        message: 'La nota debe ser un número entre 1 y 20'
      }, { status: 400 });
    }
    
    // Buscar la asignación
    const asignacion = await Asignacion.findById(id);
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    // Buscar la actividad
    const actividadIndex = asignacion.actividades.findIndex(act => 
      act._id.toString() === actividadId
    );
    
    if (actividadIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Buscar la calificación
    const calificacionIndex = asignacion.actividades[actividadIndex].calificaciones.findIndex(cal => 
      cal._id.toString() === calificacionId
    );
    
    if (calificacionIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Calificación no encontrada'
      }, { status: 404 });
    }
    
    // Actualizar la calificación
    asignacion.actividades[actividadIndex].calificaciones[calificacionIndex].nota = data.nota;
    
    // Actualizar la URL de la imagen
    asignacion.actividades[actividadIndex].calificaciones[calificacionIndex].imagenUrl = data.imagenUrl || '';
    
    // Si se proporciona un nuevo alumnoId, actualizarlo también
    if (data.alumnoId) {
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
      
      asignacion.actividades[actividadIndex].calificaciones[calificacionIndex].alumnoId = data.alumnoId;
    }
    
    // Forzar la actualización y guardar los cambios
    asignacion.markModified('actividades');
    await asignacion.save();
    
    return NextResponse.json({
      success: true,
      message: 'Calificación actualizada correctamente',
      data: asignacion.actividades[actividadIndex].calificaciones[calificacionIndex]
    }, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar calificación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar calificación',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Eliminar una calificación
export async function DELETE(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id, actividadId, calificacionId } = await params;
    
    // Buscar la asignación
    const asignacion = await Asignacion.findById(id);
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    // Buscar la actividad
    const actividadIndex = asignacion.actividades.findIndex(act => 
      act._id.toString() === actividadId
    );
    
    if (actividadIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Buscar y eliminar la calificación
    const calificacionIndex = asignacion.actividades[actividadIndex].calificaciones.findIndex(cal => 
      cal._id.toString() === calificacionId
    );
    
    if (calificacionIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Calificación no encontrada'
      }, { status: 404 });
    }
    
    // Eliminar la calificación del array
    asignacion.actividades[actividadIndex].calificaciones.splice(calificacionIndex, 1);
    
    // Guardar los cambios
    await asignacion.save();
    
    return NextResponse.json({
      success: true,
      message: 'Calificación eliminada correctamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error al eliminar calificación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar calificación',
      error: error.message
    }, { status: 500 });
  }
}
