import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnection from '../../../../database/db';

export async function GET() {
  try {
    await dbConnection.connectDB();

    // Obtener el ID del estudiante de las cookies
    const cookieStore = cookies();
    const permisosStr = cookieStore.get('permisos')?.value;
    
    if (!permisosStr) {
      return NextResponse.json({ 
        success: false, 
        message: 'No autorizado' 
      }, { status: 401 });
    }

    const permisos = JSON.parse(permisosStr);
    const idEstudiante = permisos.idA;

    if (!idEstudiante) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de estudiante no encontrado' 
      }, { status: 400 });
    }

    // Buscar calificaciones del estudiante
    const calificaciones = await Calificacion.find({ idA: idEstudiante })
      .populate('materia', 'nombre')
      .sort({ momento: 1 });

    // Formatear las calificaciones para la respuesta
    const calificacionesFormateadas = calificaciones.map(cal => ({
      materia: cal.materia?.nombre || 'Materia no especificada',
      momento: cal.momento,
      valor: cal.valor
    }));

    return NextResponse.json({
      success: true,
      calificaciones: calificacionesFormateadas
    });

  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener calificaciones',
      error: error.message
    }, { status: 500 });
  }
}
