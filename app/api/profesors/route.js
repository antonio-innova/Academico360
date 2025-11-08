import { NextResponse } from 'next/server';
import { connectDB } from '../../../database/db';
import Profesor from '../../../database/models/Profesor';

// GET - Obtener todos los profesores
export async function GET(request) {
  try {
    await connectDB();

    // Buscar profesores en la base de datos
    const profesores = await Profesor.find({ estado: 1 }).lean();

    // Verificar que los profesores tengan nombre y apellido
    const profesoresFormateados = profesores.map(prof => ({
      _id: prof._id.toString(),
      nombre: prof.nombre || '',
      apellido: prof.apellido || ''
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Profesores obtenidos correctamente',
      data: profesoresFormateados
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener profesores:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener profesores',
      error: error.message
    }, { status: 500 });
  }
}
