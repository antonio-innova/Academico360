import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import dbConnection from '../../../../../database/db';

export async function POST(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    // Obtener los parámetros de forma asíncrona
    const { id } = params;
    const { momento, bloqueado } = await request.json();
    
    // Validar los datos recibidos
    if (momento === undefined || bloqueado === undefined) {
      return NextResponse.json(
        { success: false, message: 'Se requiere el momento y el estado de bloqueo' },
        { status: 400 }
      );
    }
    
    // Validar que el momento sea un número entre 1 y 3
    if (![1, 2, 3].includes(Number(momento))) {
      return NextResponse.json(
        { success: false, message: 'El momento debe ser 1, 2 o 3' },
        { status: 400 }
      );
    }
    
    // Validar que el ID de la asignación sea válido
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de asignación no válido' },
        { status: 400 }
      );
    }
    
    // Preparar el objeto de actualización
    const updateField = {};
    updateField[`momentosBloqueados.${momento}`] = bloqueado;
    
    // Actualizar la asignación en la base de datos usando Mongoose
    const result = await mongoose.connection.db.collection('asignaciones').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateField }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No se encontró la asignación' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Momento ${momento} ${bloqueado ? 'bloqueado' : 'desbloqueado'} correctamente`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error al actualizar el estado de bloqueo del momento' },
      { status: 500 }
    );
  }
}
