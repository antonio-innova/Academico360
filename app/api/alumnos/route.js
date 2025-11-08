import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnection from '../../../database/db';
import Usuario from '../../../database/models/Usuario';
import Asignacion from '../../../database/models/Asignacion';

export async function GET(request) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {

      // Intentar conectar explícitamente
      await dbConnection.connectDB();
    }

    // Obtener el ID del usuario de las cookies o de la URL
    // En Next.js reciente, cookies() es una API dinámica que debe esperarse
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    // Si no hay userId en las cookies, intentar obtenerlo de la URL
    const { searchParams } = new URL(request.url);
    const userIdFromUrl = searchParams.get('userId');
    
    const userIdToFind = userId || userIdFromUrl;
    
    if (!userIdToFind) {
      return NextResponse.json({
        success: false,
        message: 'No se proporcionó ID de usuario',
      }, { status: 400 });
    }
    
   
    // Buscar el usuario específico por su ID
    const usuario = await Usuario.findOne({ idU: userIdToFind });
    
    if (!usuario) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado',
      }, { status: 404 });
    }
    
    
    // Si el usuario es docente, solo mostrar asignaciones y calificaciones
    if (usuario.tipo === 'docente') {
      
      // Buscar asignaciones donde el profesor es este usuario
      const asignaciones = await Asignacion.find({ profesorId: usuario._id })
        .populate('materiaId', 'codigo nombre descripcion')
        .populate('alumnos', 'nombre apellido idU fechaNacimiento');
      
      return NextResponse.json({
        success: true,
        message: 'Datos de asignaciones y calificaciones cargados correctamente',
        data: [usuario], // Mantener compatibilidad con el código existente
        asignaciones: asignaciones, // Agregar las asignaciones del docente
        esDocente: true // Indicador para el frontend
      }, { status: 200 });
    }
    
    // Para otros tipos de usuario, devolver todos los datos sin restricción
    
    return NextResponse.json({
      success: true,
      message: 'Datos de usuario cargados correctamente',
      data: [usuario], // Devolvemos como array para mantener compatibilidad con el código existente
      esDocente: false // Indicador para el frontend
    }, { status: 200 });

  } catch (error) {
    console.error('Error al cargar datos de usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al cargar datos de usuario',
      error: error.message
    }, { status: 500 });
  }
}
