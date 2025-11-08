'use server'

import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../../../database/db';
import Aula from '../../../../../../../../database/models/Aula';

// GET /api/aulas/[aulaId]/materias/[materiaId]/actividades/[actividadId] - Obtener una actividad específica
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
    const actividad = asignacion.actividades?.find(act => act._id.toString() === actividadId);
    if (!actividad) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      actividad
    });
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener actividad',
      error: error.message
    }, { status: 500 });
  }
}

// PUT /api/aulas/[aulaId]/materias/[materiaId]/actividades/[actividadId] - Actualizar una actividad
export async function PUT(request, { params }) {
  try {
    await dbConnection.connectDB();
    
    const { aulaId, materiaId, actividadId } = await params;
    const datosActualizados = await request.json();
    
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
    const actividadIndex = asignacion.actividades?.findIndex(act => act._id.toString() === actividadId);
    if (actividadIndex === -1 || actividadIndex === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Actualizar la actividad
    asignacion.actividades[actividadIndex] = {
      ...asignacion.actividades[actividadIndex].toObject(),
      ...datosActualizados,
      _id: asignacion.actividades[actividadIndex]._id // Mantener el mismo ID
    };
    
    // Guardar los cambios
    await aula.save();
    
    return NextResponse.json({
      success: true,
      message: 'Actividad actualizada correctamente',
      actividad: asignacion.actividades[actividadIndex]
    });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar actividad',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE /api/aulas/[aulaId]/materias/[materiaId]/actividades/[actividadId] - Eliminar una actividad
export async function DELETE(request, { params }) {
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
    const actividadIndex = asignacion.actividades?.findIndex(act => act._id.toString() === actividadId);
    if (actividadIndex === -1 || actividadIndex === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Eliminar la actividad
    asignacion.actividades.splice(actividadIndex, 1);
    
    // Guardar los cambios
    await aula.save();
    
    return NextResponse.json({
      success: true,
      message: 'Actividad eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar actividad',
      error: error.message
    }, { status: 500 });
  }
}