'use server'

import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../../../../database/db';
import Aula from '../../../../../../../../../database/models/Aula';
import mongoose from 'mongoose';

// POST /api/aulas/[aulaId]/materias/[materiaId]/actividades/[actividadId]/calificaciones - Agregar una calificación
export async function POST(request, { params }) {
  try {
    await dbConnection.connectDB();
    
    const { aulaId, materiaId, actividadId } = await params;
    
    // Obtener los datos JSON del request
    const data = await request.json();
    
    // Preparar datos seguros
    const tipoCalificacion = data.tipoCalificacion || (data.notaAlfabetica ? 'alfabetica' : 'numerica');
    const calificacion = {
      alumnoId: data.alumnoId,
      nota: data.nota !== undefined && data.nota !== null ? Number(data.nota) : undefined,
      notaAlfabetica: data.notaAlfabetica,
      tipoCalificacion,
      observaciones: data.observaciones || '',
      evidencia: data.evidencia || '',
      fechaCreacion: new Date()
    };

    // Intentar ACTUALIZAR si ya existe calificación del alumno
    const actObjectId = new mongoose.Types.ObjectId(actividadId);
    const updateExisting = await Aula.updateOne(
      { _id: aulaId },
      {
        $set: {
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].nota': calificacion.nota,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].notaAlfabetica': calificacion.notaAlfabetica,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].tipoCalificacion': calificacion.tipoCalificacion,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].observaciones': calificacion.observaciones,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].evidencia': calificacion.evidencia,
          'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].fechaModificacion': new Date()
        }
      },
      {
        arrayFilters: [
          { 'asig.materia.id': materiaId },
          { 'act._id': actObjectId },
          { 'cal.alumnoId': calificacion.alumnoId }
        ]
      }
    );

    if (updateExisting.modifiedCount === 0) {
      // No existía: PUSH atómico de nueva calificación
      const pushResult = await Aula.updateOne(
        { _id: aulaId },
        {
          $push: {
            'asignaciones.$[asig].actividades.$[act].calificaciones': calificacion
          }
        },
        {
          arrayFilters: [
            { 'asig.materia.id': materiaId },
            { 'act._id': actObjectId }
          ]
        }
      );

      if (pushResult.matchedCount === 0) {
        return NextResponse.json({ success: false, message: 'Aula/Materia/Actividad no encontrada' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, message: 'Calificación guardada correctamente' });
  } catch (error) {
    console.error('Error al agregar calificación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al agregar calificación',
      error: error.message
    }, { status: 500 });
  }
}

// GET /api/aulas/[aulaId]/materias/[materiaId]/actividades/[actividadId]/calificaciones - Obtener calificaciones
export async function GET(request, { params }) {
  try {
    await dbConnection.connectDB();
    
    const { aulaId, materiaId, actividadId } = await params;
    
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
    
    return NextResponse.json({
      success: true,
      calificaciones: actividad.calificaciones || []
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
