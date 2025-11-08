import { NextResponse } from 'next/server';
import dbConnection from '../../../../database/db';
import Profesor from '../../../../database/models/Profesor';

// POST - Actualizar el estado de todos los profesores que no lo tienen
export async function POST(request) {
  try {
    await dbConnection.connectDB();

    // Buscar todos los profesores
    const todosLosProfesores = await Profesor.find({});

    // Actualizar cada profesor para asegurarse de que tenga el campo estado
    const profesoresActualizados = [];
    for (const profesor of todosLosProfesores) {
      // Si no tiene estado, asignarle uno
      if (profesor.estado === undefined) {
        profesor.estado = 1; // Por defecto, todos los profesores están activos
      }
      
      // Asegurarse de que el campo estado esté explicitamente en el documento
      profesor.markModified('estado');
      await profesor.save();
      
      profesoresActualizados.push({
        id: profesor._id,
        nombre: profesor.nombre,
        apellido: profesor.apellido,
        estado: profesor.estado
      });
    }

    return NextResponse.json({
      success: true,
      message: `${profesoresActualizados.length} profesores actualizados correctamente`,
      data: profesoresActualizados
    }, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar profesores:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar profesores',
      error: error.message
    }, { status: 500 });
  }
}
