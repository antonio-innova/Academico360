import { NextResponse } from 'next/server';
import dbConnection from '../../../database/db';
import Materia from '../../../database/models/Materia';

// GET - Obtener todas las materias
export async function GET(request) {
  try {
    await dbConnection.connectDB();

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const creadorId = searchParams.get('creadorId');
    const institucion = searchParams.get('institucion');
    
    // Construir el filtro de búsqueda basado en la institución
    let filter = {};
    
    if (institucion === 'IUTCM') {
      // Para IUTCM, buscar materias con idIM
      filter = {
        'idIM': { $exists: true }
      };
    } else if (institucion === 'Acacias' || !institucion) {
      // Para Acacias o si no se especifica institución, buscar materias con idAM
      filter = {
        'idAM': { $exists: true }
      };
    }
    
    // Si se proporciona un userId o creadorId, filtrar por el creador
    if (creadorId) {
      filter.creadoPor = creadorId;
    } else if (userId) {
      filter.creadoPor = userId;
    }
    
    // Buscar materias en la base de datos, incluyendo todos los campos relevantes
    const materias = await Materia.find(filter).select('_id nombre codigo descripcion');
    
    return NextResponse.json({
      success: true,
      message: 'Materias obtenidas correctamente',
      data: materias
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener materias:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener materias',
      error: error.message
    }, { status: 500 });
  }
}

// POST - Crear una nueva materia
export async function POST(request) {
  try {
    await dbConnection.connectDB();

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.nombre || !data.codigo) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: nombre y código son obligatorios'
      }, { status: 400 });
    }

    // Verificar si el usuario existe
    if (!data.userId) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el ID del usuario que crea la materia'
      }, { status: 400 });
    }

    // Crear nueva materia con todos los campos requeridos
    const nuevaMateria = new Materia({
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      creadoPor: data.userId,
      tipoCreador: data.userType || 'control'
    });
    
    // Asignar IDs dinámicos según el tipo de usuario y la institución
    if (data.userType === 'control' || data.userType === 'admin') {
      // Verificar la institución para asignar el prefijo correcto
      if (data.institucion === 'Acacias') {
        nuevaMateria.idAM = `AM${Date.now()}`;
      } else if (data.institucion === 'IUTCM') {
        nuevaMateria.idIM = `IM${Date.now()}`;
      } else {
        // Valor por defecto si no se especifica la institución
        nuevaMateria.idAM = `AM${Date.now()}`;
      }
    }
    
    try {
      // Guardar en la base de datos
      const materiaGuardada = await nuevaMateria.save();
      
      return NextResponse.json({
        success: true,
        message: 'Materia creada correctamente',
        data: materiaGuardada
      }, { status: 201 });
    } catch (saveError) {
      console.error('Error al guardar materia en la base de datos:', saveError);
      return NextResponse.json({
        success: false,
        message: 'Error al guardar materia en la base de datos',
        error: saveError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error al crear materia:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear materia',
      error: error.message
    }, { status: 500 });
  }
}
