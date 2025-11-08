'use server'

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnection from '../../../../database/db';
import Aula from '../../../../database/models/Aula';
import Profesor from '../../../../database/models/Profesor';

// GET /api/aulas/[aulaId] - Obtener un aula específica con sus materias y alumnos
export async function GET(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    // Validar que aulaId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(aulaId)) {
      return NextResponse.json({
        success: false,
        message: 'ID de aula inválido'
      }, { status: 400 });
    }

    // Buscar el aula por su ID y popular las calificaciones
    const aula = await Aula.findById(aulaId).exec();

    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    // Asegurarnos de que el aula tenga la estructura correcta
    const aulaData = {
      ...aula.toObject(),
      asignaciones: aula.asignaciones || []
    };

    return NextResponse.json({
      success: true,
      data: aulaData
    });

  } catch (error) {
    console.error('Error al obtener el aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el aula',
      error: error.message
    }, { status: 500 });
  }
}

// PUT /api/aulas/[aulaId] - Actualizar un aula específica
export async function PUT(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    // Validar que aulaId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(aulaId)) {
      return NextResponse.json({
        success: false,
        message: 'ID de aula inválido'
      }, { status: 400 });
    }

    const data = await request.json();

    // Buscar el aula
    const aula = await Aula.findById(aulaId);
    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    // Actualizar los campos proporcionados
    const updateData = {};
    
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.anio !== undefined) updateData.anio = data.anio;
    if (data.seccion !== undefined) updateData.seccion = data.seccion;
    if (data.turno !== undefined) updateData.turno = data.turno;
    if (data.periodo !== undefined) updateData.periodo = data.periodo;
    if (data.alumnos !== undefined) updateData.alumnos = data.alumnos;
    if (data.asignaciones !== undefined) updateData.asignaciones = data.asignaciones;
    if (data.estado !== undefined) updateData.estado = data.estado;

    // Actualizar el aula
    const aulaActualizada = await Aula.findByIdAndUpdate(
      aulaId,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Aula actualizada correctamente',
      data: aulaActualizada
    });

  } catch (error) {
    console.error('Error al actualizar el aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el aula',
      error: error.message
    }, { status: 500 });
  }
}
