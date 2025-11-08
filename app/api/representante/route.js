import { NextResponse } from 'next/server';
import dbConnection from '../../../database/db';
import Estudiante from '../../../database/models/Estudiante';

export async function POST(request) {
  try {
    await dbConnection.connectDB();

    // Obtener los datos del cuerpo de la solicitud
    const { estudianteId, representante } = await request.json();

    if (!estudianteId) {
      return NextResponse.json({
        success: false,
        message: 'ID de estudiante no proporcionado',
      }, { status: 400 });
    }
    
    // Validar campos obligatorios del representante
    if (!representante || 
        !representante.nombre || 
        !representante.apellido || 
        !representante.cedula || 
        !representante.telefono) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos obligatorios del representante',
      }, { status: 400 });
    }

    // Buscar el estudiante por su ID
    const estudiante = await Estudiante.findById(estudianteId);

    if (!estudiante) {
      return NextResponse.json({
        success: false,
        message: 'Estudiante no encontrado',
      }, { status: 404 });
    }

    // Actualizar los datos del representante
    estudiante.representante = {
      nombre: representante.nombre.trim(),
      apellido: representante.apellido.trim(),
      cedula: representante.cedula.trim(),
      correo: representante.correo ? representante.correo.trim() : '',
      telefono: representante.telefono.trim(),
      parentesco: representante.parentesco || 'Otro'
    };

    // Guardar los cambios
    try {
      await estudiante.save();
    } catch (saveError) {
      console.error('Error al guardar el representante:', saveError);
      return NextResponse.json({
        success: false,
        message: `Error al guardar en la base de datos: ${saveError.message}`,
      }, { status: 500 });
    }

    // Verificar que los datos se hayan guardado correctamente
    const estudianteActualizado = await Estudiante.findById(estudianteId);
    
    if (!estudianteActualizado || !estudianteActualizado.representante) {
      return NextResponse.json({
        success: false,
        message: 'Los datos se guardaron pero no se pudieron verificar',
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Datos del representante actualizados correctamente',
      estudiante: estudianteActualizado
    }, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar datos del representante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar datos del representante',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await dbConnection.connectDB();

    // Obtener el ID del estudiante de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const estudianteId = searchParams.get('estudianteId');

    if (!estudianteId) {
      return NextResponse.json({
        success: false,
        message: 'ID de estudiante no proporcionado',
      }, { status: 400 });
    }

    // Buscar el estudiante por su ID
    const estudiante = await Estudiante.findById(estudianteId);

    if (!estudiante) {
      return NextResponse.json({
        success: false,
        message: 'Estudiante no encontrado',
      }, { status: 404 });
    }

    // Devolver los datos del representante
    return NextResponse.json({
      success: true,
      representante: estudiante.representante || {}
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener datos del representante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener datos del representante',
      error: error.message
    }, { status: 500 });
  }
}
