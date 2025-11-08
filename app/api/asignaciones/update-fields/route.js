import { NextResponse } from 'next/server';
import dbConnection from '../../../../database/db';
import mongoose from 'mongoose';

// Endpoint para actualizar directamente los campos de una asignación
export async function POST(request) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el ID de la asignación'
      }, { status: 400 });
    }

    // Usar el driver nativo de MongoDB para actualizar directamente
    const db = mongoose.connection.db;
    const asignacionesCollection = db.collection('asignacions');
    
    // Preparar los campos a actualizar
    const updateFields = {};
    
    // Solo actualizar los campos que se proporcionan explícitamente
    if (data.materiaNombre) updateFields.materiaNombre = data.materiaNombre;
    if (data.profesorNombre) updateFields.profesorNombre = data.profesorNombre;
    
    // Actualizar datos de alumnos si se proporcionan
    if (data.alumnos) {
      // Convertir IDs de string a ObjectId si es necesario
      updateFields.alumnos = data.alumnos.map(id => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          return id; // Mantener el ID original si no se puede convertir
        }
      });
    }
    
    if (data.alumnosInfo) updateFields.alumnosInfo = data.alumnosInfo;
    
    // Actualizar datos del profesor si se proporciona
    if (data.profesorId) {
      try {
        updateFields.profesorId = new mongoose.Types.ObjectId(data.profesorId);
      } catch (e) {
        updateFields.profesorId = data.profesorId; // Mantener el ID original si no se puede convertir
      }
    }
    
    // Actualizar datos del periodo
    if (data.periodo !== undefined) updateFields.periodo = data.periodo;
    if (data.periodoId !== undefined) updateFields.periodoId = data.periodoId;
    
    // Actualizar datos adicionales importantes
    if (data.anio !== undefined) updateFields.anio = data.anio;
    if (data.seccion !== undefined) updateFields.seccion = data.seccion;
    if (data.turno !== undefined) updateFields.turno = data.turno;
    
    // Actualizar directamente en la base de datos
    const resultado = await asignacionesCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(data.id) },
      { $set: updateFields }
    );
    
    if (resultado.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se pudo actualizar la asignación'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Campos actualizados correctamente',
      result: resultado
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar campos',
      error: error.message
    }, { status: 500 });
  }
}
