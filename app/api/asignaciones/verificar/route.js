import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '../../../../database/db';

// POST - Verificar si una asignación existe en la base de datos
export async function POST(request) {
  try {
    // Conectar a MongoDB usando la función del módulo db.js
    await connectDB();
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos mínimos requeridos
    if (!data.materiaId && !data.profesorId) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere al menos materiaId o profesorId para la verificación'
      }, { status: 400 });
    }
    
    // Convertir IDs a ObjectId si son strings
    const convertirAObjectId = (id) => {
      if (!id) return null;
      try {
        return typeof id === 'string' && id.length === 24 ? new mongoose.Types.ObjectId(id) : id;
      } catch (e) {
        return id; // Devolver el ID original si no se puede convertir
      }
    };
    
    // Crear filtro de búsqueda
    const filtro = {};
    if (data.materiaId) {
      filtro.materiaId = convertirAObjectId(data.materiaId);
    }
    if (data.profesorId) {
      filtro.profesorId = convertirAObjectId(data.profesorId);
    }
    
    // Buscar asignaciones con el filtro
    const asignaciones = await mongoose.connection.db.collection('asignacions').find(filtro).toArray();
    
    return NextResponse.json({
      success: true,
      message: `Se encontraron ${asignaciones.length} asignaciones`,
      data: {
        count: asignaciones.length,
        asignaciones: asignaciones.map(a => ({
          id: a._id.toString(),
          materiaNombre: a.materiaNombre,
          profesorNombre: a.profesorNombre,
          cantidadAlumnos: a.alumnos ? a.alumnos.length : 0
        }))
      }
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al verificar asignación: ' + error.message
    }, { status: 500 });
  }
}
