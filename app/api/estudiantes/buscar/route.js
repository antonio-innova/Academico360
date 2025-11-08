'use server'

import { NextResponse } from 'next/server';
import { connectDB } from '../../../../database/db';
import Usuario from '../../../../database/models/Usuario';
import Estudiante from '../../../../database/models/Estudiante';

// GET /api/estudiantes/buscar?cedula=XXXXX
export async function GET(request) {
  try {
    await connectDB();
    
    // Obtener la cédula de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get('cedula');
    
    if (!cedula) {
      return NextResponse.json({
        success: false,
        message: 'La cédula es requerida'
      }, { status: 400 });
    }
    
    // Primero buscar el usuario por cédula
    const usuario = await Usuario.findOne({ 
      idU: cedula,
      tipo: 'alumno'
    }).lean();
    
    if (!usuario) {
      return NextResponse.json({
        success: false,
        message: 'Usuario estudiante no encontrado'
      }, { status: 404 });
    }

    // Ahora buscar el estudiante usando el _id del usuario
    const estudiante = await Estudiante.findOne({
      usuarioId: usuario._id
    }).lean();

    if (!estudiante) {
      return NextResponse.json({
        success: false,
        message: 'Perfil de estudiante no encontrado'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      estudianteId: estudiante._id.toString(),
      estudiante: {
        ...estudiante,
        _id: estudiante._id.toString(),
        usuarioId: usuario._id.toString(),
        cedula: usuario.idU,
        nombre: usuario.nombre,
        apellido: usuario.apellido
      }
    });
    
  } catch (error) {
    console.error('Error al buscar estudiante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al buscar estudiante',
      error: error.message
    }, { status: 500 });
  }
}
