import { NextResponse } from 'next/server';
import { connectDB } from '../../../database/db';

// GET - Obtener información de períodos
export async function GET(request) {
  try {
    await connectDB();

    // Por ahora, devolvemos datos estáticos de períodos
    // En el futuro, esto puede venir de una colección de períodos en la base de datos
    const periodos = [
      {
        _id: '2024-1',
        nombre: '2024-1',
        fechaInicio: '2024-01-15',
        fechaFin: '2024-06-30',
        activo: true
      },
      {
        _id: '2024-2',
        nombre: '2024-2',
        fechaInicio: '2024-07-15',
        fechaFin: '2024-12-15',
        activo: false
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'Períodos obtenidos correctamente',
      data: periodos
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener períodos:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener períodos',
      error: error.message
    }, { status: 500 });
  }
}

// POST - Crear un nuevo período
export async function POST(request) {
  try {
    await connectDB();

    const data = await request.json();

    // Validar campos requeridos
    if (!data.nombre || !data.fechaInicio || !data.fechaFin) {
      return NextResponse.json({
        success: false,
        message: 'Los campos nombre, fechaInicio y fechaFin son requeridos'
      }, { status: 400 });
    }

    // Por ahora, solo devolvemos éxito
    // En el futuro, esto guardará en una colección de períodos
    return NextResponse.json({
      success: true,
      message: 'Período creado correctamente',
      data: {
        _id: Date.now().toString(),
        ...data,
        fechaCreacion: new Date()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear período:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear período',
      error: error.message
    }, { status: 500 });
  }
}
