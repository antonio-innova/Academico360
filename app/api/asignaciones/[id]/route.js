import { NextResponse } from 'next/server';
import dbConnection from '../../../../database/db';
import Asignacion from '../../../../database/models/Asignacion';
import Estudiante from '../../../../database/models/Estudiante';
import Aula from '../../../../database/models/Aula';

// GET - Obtener una asignación específica por ID
export async function GET(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const { id } = await params;
    
    // Buscar la asignación por ID
    const asignacion = await Asignacion.findById(id)
      .populate('materiaId', 'codigo nombre descripcion')
      .populate('profesorId', 'nombre apellido email telefono especialidad')
      .populate('alumnos', 'nombre apellido idU');
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    // Obtener los datos actualizados de los estudiantes directamente de la colección de estudiantes
    if (asignacion.alumnosInfo && Array.isArray(asignacion.alumnosInfo)) {
      // Obtener los nombres de los estudiantes en alumnosInfo
      const nombresEstudiantes = asignacion.alumnosInfo.map(alumno => alumno.nombre);
      
      // Buscar los estudiantes por nombre para obtener sus IDs actualizados
      const estudiantes = await Promise.all(
        nombresEstudiantes.map(async (nombre) => {
          try {
            // Buscar el estudiante por nombre
            const estudiante = await Estudiante.findOne({ nombre: nombre });
            return estudiante ? {
              nombre: estudiante.nombre,
              id: estudiante._id.toString(),
              idU: estudiante.idU // ID/cédula actualizado desde la colección de estudiantes
            } : null;
          } catch (err) {
            return null;
          }
        })
      );
      
      // Filtrar estudiantes no encontrados
      const estudiantesEncontrados = estudiantes.filter(est => est !== null);
      
      // Actualizar alumnosInfo con los datos actualizados
      const alumnosInfoActualizada = asignacion.alumnosInfo.map(alumnoInfo => {
        const estudianteActualizado = estudiantesEncontrados.find(est => est.nombre === alumnoInfo.nombre);
        
        if (estudianteActualizado) {
          // Actualizar con los datos más recientes
          return {
            ...alumnoInfo.toObject(),
            idU: estudianteActualizado.idU, // Usar el ID/cédula actualizado
            id: estudianteActualizado.id // Usar el ID de MongoDB actualizado
          };
        }
        
        return alumnoInfo;
      });
      
      // Reemplazar alumnosInfo con la versión actualizada
      asignacion._doc.alumnosInfo = alumnosInfoActualizada;
    }
    
    // Buscar si hay puntos extras para esta asignación
    try {
      // Buscar el aula asociada a esta asignación para obtener los puntos extras
      const aula = await Aula.findOne({ 'asignaciones.materia.id': asignacion.materiaId._id.toString() });
      
      if (aula) {
        // Encontrar la asignación específica dentro del aula
        const asignacionEnAula = aula.asignaciones.find(
          a => a.materia.id === asignacion.materiaId._id.toString()
        );
        
        if (asignacionEnAula && asignacionEnAula.puntosExtras) {
          asignacion._doc.puntosExtras = asignacionEnAula.puntosExtras;
        } else {
          asignacion._doc.puntosExtras = [];
        }
      }
    } catch (error) {
      asignacion._doc.puntosExtras = [];
    }
    
    return NextResponse.json({
      success: true,
      message: 'Asignación encontrada',
      data: asignacion
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al obtener asignación',
      error: error.message
    }, { status: 500 });
  }
}

// PUT - Actualizar una asignación existente (agregar/eliminar alumnos)
export async function PUT(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const { id } = await params;
    const data = await request.json();
    
    // Verificar si la asignación existe
    const asignacionExiste = await Asignacion.findById(id);
    if (!asignacionExiste) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    // Preparar los datos para actualizar
    const updateData = {};
    
    // Campos básicos
    if (data.materiaId) updateData.materiaId = data.materiaId;
    if (data.materiaNombre) updateData.materiaNombre = data.materiaNombre;
    if (data.profesorId) updateData.profesorId = data.profesorId;
    if (data.profesorNombre) updateData.profesorNombre = data.profesorNombre;
    
    // Asegurar que el campo periodo siempre se actualice, incluso si es una cadena vacía
    updateData.periodo = data.periodo || '';
    
    // Procesar alumnos
    if (data.alumnos) {
      // Verificar si los alumnos existen
      if (data.alumnos.length > 0) {
        const alumnosExistentes = await Estudiante.countDocuments({
          _id: { $in: data.alumnos }
        });
        
        if (alumnosExistentes !== data.alumnos.length) {
          return NextResponse.json({
            success: false,
            message: 'Uno o más alumnos especificados no existen'
          }, { status: 404 });
        }
      }
      
      updateData.alumnos = data.alumnos;
      
      // Procesar alumnosInfo
      if (data.alumnosInfo && Array.isArray(data.alumnosInfo)) {
        updateData.alumnosInfo = data.alumnosInfo;
      } else {
        // Obtener información de alumnos
        const alumnosInfo = await Estudiante.find({
          _id: { $in: data.alumnos }
        }).select('_id nombre idU cedula');
        
        updateData.alumnosInfo = alumnosInfo.map(alumno => ({
          id: alumno._id,
          nombre: alumno.nombre || 'Sin nombre',
          idU: alumno.cedula || alumno.idU || 'N/P',
          cedula: alumno.cedula || alumno.idU || 'N/A'
        }));
      }
    } else if (data.alumnosInfo) {
      updateData.alumnosInfo = data.alumnosInfo;
    }
    
    // Usar findByIdAndUpdate para asegurar que todos los campos se actualicen correctamente
    // y que podamos obtener el documento actualizado
    const resultado = await Asignacion.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!resultado) {
      return NextResponse.json({
        success: false,
        message: 'No se pudo actualizar la asignación'
      }, { status: 400 });
    }
    
    // Obtener la asignación actualizada con todos los datos populados
    const asignacionActualizada = await Asignacion.findById(id)
      .populate('materiaId', 'codigo nombre descripcion')
      .populate('profesorId', 'nombre apellido email telefono especialidad')
      .populate('alumnos', 'nombre apellido idU');
    
    return NextResponse.json({
      success: true,
      message: 'Asignación actualizada correctamente',
      data: asignacionActualizada
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar asignación',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Eliminar una asignación
export async function DELETE(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const { id } = await params;
    
    // Verificar si el ID es válido
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({
        success: false,
        message: 'ID de asignación inválido'
      }, { status: 400 });
    }
    
    // Intentar convertir a ObjectId si es necesario
    let objectId;
    try {
      const mongoose = require('mongoose');
      objectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      return NextResponse.json({
        success: false,
        message: 'ID de asignación con formato inválido',
        error: err.message
      }, { status: 400 });
    }
    
    // Buscar y eliminar la asignación
    const resultado = await Asignacion.findByIdAndDelete(objectId);
    
    if (!resultado) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Asignación eliminada correctamente'
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar asignación: ' + error.message,
      error: error.message
    }, { status: 500 });
  }
}
