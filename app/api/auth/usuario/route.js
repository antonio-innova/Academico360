import { NextResponse } from 'next/server';
import dbConnection from '../../../../database/db';
import Usuario from '../../../../database/models/Usuario';

// GET - Obtener información de un usuario por su idU (cédula)
export async function GET(request) {
  try {
    await dbConnection.connectDB();

    // Obtener los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const idU = searchParams.get('idU');
    const idI = searchParams.get('idI');
    const idA = searchParams.get('idA');
    const institucion = searchParams.get('institucion');
    
    if (!idU) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el parámetro idU (cédula)',
      }, { status: 400 });
    }

    // Primero intentamos una búsqueda exacta con todos los criterios
    let filtroExacto = { idU: idU };
    
    // Si se proporciona la institución, añadir al filtro
    if (institucion) {
      filtroExacto.institucion = institucion;
    }
    
    // Si se proporciona idI o idA, añadir al filtro
    if (idI) {
      filtroExacto.idI = idI;
    } else if (idA) {
      filtroExacto.idA = idA;
    }
    
    // Buscar usuario con el filtro exacto
    let usuario = await Usuario.findOne(filtroExacto);
    
    // Si no encontramos al usuario con el filtro exacto, intentamos una búsqueda más flexible
    if (!usuario) {
      // Construimos un filtro OR para buscar por idU, idI o idA
      const filtroFlexible = {
        $or: [
          { idU: idU },
          idI ? { idI: idI } : null,
          idA ? { idA: idA } : null
        ].filter(Boolean) // Eliminar los null
      };
      
      usuario = await Usuario.findOne(filtroFlexible);
    }
    
    if (usuario) {
      return NextResponse.json({
        success: true,
        message: 'Usuario encontrado',
        usuario: {
          _id: usuario._id,
          idU: usuario.idU,
          tipo: usuario.tipo,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          estudianteId: usuario.estudianteId,
          idA: usuario.idA,
          idI: usuario.idI
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No existe usuario con esta cédula',
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error al buscar usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al buscar usuario',
      error: error.message
    }, { status: 500 });
  }
}
