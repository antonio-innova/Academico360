import { NextResponse } from 'next/server';
import dbConnection from '../../../../database/db';
import Estudiante from '../../../../database/models/Estudiante';

// GET - Verificar si un estudiante existe por su cédula (idU)
export async function GET(request) {
  try {
    await dbConnection.connectDB();

    // Obtener el parámetro idU de la URL
    const { searchParams } = new URL(request.url);
    const idU = searchParams.get('idU');
    
    if (!idU) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el parámetro idU (cédula)',
        exists: false
      }, { status: 400 });
    }

    // Preparar variantes del ID para búsqueda
    const idNormalizado = idU.replace(/^0+/, ''); // Sin ceros al inicio
    const idConCero = idNormalizado.length === 9 ? `0${idNormalizado}` : idNormalizado; // Con un cero si tiene 9 dígitos

    // Buscar estudiante con todas las variantes del ID
    const estudiante = await Estudiante.findOne({
      $or: [
        { idU: idU },
        { idU: idNormalizado },
        { idU: idConCero },
        { idU: `0${idNormalizado}` }, // Intentar con un cero al inicio
        { idU: `00${idNormalizado}` }, // Intentar con dos ceros al inicio
        { idU: `000${idNormalizado}` } // Intentar con tres ceros al inicio
      ]
    });
    
    if (estudiante) {
      return NextResponse.json({
        success: true,
        message: 'Estudiante encontrado',
        exists: true,
        estudiante: estudiante
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No existe estudiante con esta cédula',
        exists: false
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error al verificar estudiante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al verificar estudiante',
      error: error.message,
      exists: false
    }, { status: 500 });
  }
}
