'use server'

import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../../database/db';
import Aula from '../../../../../../../database/models/Aula';
import mongoose from 'mongoose';

// POST /api/aulas/[aulaId]/materias/[materiaId]/actividades - Agregar una nueva actividad
export async function POST(request, { params }) {
  try {
    await dbConnection.connectDB();
    
    const { aulaId, materiaId } = await params;
    const nuevaActividad = await request.json();
    
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
    
    // Agregar la nueva actividad
    nuevaActividad._id = new mongoose.Types.ObjectId();
    if (!asignacion.actividades) {
      asignacion.actividades = [];
    }
    asignacion.actividades.push(nuevaActividad);
    
    // Guardar los cambios
    await aula.save();
    
    return NextResponse.json({
      success: true,
      message: 'Actividad agregada correctamente',
      actividad: nuevaActividad
    });
  } catch (error) {
    console.error('Error al agregar actividad:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al agregar actividad',
      error: error.message
    }, { status: 500 });
  }
}

// GET /api/aulas/[aulaId]/materias/[materiaId]/actividades - Obtener todas las actividades
export async function GET(request, { params }) {
  try {
    await dbConnection.connectDB();
    
    const { aulaId, materiaId } = await params;
    
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
    
    return NextResponse.json({
      success: true,
      actividades: asignacion.actividades || []
    });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener actividades',
      error: error.message
    }, { status: 500 });
  }
}
