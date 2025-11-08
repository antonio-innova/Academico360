import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../database/db';
import Aula from '../../../../../../database/models/Aula';

export async function DELETE(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    const { estudiantesIds } = await request.json();

    if (!estudiantesIds || !Array.isArray(estudiantesIds) || estudiantesIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere una lista de IDs de estudiantes para eliminar'
      }, { status: 400 });
    }

    // Obtener el aula
    const aula = await Aula.findById(aulaId);

    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    // Filtrar los estudiantes que no están en la lista de eliminación
    const estudiantesActualizados = aula.alumnos.filter(estudiante => 
      !estudiantesIds.includes(estudiante._id.toString())
    );

    // Actualizar el aula con los estudiantes restantes
    const aulaActualizada = await Aula.findByIdAndUpdate(
      aulaId,
      { alumnos: estudiantesActualizados },
      { new: true }
    );

    if (!aulaActualizada) {
      return NextResponse.json({
        success: false,
        message: 'Error al actualizar el aula'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${estudiantesIds.length} estudiante(s) del aula`,
      data: {
        aula: aulaActualizada,
        estudiantesEliminados: estudiantesIds.length,
        estudiantesRestantes: estudiantesActualizados.length
      }
    });

  } catch (error) {
    console.error('Error al eliminar estudiantes del aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    }, { status: 500 });
  }
}
