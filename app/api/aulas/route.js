import { NextResponse } from 'next/server';
import { connectDB } from '../../../database/db';
import { ObjectId } from 'mongodb';
import Aula from '../../../database/models/Aula';
import Estudiante from '../../../database/models/Estudiante';
import Profesor from '../../../database/models/Profesor';

// GET /api/aulas - Obtener todas las aulas
export async function GET(request) {
  try {
    await connectDB();

    // Obtener todas las aulas activas
    const aulas = await Aula.find({ estado: 1 })
      .sort({ nombre: 1, anio: 1, seccion: 1 });

    return NextResponse.json({
      success: true,
      message: 'Aulas obtenidas correctamente',
      data: aulas || []
    });

  } catch (error) {
    console.error('Error al obtener aulas:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener aulas',
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/aulas - Crear una nueva aula y sus asignaciones
export async function POST(request) {
  try {
    await connectDB();

    const data = await request.json();

    // Validar campos requeridos
    const camposRequeridos = ['nombre', 'anio', 'seccion', 'turno', 'periodo', 'alumnos', 'asignaciones', 'creadoPor', 'tipoCreador'];
    for (const campo of camposRequeridos) {
      if (!data[campo]) {
        return NextResponse.json({
          success: false,
          message: `El campo ${campo} es requerido`
        }, { status: 400 });
      }
    }

    // Validar que las asignaciones tengan profesores
    for (const asignacion of data.asignaciones) {
      if (!asignacion.profesor || !asignacion.profesor.nombre || !asignacion.profesor.apellido) {
        return NextResponse.json({
          success: false,
          message: `La materia ${asignacion.materia.nombre} debe tener un profesor asignado con nombre y apellido`
        }, { status: 400 });
      }
    }
    
    const aulaData = {
      nombre: data.nombre,
      anio: data.anio,
      seccion: data.seccion,
      turno: data.turno,
      periodo: data.periodo,
      alumnos: data.alumnos,
      asignaciones: data.asignaciones.map(asig => ({
        materia: {
          id: asig.materia.id,
          nombre: asig.materia.nombre,
          codigo: asig.materia.codigo
        },
        profesor: asig.profesor,
        actividades: []
      })),
      creadoPor: data.creadoPor,
      tipoCreador: data.tipoCreador,
      estado: 1
    };
    
    const nuevaAula = new Aula(aulaData);
    await nuevaAula.save();

    return NextResponse.json({
      success: true,
      message: 'Aula creada correctamente',
      data: nuevaAula
    });

  } catch (error) {
    console.error('Error al crear aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear aula',
      error: error.message
    }, { status: 500 });
  }
}

// PUT /api/aulas/[id] - Actualizar un aula
export async function PUT(request) {
  try {
    await connectDB();

    const data = await request.json();
    const aulaId = data._id;

    delete data._id; // Eliminar el _id del objeto de actualización
    
    const result = await Aula.findByIdAndUpdate(aulaId, data, { new: true });

    if (!result) {
      return NextResponse.json(
        { error: 'Aula no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Aula actualizada con éxito'
    });
  } catch (error) {
    console.error('Error al actualizar aula:', error);
    return NextResponse.json(
      { error: 'Error al actualizar aula' },
      { status: 500 }
    );
  }
}

// DELETE /api/aulas/[id] - Eliminar un aula y sus asignaciones
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const result = await Aula.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Aula no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Aula eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar aula',
      error: error.message
    }, { status: 500 });
  }
}
