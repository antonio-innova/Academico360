import { NextResponse } from 'next/server';
import dbConnection from '../../../../../database/db';
import mongoose from 'mongoose';
import Aula from '../../../../../database/models/Aula';
import Estudiante from '../../../../../database/models/Estudiante';

export async function GET(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    // Obtener el aula usando el modelo
    const aula = await Aula.findById(aulaId);

    if (!aula) {
      return NextResponse.json({
        success: false,
        error: 'Aula no encontrada'
      }, { status: 404 });
    }

    // Verificar si el aula tiene estudiantes o alumnos
    const listaEstudiantes = aula.alumnos || [];

    // Si no hay estudiantes, devolver array vacío
    if (!listaEstudiantes.length) {
      return NextResponse.json({
        success: true,
        estudiantes: []
      });
    }

    return NextResponse.json({
      success: true,
      estudiantes: listaEstudiantes.map(est => ({
        id: est._id.toString(),
        nombre: `${est.nombre} ${est.apellido}`,
        cedula: est.cedula
      }))
    });

  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estudiantes'
    }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({
        success: false,
        message: 'Content-Type debe ser application/json'
      }, { status: 415 });
    }

    const { estudianteId } = await request.json();

    if (!estudianteId) {
      return NextResponse.json({
        success: false,
        message: 'Falta estudianteId en el cuerpo de la solicitud'
      }, { status: 400 });
    }

    // Validar ObjectIds para evitar CastError en producción
    if (!mongoose.Types.ObjectId.isValid(aulaId)) {
      return NextResponse.json({ success: false, message: 'aulaId inválido' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(estudianteId)) {
      return NextResponse.json({ success: false, message: 'estudianteId inválido' }, { status: 400 });
    }

    const aula = await Aula.findById(aulaId);
    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    const estudiante = await Estudiante.findById(estudianteId);
    if (!estudiante) {
      return NextResponse.json({
        success: false,
        message: 'Estudiante no encontrado'
      }, { status: 404 });
    }

    // Evitar duplicados básicos por nombre y apellido
    const yaInscrito = (aula.alumnos || []).some(al => 
      (al.nombre || '').trim().toLowerCase() === estudiante.nombre.trim().toLowerCase() &&
      (al.apellido || '').trim().toLowerCase() === estudiante.apellido.trim().toLowerCase()
    );

    if (yaInscrito) {
      return NextResponse.json({
        success: true,
        message: 'El alumno ya está inscrito en el aula'
      });
    }

    // Intento atómico y eficiente para minimizar condiciones de carrera
    const updateResult = await Aula.updateOne(
      { _id: aulaId },
      {
        $addToSet: {
          alumnos: {
            nombre: estudiante.nombre,
            apellido: estudiante.apellido
          }
        }
      }
    );

    // Obtener versión actualizada solo si realmente cambió
    const aulaActualizada = updateResult.modifiedCount > 0 ? await Aula.findById(aulaId) : aula;

    return NextResponse.json({
      success: true,
      message: 'Alumno inscrito exitosamente',
      data: {
        aula: aulaActualizada
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error al inscribir alumno en el aula:', error);
    const status = error?.name === 'CastError' ? 400 : 500;
    return NextResponse.json({
      success: false,
      message: status === 400 ? 'Identificador inválido' : 'Error interno del servidor',
      error: error.message
    }, { status });
  }
}
