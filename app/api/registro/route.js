import { NextResponse } from 'next/server';
import dbConnection from '../../../database/db';
import Usuario from '../../../database/models/Usuario';
import Estudiante from '../../../database/models/Estudiante';
import Profesor from '../../../database/models/Profesor';

// Función para normalizar IDs
function normalizarId(id) {
  if (!id) return '';
  // Eliminar espacios
  id = id.trim();
  // Eliminar ceros al inicio
  id = id.replace(/^0+/, '');
  // Convertir a mayúsculas
  id = id.toUpperCase();
  return id;
}

export async function POST(request) {
  try {
    await dbConnection.connectDB();

    const data = await request.json();
    
    // Extraer y normalizar datos del cuerpo de la solicitud
    const { 
      'login-type': tipo, 
      idregistro: idUOriginal, 
      idnombre: nombre, 
      idapellido: apellido, 
      passregistro: password,
      institucion,
      idI,
      idA,
      estudianteId
    } = data;
    
    // Normalizar el ID
    const idU = normalizarId(idUOriginal);
    
    // Validar que todos los campos requeridos estén presentes
    if (!tipo || !idU || !nombre || !apellido || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Todos los campos son requeridos' 
      }, { status: 400 });
    }
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({
      $or: [
        { idU: idU },
        // Verificar también por combinación de nombre, apellido y tipo
        {
          nombre: { $regex: new RegExp(`^${nombre}$`, 'i') },
          apellido: { $regex: new RegExp(`^${apellido}$`, 'i') },
          tipo: tipo
        }
      ]
    });
    
    if (usuarioExistente) {
      return NextResponse.json({ 
        success: false, 
        message: 'Ya existe un usuario registrado con estos datos' 
      }, { status: 409 });
    }
    
    // Si es un alumno, verificar si existe en la colección de estudiantes
    if (tipo === 'alumno') {
      const estudianteExistente = await Estudiante.findOne({
        $or: [
          { idU: idU },
          { idU: idUOriginal }
        ]
      });

      if (!estudianteExistente) {
        return NextResponse.json({
          success: false,
          message: 'No se encontró un estudiante registrado con este identificador'
        }, { status: 404 });
      }
      
      // Crear nuevo usuario con los datos del estudiante
      const nuevoUsuario = new Usuario({
        tipo: 'alumno',
        idU: estudianteExistente.idU,
        password,
        nombre: estudianteExistente.nombre,
        apellido: estudianteExistente.apellido,
        idA: estudianteExistente.idU,
        idI: null,
        institucion: 'acacias',
        estudianteId: estudianteExistente._id
      });

      try {
        const usuarioGuardado = await nuevoUsuario.save();

        // Actualizar el estudiante para vincularlo con este usuario
        await Estudiante.findByIdAndUpdate(estudianteExistente._id, { 
          usuarioId: usuarioGuardado._id,
          registrado: true
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Usuario registrado exitosamente y vinculado con perfil de estudiante',
          usuario: {
            id: usuarioGuardado.idU,
            tipo: usuarioGuardado.tipo,
            nombre: usuarioGuardado.nombre,
            apellido: usuarioGuardado.apellido,
            estudianteId: usuarioGuardado.estudianteId
          }
        }, { status: 201 });
      } catch (error) {
        console.error('Error al guardar usuario alumno:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'Error al registrar el usuario',
          error: error.message
        }, { status: 500 });
      }
    }

    // Si es un profesor, verificar si ya existe en la base de datos de profesores
    let profesorId = null;
    let profesorExistente = null;
    
    if (tipo === 'docente') {
      profesorExistente = await Profesor.findOne({
        $or: [
          { idU: idU },
          { idU: idUOriginal }
        ]
      });

      if (profesorExistente) {
        profesorId = profesorExistente._id;
      } else {
        // Crear un nuevo profesor
        const nuevoProfesor = new Profesor({
          idU: idU,
          nombre,
          apellido,
          estado: 1
        });

        try {
          const profesorGuardado = await nuevoProfesor.save();
          profesorId = profesorGuardado._id;
        } catch (error) {
          console.error('Error al crear perfil de profesor:', error);
          return NextResponse.json({
            success: false,
            message: 'Error al crear perfil de profesor',
            error: error.message
          }, { status: 500 });
        }
      }
    }

    // Crear el nuevo usuario
    const nuevoUsuario = new Usuario({
      tipo,
      idU: idU,
      password,
      nombre,
      apellido,
      idI: institucion === 'iutcm' ? idI : null,
      idA: institucion === 'acacias' ? idA : null,
      institucion: institucion || 'acacias',
      profesorId
    });

    try {
      const usuarioGuardado = await nuevoUsuario.save();

      // Si es un profesor, actualizar la referencia al usuario
      if (tipo === 'docente' && profesorId) {
        await Profesor.findByIdAndUpdate(profesorId, {
          usuarioId: usuarioGuardado._id,
          registrado: true
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario registrado exitosamente',
        usuario: {
          id: usuarioGuardado.idU,
          tipo: usuarioGuardado.tipo,
          nombre: usuarioGuardado.nombre,
          apellido: usuarioGuardado.apellido,
          profesorId: usuarioGuardado.profesorId
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Error al guardar usuario:', error);
      return NextResponse.json({
        success: false,
        message: 'Error al registrar el usuario',
        error: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error en el proceso de registro:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en el proceso de registro',
      error: error.message
    }, { status: 500 });
  }
}
