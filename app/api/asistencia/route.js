import { NextResponse } from 'next/server';
import { connectDB } from '../../../database/db';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    const { aulaId, fecha, materia, asistencia } = await request.json();

    if (!aulaId || !fecha || !asistencia) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos requeridos: aulaId, fecha, asistencia' },
        { status: 400 }
      );
    }

    await connectDB();
    const db = mongoose.connection.db;
    const collection = db.collection('asistencia');

    // Crear el documento de asistencia
    const asistenciaDoc = {
      aulaId,
      fecha: new Date(fecha),
      materia: materia || null, // Incluir materia si se proporciona
      asistencia: Object.entries(asistencia).map(([estudianteId, datos]) => ({
        estudianteId,
        estado: datos.estado, // 'presente', 'ausente', 'tardanza'
        razon: datos.razon || null // Razón de ausencia o tardanza
      })),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    // Verificar si ya existe asistencia para esta aula, fecha y materia
    let existingQuery = {
      aulaId,
      fecha: new Date(fecha)
    };
    
    // Si hay materia, incluirla en la consulta
    if (materia) {
      existingQuery.materia = materia;
    }
    
    const existingAttendance = await collection.findOne(existingQuery);

    if (existingAttendance) {
      // Actualizar asistencia existente
      const result = await collection.updateOne(
        existingQuery,
        { 
          $set: { 
            asistencia: asistenciaDoc.asistencia,
            materia: materia || null,
            fechaActualizacion: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        return NextResponse.json({
          success: true,
          message: 'Asistencia actualizada correctamente',
          data: { ...asistenciaDoc, _id: existingAttendance._id }
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'No se pudo actualizar la asistencia' },
          { status: 500 }
        );
      }
    } else {
      // Crear nueva asistencia
      const result = await collection.insertOne(asistenciaDoc);

      if (result.insertedId) {
        return NextResponse.json({
          success: true,
          message: 'Asistencia guardada correctamente',
          data: { ...asistenciaDoc, _id: result.insertedId }
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'No se pudo guardar la asistencia' },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Error al guardar asistencia:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const aulaId = searchParams.get('aulaId');
    const fecha = searchParams.get('fecha');
    const materia = searchParams.get('materia');

    if (!aulaId) {
      return NextResponse.json(
        { success: false, message: 'aulaId es requerido' },
        { status: 400 }
      );
    }

    await connectDB();
    const db = mongoose.connection.db;
    const asistenciaCollection = db.collection('asistencia');
    const estudiantesCollection = db.collection('estudiantes');
    const aulasCollection = db.collection('aulas');

    let query = { aulaId };
    
    // Si se proporciona fecha, filtrar por fecha específica
    if (fecha) {
      query.fecha = new Date(fecha);
    }
    
    // Buscar asistencias
    let asistencias = await asistenciaCollection.find(query).sort({ fecha: -1 }).toArray();
    
    // Si se proporciona materia, filtrar por materia específica
    // Pero si no se encuentran resultados, buscar sin filtro de materia
    if (materia) {
      const asistenciasConMateria = asistencias.filter(a => a.materia === materia);
      if (asistenciasConMateria.length > 0) {
        asistencias = asistenciasConMateria;
      }
      // Si no hay resultados con materia, usar todos los resultados
    }

    if (asistencias.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se encontró información de asistencia para los parámetros especificados'
      });
    }

    // Obtener información del aula
    const aulaInfo = await aulasCollection.findOne({ _id: new mongoose.Types.ObjectId(aulaId) });
    
    // Enriquecer los datos de asistencia con información de estudiantes
    const asistenciasEnriquecidas = await Promise.all(
      asistencias.map(async (asistencia) => {
        const asistenciaConEstudiantes = await Promise.all(
          asistencia.asistencia.map(async (registro) => {
            const estudiante = await estudiantesCollection.findOne({
              _id: new mongoose.Types.ObjectId(registro.estudianteId)
            });
            
            return {
              ...registro,
              estudiante: estudiante ? {
                nombre: estudiante.nombre,
                apellido: estudiante.apellido,
                cedula: estudiante.cedula
              } : null
            };
          })
        );
        
        return {
          ...asistencia,
          asistencia: asistenciaConEstudiantes,
          aula: aulaInfo ? {
            nombre: aulaInfo.nombre,
            anio: aulaInfo.anio,
            seccion: aulaInfo.seccion,
            turno: aulaInfo.turno
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: asistenciasEnriquecidas
    });

  } catch (error) {
    console.error('Error al obtener asistencia:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    );
  }
}
