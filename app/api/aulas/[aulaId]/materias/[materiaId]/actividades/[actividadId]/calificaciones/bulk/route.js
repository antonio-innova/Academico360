import { NextResponse } from 'next/server';
import dbConnection from '../../../../../../../../../../database/db';
import Aula from '../../../../../../../../../../database/models/Aula';
import mongoose from 'mongoose';

// POST /api/aulas/[aulaId]/materias/[materiaId]/actividades/[actividadId]/calificaciones/bulk
export async function POST(request, { params }) {
  try {
    const { aulaId, materiaId, actividadId } = await params;
    await dbConnection.connectDB();

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ success: false, message: 'Content-Type debe ser application/json' }, { status: 415 });
    }

    const body = await request.json();
    const calificacionesInput = Array.isArray(body.calificaciones) ? body.calificaciones : [];
    const tipoCalificacion = body.tipoCalificacion || null;

    if (calificacionesInput.length === 0) {
      return NextResponse.json({ success: false, message: 'No hay calificaciones para procesar' }, { status: 400 });
    }

    const actObjectId = new mongoose.Types.ObjectId(actividadId);

    // Obtener los alumnoIds que ya tienen calificación en la actividad
    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      return NextResponse.json({ success: false, message: 'Aula no encontrada' }, { status: 404 });
    }

    const asignacion = (aula.asignaciones || []).find(a => (a.materia && a.materia.id === materiaId));
    if (!asignacion) {
      return NextResponse.json({ success: false, message: 'Materia no encontrada en el aula' }, { status: 404 });
    }

    const actividad = (asignacion.actividades || []).find(act => String(act._id) === String(actObjectId));
    if (!actividad) {
      return NextResponse.json({ success: false, message: 'Actividad no encontrada' }, { status: 404 });
    }

    const existentesSet = new Set((actividad.calificaciones || []).map(c => String(c.alumnoId)));

    const toUpdate = [];
    const toInsert = [];

    for (const item of calificacionesInput) {
      if (!item || !item.alumnoId) continue;
      const esNumerica = (tipoCalificacion || item.tipoCalificacion || (item.notaAlfabetica ? 'alfabetica' : 'numerica')) === 'numerica';
      const nota = esNumerica && item.nota !== undefined && item.nota !== null
        ? Math.max(1, Math.min(20, Number(item.nota) || 1))
        : undefined;
      const normalizado = {
        alumnoId: item.alumnoId,
        nota,
        notaAlfabetica: !esNumerica ? item.notaAlfabetica : undefined,
        tipoCalificacion: esNumerica ? 'numerica' : 'alfabetica',
        observaciones: item.observaciones || '',
        evidencia: item.evidencia || ''
      };
      (existentesSet.has(String(item.alumnoId)) ? toUpdate : toInsert).push(normalizado);
    }

    const bulkOps = [];

    // Actualizaciones en lote para calificaciones existentes
    for (const cal of toUpdate) {
      bulkOps.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(aulaId) },
          update: {
            $set: {
              'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].nota': cal.nota,
              'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].notaAlfabetica': cal.notaAlfabetica,
              'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].tipoCalificacion': cal.tipoCalificacion,
              'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].observaciones': cal.observaciones,
              'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].evidencia': cal.evidencia,
              'asignaciones.$[asig].actividades.$[act].calificaciones.$[cal].fechaModificacion': new Date()
            }
          },
          arrayFilters: [
            { 'asig.materia.id': materiaId },
            { 'act._id': actObjectId },
            { 'cal.alumnoId': cal.alumnoId }
          ]
        }
      });
    }

    // Inserciones en lote para nuevas calificaciones
    for (const cal of toInsert) {
      bulkOps.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(aulaId) },
          update: {
            $push: {
              'asignaciones.$[asig].actividades.$[act].calificaciones': {
                alumnoId: cal.alumnoId,
                nota: cal.nota,
                notaAlfabetica: cal.notaAlfabetica,
                tipoCalificacion: cal.tipoCalificacion,
                observaciones: cal.observaciones,
                evidencia: cal.evidencia,
                fechaCreacion: new Date()
              }
            }
          },
          arrayFilters: [
            { 'asig.materia.id': materiaId },
            { 'act._id': actObjectId }
          ]
        }
      });
    }

    if (bulkOps.length === 0) {
      return NextResponse.json({ success: true, message: 'No hubo cambios que aplicar', data: { updated: 0, inserted: 0 } });
    }

    const result = await Aula.bulkWrite(bulkOps, { ordered: false });

    return NextResponse.json({
      success: true,
      message: 'Calificaciones procesadas correctamente',
      data: {
        modified: result.modifiedCount || 0,
        matched: result.matchedCount || 0,
        upserts: result.upsertedCount || 0,
        totalOperaciones: bulkOps.length,
        updated: toUpdate.length,
        inserted: toInsert.length
      }
    });
  } catch (error) {
    console.error('Error en guardado por lote de calificaciones:', error);
    return NextResponse.json({ success: false, message: 'Error al guardar calificaciones por lote', error: error.message }, { status: 500 });
  }
}


