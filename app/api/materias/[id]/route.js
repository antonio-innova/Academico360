import { NextResponse } from 'next/server';
import dbConnection from '../../../../database/db';
import Materia from '../../../../database/models/Materia';

// GET - Obtener una materia específica por ID
export async function GET(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id } = await params;
    
    // Buscar la materia por ID
    const materia = await Materia.findById(id);
    
    if (!materia) {
      return NextResponse.json({
        success: false,
        message: 'Materia no encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Materia encontrada',
      data: materia
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener materia:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener materia',
      error: error.message
    }, { status: 500 });
  }
}

// PUT - Actualizar una materia existente
export async function PUT(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id } = await params;
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.nombre || !data.codigo) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: nombre y código son obligatorios'
      }, { status: 400 });
    }
    
    // Buscar la materia por ID
    const materia = await Materia.findById(id);
    
    if (!materia) {
      return NextResponse.json({
        success: false,
        message: 'Materia no encontrada'
      }, { status: 404 });
    }
    
    // Actualizar campos
    materia.codigo = data.codigo;
    materia.nombre = data.nombre;
    materia.descripcion = data.descripcion || materia.descripcion;
    
    // Si se proporciona la institución, actualizar el ID de la materia según la institución
    if (data.institucion) {
      // Generar un nuevo ID basado en la institución si es necesario
      if (data.institucion === 'Acacias') {
        // Si ya tiene un ID con prefijo AM, mantenerlo, de lo contrario crear uno nuevo
        if (!materia.idAM || !materia.idAM.startsWith('AM')) {
          materia.idAM = `AM${Date.now()}`;
        }
      } else if (data.institucion === 'IUTCM') {
        // Si ya tiene un ID con prefijo IM, mantenerlo, de lo contrario crear uno nuevo
        if (!materia.idIM || !materia.idIM.startsWith('IM')) {
          materia.idIM = `IM${Date.now()}`;
        }
      }
    }
    
    // Guardar cambios
    await materia.save();
    
    return NextResponse.json({
      success: true,
      message: 'Materia actualizada correctamente',
      data: materia
    }, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar materia:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar materia',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Eliminar una materia
export async function DELETE(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id } = await params;
    
    // Buscar y eliminar la materia
    const materia = await Materia.findByIdAndDelete(id);
    
    if (!materia) {
      return NextResponse.json({
        success: false,
        message: 'Materia no encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Materia eliminada correctamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error al eliminar materia:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar materia',
      error: error.message
    }, { status: 500 });
  }
}
