import { NextResponse } from 'next/server';
import dbConnection from '../../../../database/db';
import Profesor from '../../../../database/models/Profesor';

// GET - Obtener un profesor específico por ID
export async function GET(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id } = await params;
    
    // Buscar el profesor por ID
    const profesor = await Profesor.findById(id);
    
    if (!profesor) {
      return NextResponse.json({
        success: false,
        message: 'Profesor no encontrado'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profesor encontrado',
      data: profesor
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener profesor:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener profesor',
      error: error.message
    }, { status: 500 });
  }
}

// PUT - Actualizar un profesor existente
export async function PUT(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id } = await params;
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.nombre || !data.apellido) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: nombre y apellido son obligatorios'
      }, { status: 400 });
    }
    
    // Buscar el profesor por ID
    const profesor = await Profesor.findById(id);
    
    if (!profesor) {
      return NextResponse.json({
        success: false,
        message: 'Profesor no encontrado'
      }, { status: 404 });
    }
    
    // Actualizar campos
    profesor.nombre = data.nombre;
    profesor.apellido = data.apellido;
    profesor.email = data.email || profesor.email;
    profesor.telefono = data.telefono || profesor.telefono;
    profesor.especialidad = data.especialidad || profesor.especialidad;
    
    // Actualizar fecha de ingreso si se proporciona
    if (data.fechaIngreso !== undefined) {
      // Usar la fecha exactamente como se proporciona
      if (data.fechaIngreso) {
        try {
          profesor.fechaIngreso = new Date(data.fechaIngreso);
        } catch (error) {
          console.error('Error al procesar la fecha de ingreso:', error);
          profesor.fechaIngreso = data.fechaIngreso; // Usar el valor original como respaldo
        }
      } else {
        profesor.fechaIngreso = null;
      }
    }
    
    // Solo actualizar cédula si se proporciona y no es 'N/P'
    if (data.idU && data.idU !== 'N/P') {
      profesor.idU = data.idU;
    } else if (data.cedula && data.cedula !== 'N/P') {
      profesor.idU = data.cedula;
    }
    
    // Si se proporciona la institución, actualizar el ID del profesor según la institución
    if (data.institucion) {
      // Generar un nuevo ID basado en la institución si es necesario
      if (data.institucion === 'Acacias') {
        // Si ya tiene un ID con prefijo AP, mantenerlo, de lo contrario crear uno nuevo
        if (!profesor.idAP || !profesor.idAP.startsWith('AP')) {
          profesor.idAP = `AP${Date.now()}`;
        }
      } else if (data.institucion === 'IUTCM') {
        // Si ya tiene un ID con prefijo IP, mantenerlo, de lo contrario crear uno nuevo
        if (!profesor.idAP || !profesor.idAP.startsWith('IP')) {
          profesor.idAP = `IP${Date.now()}`;
        }
      }
    }
    
    // Guardar cambios
    await profesor.save();
    
    return NextResponse.json({
      success: true,
      message: 'Profesor actualizado correctamente',
      data: profesor
    }, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar profesor:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar profesor',
      error: error.message
    }, { status: 500 });
  }
}

// PATCH - Actualizar parcialmente un profesor (por ejemplo, solo su estado)
export async function PATCH(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id } = await params;
    const data = await request.json();
    
    let profesor;
    try {
      // Primero intentar buscar por _id (ObjectId de MongoDB)
      profesor = await Profesor.findById(id);
    } catch (err) {
      // Si no se encuentra por _id, intentar buscar por otros campos
      profesor = await Profesor.findOne({
        $or: [
          { id: id },
          { idAP: id },
          { idU: id }
        ]
      });
    }
    
    if (!profesor) {
      return NextResponse.json({
        success: false,
        message: 'Profesor no encontrado'
      }, { status: 404 });
    }
    
    // Actualizar los campos proporcionados
    if (data.estado !== undefined) {
      profesor.estado = Number(data.estado);
    }
    
    // Guardar los cambios
    await profesor.save();
    
    return NextResponse.json({
      success: true,
      message: 'Profesor actualizado correctamente',
      data: profesor
    }, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar profesor:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar profesor',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Eliminar un profesor
export async function DELETE(request, { params }) {
  try {
    await dbConnection.connectDB();

    const { id } = await params;
    
    // Buscar y eliminar el profesor
    const profesor = await Profesor.findByIdAndDelete(id);
    
    if (!profesor) {
      return NextResponse.json({
        success: false,
        message: 'Profesor no encontrado'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profesor eliminado correctamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error al eliminar profesor:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar profesor',
      error: error.message
    }, { status: 500 });
  }
}
