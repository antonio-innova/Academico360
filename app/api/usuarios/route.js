import { NextResponse } from 'next/server';
import { connectDB } from '../../../database/db';

// GET - Obtener información de usuario
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Por ahora, devolvemos datos estáticos de usuario
    // En el futuro, esto puede venir de una colección de usuarios en la base de datos
    const userData = {
      _id: userId || 'user-123',
      nombre: 'Usuario',
      apellido: 'Sistema',
      email: 'usuario@academico360.com',
      tipo: 'control',
      institucion: 'Academico360',
      fechaCreacion: new Date(),
      estado: 1
    };

    return NextResponse.json({
      success: true,
      message: 'Datos de usuario obtenidos correctamente',
      data: userData
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener datos de usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener datos de usuario',
      error: error.message
    }, { status: 500 });
  }
}

// POST - Crear o actualizar usuario
export async function POST(request) {
  try {
    await connectDB();

    const data = await request.json();

    // Validar campos requeridos
    if (!data.nombre || !data.apellido) {
      return NextResponse.json({
        success: false,
        message: 'Los campos nombre y apellido son requeridos'
      }, { status: 400 });
    }

    // Por ahora, solo devolvemos éxito
    // En el futuro, esto guardará en una colección de usuarios
    return NextResponse.json({
      success: true,
      message: 'Usuario procesado correctamente',
      data: {
        _id: Date.now().toString(),
        ...data,
        fechaCreacion: new Date()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error al procesar usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al procesar usuario',
      error: error.message
    }, { status: 500 });
  }
}
