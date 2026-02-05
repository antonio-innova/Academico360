'use server'

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnection from '../../../../../database/db';
import Aula from '../../../../../database/models/Aula';

/**
 * POST /api/aulas/[aulaId]/bloquear-momento
 * Bloquea o desbloquea un momento específico para todas las materias de un aula
 * Esto previene que se suban notas, pero NO afecta a los reportes
 */
export async function POST(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    console.log('🔄 POST - Iniciando actualización de bloqueo para aula:', aulaId);

    // Validar que aulaId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(aulaId)) {
      console.log('❌ ID de aula inválido:', aulaId);
      return NextResponse.json({
        success: false,
        message: 'ID de aula inválido'
      }, { status: 400 });
    }

    const { momento, bloqueado } = await request.json();
    console.log(`📝 Datos recibidos - Momento: ${momento}, Bloqueado: ${bloqueado}`);

    // Validar los datos recibidos
    if (momento === undefined || bloqueado === undefined) {
      console.log('❌ Datos incompletos');
      return NextResponse.json({
        success: false,
        message: 'Se requiere el momento y el estado de bloqueo'
      }, { status: 400 });
    }

    // Validar que el momento sea un número entre 1 y 4
    if (![1, 2, 3, 4].includes(Number(momento))) {
      console.log('❌ Momento inválido:', momento);
      return NextResponse.json({
        success: false,
        message: 'El momento debe ser 1, 2, 3 o 4'
      }, { status: 400 });
    }

    // Buscar el aula
    const aula = await Aula.findById(aulaId);
    if (!aula) {
      console.log('❌ Aula no encontrada');
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    console.log(`✅ Aula encontrada: ${aula.nombre}, Asignaciones: ${aula.asignaciones?.length || 0}`);

    // Verificar que el aula tenga asignaciones
    if (!aula.asignaciones || !Array.isArray(aula.asignaciones) || aula.asignaciones.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'El aula no tiene asignaciones de materias'
      }, { status: 400 });
    }

    // Usar updateOne directamente en la base de datos para asegurar que se guarde
    const updateField = `asignaciones.$[].momentosBloqueados.${momento}`;
    
    console.log(`🔧 Actualizando campo: ${updateField} = ${bloqueado}`);
    
    const result = await Aula.updateOne(
      { _id: aulaId },
      { $set: { [updateField]: bloqueado } }
    );

    console.log('📝 Resultado de la actualización:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se encontró el aula'
      }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      console.warn('⚠️ El documento fue encontrado pero no se modificó (posiblemente ya tenía el mismo valor)');
    }

    // Verificar que se guardó correctamente
    const aulaVerificacion = await Aula.findById(aulaId).lean();
    console.log('🔍 Verificación - Estado del momento después de guardar:');
    aulaVerificacion.asignaciones?.forEach((asig, idx) => {
      console.log(`  Asignación ${idx} (${asig.materia?.nombre}): momento ${momento} = ${asig.momentosBloqueados?.[momento]}`);
    });

    return NextResponse.json({
      success: true,
      message: `Momento ${momento} ${bloqueado ? 'bloqueado' : 'desbloqueado'} correctamente para ${aula.asignaciones.length} materia(s) del aula`,
      actualizaciones: aula.asignaciones.length,
      momentosBloqueados: {
        [momento]: bloqueado
      }
    });

  } catch (error) {
    console.error('Error al bloquear/desbloquear momento del aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el estado de bloqueo del momento',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/aulas/[aulaId]/bloquear-momento
 * Obtiene el estado de bloqueo de los momentos para todas las materias del aula
 */
export async function GET(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    console.log('🔍 GET - Obteniendo estado de bloqueo para aula:', aulaId);

    // Validar que aulaId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(aulaId)) {
      return NextResponse.json({
        success: false,
        message: 'ID de aula inválido'
      }, { status: 400 });
    }

    // Buscar el aula
    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    console.log(`📋 Aula encontrada: ${aula.nombre}, Asignaciones: ${aula.asignaciones?.length || 0}`);

    // Analizar el estado de bloqueo de los momentos
    const estadoMomentos = {
      1: { bloqueadas: 0, total: 0 },
      2: { bloqueadas: 0, total: 0 },
      3: { bloqueadas: 0, total: 0 },
      4: { bloqueadas: 0, total: 0 }
    };

    if (aula.asignaciones && Array.isArray(aula.asignaciones)) {
      for (const asignacion of aula.asignaciones) {
        for (let momento = 1; momento <= 4; momento++) {
          estadoMomentos[momento].total++;
          if (asignacion.momentosBloqueados && asignacion.momentosBloqueados[momento] === true) {
            estadoMomentos[momento].bloqueadas++;
            console.log(`🔒 Materia ${asignacion.materia?.nombre || 'Sin nombre'} - Momento ${momento}: BLOQUEADO`);
          }
        }
      }
    }

    // Determinar si cada momento está completamente bloqueado
    const momentosBloqueados = {
      1: estadoMomentos[1].bloqueadas === estadoMomentos[1].total && estadoMomentos[1].total > 0,
      2: estadoMomentos[2].bloqueadas === estadoMomentos[2].total && estadoMomentos[2].total > 0,
      3: estadoMomentos[3].bloqueadas === estadoMomentos[3].total && estadoMomentos[3].total > 0,
      4: estadoMomentos[4].bloqueadas === estadoMomentos[4].total && estadoMomentos[4].total > 0
    };

    console.log('📊 Estado final de momentos:', momentosBloqueados);
    console.log('📈 Detalle:', estadoMomentos);

    return NextResponse.json({
      success: true,
      momentosBloqueados,
      detalle: estadoMomentos
    });

  } catch (error) {
    console.error('Error al obtener estado de bloqueo del aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el estado de bloqueo',
      error: error.message
    }, { status: 500 });
  }
}

