import { NextResponse } from 'next/server';
import dbConnection from '../../../database/db';
import Profesor from '../../../database/models/Profesor';

// GET - Obtener todos los profesores
export async function GET(request) {
  try {
    await dbConnection.connectDB();
    
    // Buscar todos los profesores en la base de datos sin filtros
    // Proyectar explícitamente el campo estado
    const profesores = await Profesor.find({}).select('+estado');
    
    // Verificar si algún profesor no tiene el campo estado y asignarlo
    for (const profesor of profesores) {
      if (profesor.estado === undefined) {
        profesor.estado = 1; // Por defecto, todos los profesores están activos
        await profesor.save();
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profesores obtenidos correctamente',
      data: profesores
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener profesores:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener profesores',
      error: error.message
    }, { status: 500 });
  }
}

// POST - Crear un nuevo profesor
export async function POST(request) {
  try {
    await dbConnection.connectDB();

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // FORZAR el campo estado como número
    if (data.estado !== undefined) {
      data.estado = Number(data.estado);
      if (isNaN(data.estado)) {
        data.estado = 1; // Valor por defecto si no es un número válido
      }
    } else {
      data.estado = 1; // Valor por defecto si no se proporciona
    }
    
    // Validar datos requeridos
    if (!data.nombre || !data.apellido) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: nombre y apellido son obligatorios'
      }, { status: 400 });
    }

    // Verificar si el usuario existe
    if (!data.userId) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el ID del usuario que crea el profesor'
      }, { status: 400 });
    }

    // Procesar la fecha de ingreso si existe
    let fechaIngreso = null;
    if (data.fechaIngreso) {
      try {
        // Usar la fecha exactamente como se proporciona, pero asegurarse de que incluya la hora
        const fechaStr = data.fechaIngreso;
        
        // Verificar si la fecha ya incluye la hora
        if (fechaStr.includes('T') || fechaStr.includes(' ')) {
          // La fecha ya incluye la hora, usarla tal cual
          fechaIngreso = new Date(fechaStr);
        } else {
          // La fecha no incluye la hora, agregar la hora (mediodía)
          fechaIngreso = new Date(`${fechaStr}T12:00:00.000Z`);
        }
      } catch (error) {
        console.error('Error al procesar la fecha de ingreso:', error);
      }
    }

    // Crear el profesor directamente con todos los campos necesarios
    const profesor = {
      idU: data.cedula || 'N/P',
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email || '',
      telefono: data.telefono || '',
      especialidad: data.especialidad || '',
      fechaIngreso: fechaIngreso,
      creadoPor: data.userId,
      tipoCreador: data.userType || 'control',
      estado: Number(data.estado || 1) // Asegurarse de incluir el estado (1=activo, 0=bloqueado)
    };
    
    // Asignar IDs dinámicos según el tipo de usuario y la institución
    if (data.userType === 'control' || data.userType === 'admin') {
      // Verificar la institución para asignar el prefijo correcto
      if (data.institucion === 'Acacias') {
        profesor.idAP = `AP${Date.now()}`;
      } else if (data.institucion === 'IUTCM') {
        profesor.idIP = `IP${Date.now()}`;
      } else {
        // Valor por defecto si no se especifica la institución
        profesor.idAP = `AP${Date.now()}`;
      }
    }
    
    try {
      // Verificar que el campo estado sea un número
      if (profesor.estado === undefined || profesor.estado === null) {
        profesor.estado = 1; // Valor por defecto
      } else {
        profesor.estado = Number(profesor.estado);
        if (isNaN(profesor.estado)) {
          profesor.estado = 1; // Valor por defecto si no es un número válido
        }
      }
      
      // Crear el profesor usando el método create de Mongoose
      const nuevoProfesor = await Profesor.create(profesor);
      
      // Asegurarse de que el campo estado se haya guardado correctamente
      nuevoProfesor.set('estado', Number(profesor.estado));
      
      // Forzar la asignación directa también
      nuevoProfesor.estado = Number(profesor.estado);
      
      // Guardar el profesor en la base de datos
      const profesorGuardado = await nuevoProfesor.save();
      
      return NextResponse.json({
        success: true,
        message: 'Profesor creado correctamente',
        data: profesorGuardado
      }, { status: 201 });
    } catch (saveError) {
      console.error('Error al guardar profesor en la base de datos:', saveError);
      return NextResponse.json({
        success: false,
        message: 'Error al guardar profesor en la base de datos',
        error: saveError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error al crear profesor:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear profesor',
      error: error.message
    }, { status: 500 });
  }
}
