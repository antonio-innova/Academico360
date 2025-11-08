'use server'

import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../../../../../database/db';
import Aula from '../../../../../../../../../../database/models/Aula';
import mongoose from 'mongoose';

// PUT /api/aulas/[aulaId]/materias/[materiaId]/actividades/[actividadId]/calificaciones/[calificacionId] - Actualizar una calificación
export async function PUT(request, { params }) {
  try {
    await dbConnection.connectDB();
    
    // Esperar los parámetros de la ruta
    const { aulaId, materiaId, actividadId, calificacionId } = await params;
    
    // Verificar el tipo de contenido
    const contentType = request.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      // Si es JSON, usar json()
      data = await request.json();
    } else if (contentType && (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded'))) {
      // Si es form-data, usar formData()
      data = await request.formData();
    } else {
      return NextResponse.json({
        success: false,
        message: 'Tipo de contenido no soportado'
      }, { status: 415 });
    }
    
    // Crear objeto de actualización
    const actualizacion = {};
    
    // Manejar los datos según el tipo de contenido
    if (contentType && contentType.includes('application/json')) {
      // Si es JSON
      if (data.nota !== undefined) actualizacion.nota = Number(data.nota);
      if (data.notaAlfabetica !== undefined) actualizacion.notaAlfabetica = data.notaAlfabetica;
      if (data.tipoCalificacion !== undefined) actualizacion.tipoCalificacion = data.tipoCalificacion;
      if (data.observaciones !== undefined) actualizacion.observaciones = data.observaciones;
      if (data.evidencia !== undefined) actualizacion.evidencia = data.evidencia;
      
      console.log('Evidencia recibida en actualización:', data.evidencia);
    } else {
      // Si es FormData
      if (data.get('nota')) actualizacion.nota = Number(data.get('nota'));
      if (data.get('notaAlfabetica')) actualizacion.notaAlfabetica = data.get('notaAlfabetica');
      if (data.get('tipoCalificacion')) actualizacion.tipoCalificacion = data.get('tipoCalificacion');
      if (data.get('evidencia')) actualizacion.evidencia = data.get('evidencia');
      
      // Manejar observaciones
      const observaciones = data.get('observaciones');
      if (observaciones) {
        actualizacion.observaciones = observaciones;
      }
    }
    
    // Actualización ATÓMICA usando filtros de arreglo
    const actObjectId = new mongoose.Types.ObjectId(actividadId);
    const calObjectId = new mongoose.Types.ObjectId(calificacionId);

    const updateResult = await Aula.updateOne(
      { _id: aulaId },
      {
        $set: {
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].nota': actualizacion.nota,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].notaAlfabetica': actualizacion.notaAlfabetica,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].tipoCalificacion': actualizacion.tipoCalificacion,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].observaciones': actualizacion.observaciones,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].evidencia': actualizacion.evidencia,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].fechaModificacion': new Date()
        }
      },
      {
        arrayFilters: [
          { 'asig.materia.id': materiaId },
          { 'act._id': actObjectId },
          { 'cal._id': calObjectId }
        ]
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Aula/Materia/Actividad/Calificación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Calificación actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar calificación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar calificación',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE /api/aulas/[aulaId]/materias/[materiaId]/actividades/[actividadId]/calificaciones/[calificacionId] - Eliminar una calificación
export async function DELETE(request, { params }) {
  try {
    await dbConnection.connectDB();
    
    const { aulaId, materiaId, actividadId, calificacionId } = await params;
    
    // Validar que el aula existe
    const aula = await Aula.findById(aulaId);
    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }
    
    // Encontrar la materia en el aula
    const asignacion = aula.asignaciones.find(a => a.materia.id === materiaId);
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Materia no encontrada en el aula'
      }, { status: 404 });
    }
    
    // Encontrar la actividad
    const actividad = asignacion.actividades.find(a => a._id.toString() === actividadId);
    if (!actividad) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Encontrar y eliminar la calificación
    const calificacionIndex = actividad.calificaciones.findIndex(c => c._id.toString() === calificacionId);
    if (calificacionIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Calificación no encontrada'
      }, { status: 404 });
    }
    
    // Eliminar la calificación
    actividad.calificaciones.splice(calificacionIndex, 1);
    
    // Guardar los cambios
    await aula.save();
    
    return NextResponse.json({
      success: true,
      message: 'Calificación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar calificación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar calificación',
      error: error.message
    }, { status: 500 });
  }
}
