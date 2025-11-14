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

    const { estudianteId, materiasAsignadas } = await request.json();

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

    // Preparar el objeto del alumno con sus materias asignadas
    const nuevoAlumno = {
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      _id: estudiante._id.toString(),
      cedula: estudiante.idU || estudiante.cedula || '',
      idU: estudiante.idU || estudiante.cedula || '',
      // SIEMPRE agregar materias asignadas (incluso si está vacío)
      materiasAsignadas: (materiasAsignadas && Array.isArray(materiasAsignadas) && materiasAsignadas.length > 0) 
        ? materiasAsignadas 
        : []
    };

    console.log('📝 Guardando estudiante con materias asignadas:', {
      nombre: nuevoAlumno.nombre,
      apellido: nuevoAlumno.apellido,
      _id: nuevoAlumno._id,
      materiasAsignadas: nuevoAlumno.materiasAsignadas,
      cantidad: nuevoAlumno.materiasAsignadas.length
    });

    // Verificar si el estudiante ya existe en el aula
    const alumnosActuales = aula.alumnos || [];
    const estudianteExistente = alumnosActuales.find(al => {
      // Buscar por _id (puede ser string o ObjectId)
      const alId = al._id ? (typeof al._id === 'string' ? al._id : al._id.toString()) : null;
      const nuevoId = nuevoAlumno._id;
      
      if (alId === nuevoId) return true;
      
      // También buscar por nombre y apellido (case insensitive)
      const nombreMatch = (al.nombre || '').trim().toLowerCase() === nuevoAlumno.nombre.trim().toLowerCase();
      const apellidoMatch = (al.apellido || '').trim().toLowerCase() === nuevoAlumno.apellido.trim().toLowerCase();
      
      return nombreMatch && apellidoMatch;
    });

    if (estudianteExistente) {
      console.log('🔄 Estudiante ya existe, actualizando materias asignadas...');
      
      // Si ya existe, actualizar sus materias asignadas usando el índice del array
      const indiceEstudiante = alumnosActuales.findIndex(al => {
        const alId = al._id ? (typeof al._id === 'string' ? al._id : al._id.toString()) : null;
        return alId === nuevoAlumno._id || 
               ((al.nombre || '').trim().toLowerCase() === nuevoAlumno.nombre.trim().toLowerCase() &&
                (al.apellido || '').trim().toLowerCase() === nuevoAlumno.apellido.trim().toLowerCase());
      });

      if (indiceEstudiante >= 0) {
        // Actualizar usando el índice
        const updateResult = await Aula.updateOne(
          { _id: aulaId },
          {
            $set: {
              [`alumnos.${indiceEstudiante}.materiasAsignadas`]: nuevoAlumno.materiasAsignadas
            }
          }
        );
        
        console.log('✅ Resultado de actualización:', {
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount
        });
      } else {
        console.log('⚠️ No se encontró el índice del estudiante, intentando método alternativo...');
        // Método alternativo: actualizar todo el array
        const alumnosActualizados = alumnosActuales.map(al => {
          const alId = al._id ? (typeof al._id === 'string' ? al._id : al._id.toString()) : null;
          const nombreMatch = (al.nombre || '').trim().toLowerCase() === nuevoAlumno.nombre.trim().toLowerCase();
          const apellidoMatch = (al.apellido || '').trim().toLowerCase() === nuevoAlumno.apellido.trim().toLowerCase();
          
          if (alId === nuevoAlumno._id || (nombreMatch && apellidoMatch)) {
            return {
              ...al,
              materiasAsignadas: nuevoAlumno.materiasAsignadas
            };
          }
          return al;
        });
        
        await Aula.updateOne(
          { _id: aulaId },
          {
            $set: {
              alumnos: alumnosActualizados
            }
          }
        );
        
        console.log('✅ Actualizado usando método alternativo');
      }
    } else {
      console.log('➕ Estudiante no existe, agregando nuevo...');
      // Si no existe, agregarlo con $push
      const pushResult = await Aula.updateOne(
        { _id: aulaId },
        {
          $push: {
            alumnos: nuevoAlumno
          }
        }
      );
      
      console.log('✅ Resultado de inserción:', {
        matchedCount: pushResult.matchedCount,
        modifiedCount: pushResult.modifiedCount
      });
    }

    // Obtener versión actualizada
    const aulaActualizada = await Aula.findById(aulaId);


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
