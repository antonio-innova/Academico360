import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import dbConnection from '../../../../database/db';
import Aula from '../../../../database/models/Aula';

export async function POST(request) {
  try {
    console.log('🟢 API - Recibiendo solicitud POST a /api/calificaciones/puntosmomento');
    const { puntos, aulaId, materiaId, momento, alumnoId } = await request.json();
    console.log('🟢 API - Datos recibidos:', { puntos, aulaId, materiaId, momento, alumnoId });

    // Validaciones básicas
    if (puntos === undefined || puntos === null || !aulaId || !materiaId || !momento || !alumnoId) {
      console.error('🔴 API - Datos incompletos');

      return NextResponse.json({
        success: false,
        message: 'Datos incompletos o inválidos'
      }, { status: 400 });
    }

    if (!['momento1', 'momento2', 'momento3'].includes(momento)) {
      console.error('🔴 API - Momento inválido:', momento);
      return NextResponse.json({
        success: false,
        message: 'Momento inválido. Debe ser momento1, momento2 o momento3'
      }, { status: 400 });
    }

    if (isNaN(puntos) || puntos < 0 || puntos > 2) {
      console.error('🔴 API - Puntos fuera de rango:', puntos);
      return NextResponse.json({
        success: false,
        message: 'Los puntos deben ser un número entre 0 y 2'
      }, { status: 400 });
    }

    console.log('🟢 API - Conectando a la base de datos...');
    await dbConnection.connectDB();
    console.log('🟢 API - Conectado a la base de datos');

    // Convertir aulaId a ObjectId si es necesario
    let aulaObjectId;
    try {
      aulaObjectId = typeof aulaId === 'string' ? new ObjectId(aulaId) : aulaId;
      console.log('🟢 API - AulaId convertido:', { original: aulaId, convertido: aulaObjectId });
    } catch (error) {
      console.error('🔴 API - Error al convertir aulaId a ObjectId:', error);
      return NextResponse.json({
        success: false,
        message: 'ID de aula inválido'
      }, { status: 400 });
    }

    const puntoDatos = {
      alumnoId: alumnoId.toString(),
      puntos: Number(puntos),
      fechaActualizacion: new Date()
    };
    console.log('🟢 API - Datos preparados para guardar:', puntoDatos);

    // ESTRATEGIA NUEVA: Primero inicializar la estructura si no existe
    console.log('🟢 API - Asegurando que existe la estructura puntosPorMomento...');
    await Aula.updateOne(
      {
        _id: aulaObjectId,
        "asignaciones.materia.id": materiaId,
        "asignaciones.puntosPorMomento": { $exists: false }
      },
      {
        $set: {
          "asignaciones.$[asig].puntosPorMomento": {
            momento1: [],
            momento2: [],
            momento3: []
          }
        }
      },
      {
        arrayFilters: [{ "asig.materia.id": materiaId }]
      }
    );

    // Paso 1: Eliminar cualquier registro existente del alumno en este momento
    console.log('🟢 API - Eliminando registro existente del alumno (si existe)...');
    await Aula.updateOne(
      {
        _id: aulaObjectId,
        "asignaciones.materia.id": materiaId
      },
      {
        $pull: {
          [`asignaciones.$[asig].puntosPorMomento.${momento}`]: {
            alumnoId: alumnoId.toString()
          }
        }
      },
      {
        arrayFilters: [{ "asig.materia.id": materiaId }]
      }
    );
    console.log('✅ API - Registro existente eliminado (si existía)');

    // Paso 2: Agregar el nuevo registro
    console.log('🟢 API - Agregando nuevo registro de puntos...');
    const resultado = await Aula.findOneAndUpdate(
      {
        _id: aulaObjectId,
        "asignaciones.materia.id": materiaId
      },
      {
        $push: {
          [`asignaciones.$[asig].puntosPorMomento.${momento}`]: puntoDatos
        }
      },
      {
        arrayFilters: [{ "asig.materia.id": materiaId }],
        new: true
      }
    );
    
    if (resultado) {
      const asignacion = resultado.asignaciones?.find(a => a.materia?.id === materiaId);
      console.log('✅ API - Punto agregado exitosamente');
      console.log('✅ API - Aula ID:', resultado._id);
      console.log('✅ API - puntosPorMomento después de agregar:', asignacion?.puntosPorMomento);
      console.log('✅ API - Datos del momento actual:', asignacion?.puntosPorMomento?.[momento]);
    } else {
      console.error('🔴 API - No se pudo agregar el punto');
    }

    console.log('✅ API - Guardado completado exitosamente');
    return NextResponse.json({
      success: true,
      message: `Puntos extras para ${momento} actualizados correctamente`
    });

  } catch (error) {
    console.error('🔴 API - ERROR al guardar puntos extras:', error);
    console.error('🔴 API - Tipo de error:', error.name);
    console.error('🔴 API - Mensaje:', error.message);
    console.error('🔴 API - Stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al procesar la solicitud: ' + error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    console.log('🟢 API GET - Recibiendo solicitud GET a /api/calificaciones/puntosmomento');
    
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const aulaId = searchParams.get('aulaId');
    const materiaId = searchParams.get('materiaId');
    const momento = searchParams.get('momento');
    
    console.log('🟢 API GET - Parámetros:', { aulaId, materiaId, momento });
    
    // Validar que se hayan enviado los datos necesarios
    if (!aulaId || !materiaId || !momento) {
      console.error('🔴 API GET - Parámetros incompletos');
      return NextResponse.json({ 
        success: false, 
        message: 'Parámetros incompletos' 
      }, { status: 400 });
    }
    
    // Validar que el momento sea válido
    if (!['momento1', 'momento2', 'momento3'].includes(momento)) {
      console.error('🔴 API GET - Momento inválido:', momento);
      return NextResponse.json({ 
        success: false, 
        message: 'Momento inválido. Debe ser momento1, momento2 o momento3' 
      }, { status: 400 });
    }
    
    // Conectar a MongoDB
    console.log('🟢 API GET - Conectando a la base de datos...');
    await dbConnection.connectDB();
    
    // Buscar el aula
    console.log('🟢 API GET - Buscando aula:', aulaId);
    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      console.error('🔴 API GET - Aula no encontrada');
      return NextResponse.json({ 
        success: false, 
        message: 'Aula no encontrada' 
      }, { status: 404 });
    }
    console.log('🟢 API GET - Aula encontrada');
    
    // Buscar la asignación correspondiente a la materia
    console.log('🟢 API GET - Buscando asignación para materia:', materiaId);
    console.log('🟢 API GET - Asignaciones disponibles:', aula.asignaciones?.map(a => a.materia?.id));
    
    const asignacion = aula.asignaciones.find(asig => 
      asig.materia?.id?.toString() === materiaId.toString()
    );
    
    if (!asignacion) {
      console.error('🔴 API GET - Asignación no encontrada para la materia');
      return NextResponse.json({ 
        success: false, 
        message: 'Asignación no encontrada para la materia especificada' 
      }, { status: 404 });
    }
    console.log('🟢 API GET - Asignación encontrada');
    
    // Verificar si la asignación tiene la estructura puntosPorMomento
    console.log('🟢 API GET - Verificando puntosPorMomento...');
    console.log('🟢 API GET - puntosPorMomento existe?', !!asignacion.puntosPorMomento);
    console.log('🟢 API GET - puntosPorMomento:', asignacion.puntosPorMomento);
    console.log('🟢 API GET - momento específico existe?', !!asignacion.puntosPorMomento?.[momento]);
    console.log('🟢 API GET - datos del momento:', asignacion.puntosPorMomento?.[momento]);
    
    if (!asignacion.puntosPorMomento || !asignacion.puntosPorMomento[momento]) {
      console.log('🟡 API GET - No hay puntos guardados para este momento, devolviendo array vacío');
      return NextResponse.json([]);
    }
    
    // Devolver directamente el array de puntos para el momento específico
    const puntos = asignacion.puntosPorMomento[momento];
    console.log('✅ API GET - Devolviendo puntos:', puntos);
    return NextResponse.json(puntos);
    
  } catch (error) {
    console.error('🔴 API GET - ERROR:', error);
    console.error('🔴 API GET - Tipo:', error.name);
    console.error('🔴 API GET - Mensaje:', error.message);
    console.error('🔴 API GET - Stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener puntos extras: ' + error.message 
    }, { status: 500 });
  }
}
