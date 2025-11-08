import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../database/db';
import Asignacion from '../../../../../../database/models/Asignacion';
import mongoose from 'mongoose';

// PUT - Actualizar una actividad existente
export async function PUT(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const { id, actividadId } = await params; // ID de la asignación y de la actividad
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.nombre || data.porcentaje === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: nombre y porcentaje son obligatorios'
      }, { status: 400 });
    }
    
    // Verificar que el porcentaje sea válido
    if (data.porcentaje < 0 || data.porcentaje > 100) {
      return NextResponse.json({
        success: false,
        message: 'El porcentaje debe estar entre 0 y 100'
      }, { status: 400 });
    }
    
    // Buscar la asignación por ID
    const asignacion = await Asignacion.findById(id);
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    // Buscar la actividad en la asignación
    const actividadIndex = asignacion.actividades.findIndex(act => 
      act._id.toString() === actividadId
    );
    
    if (actividadIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Actualizar los campos de la actividad
    asignacion.actividades[actividadIndex].nombre = data.nombre;
    asignacion.actividades[actividadIndex].descripcion = data.descripcion || '';
    
    // Si se proporciona una fecha, actualizarla
    if (data.fecha) {
      asignacion.actividades[actividadIndex].fecha = new Date(data.fecha);
    }
    
    asignacion.actividades[actividadIndex].porcentaje = data.porcentaje;
    
    // Actualizar el momento si se proporciona
    if (data.momento !== undefined) {
      asignacion.actividades[actividadIndex].momento = data.momento;
    }
    
    // Guardar los cambios
    await asignacion.save();
    
    return NextResponse.json({
      success: true,
      message: 'Actividad actualizada correctamente',
      data: asignacion.actividades[actividadIndex]
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar actividad',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Eliminar una actividad
export async function DELETE(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const { id, actividadId } = await params;
    
    // Buscar la asignación por ID
    const asignacion = await Asignacion.findById(id);
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    // Buscar la actividad en la asignación
    const actividadIndex = asignacion.actividades.findIndex(act => 
      act._id.toString() === actividadId
    );
    
    if (actividadIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    // Eliminar la actividad del array
    asignacion.actividades.splice(actividadIndex, 1);
    
    // Guardar los cambios
    await asignacion.save();
    
    return NextResponse.json({
      success: true,
      message: 'Actividad eliminada correctamente'
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar actividad',
      error: error.message
    }, { status: 500 });
  }
}

// GET - Obtener una actividad específica
export async function GET(request, { params }) {
  try {
    // Asegurarse de que la conexión a la base de datos esté establecida
    if (!dbConnection.isConnected()) {
      await dbConnection.connectDB();
    }

    const { id, actividadId } = await params;
    
    // Buscar la asignación por ID
    const asignacion = await Asignacion.findById(id);
    
    if (!asignacion) {
      return NextResponse.json({
        success: false,
        message: 'Asignación no encontrada'
      }, { status: 404 });
    }
    
    // Buscar la actividad en la asignación
    const actividad = asignacion.actividades.find(act => 
      act._id.toString() === actividadId
    );
    
    if (!actividad) {
      return NextResponse.json({
        success: false,
        message: 'Actividad no encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: actividad
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al obtener actividad',
      error: error.message
    }, { status: 500 });
  }
}
