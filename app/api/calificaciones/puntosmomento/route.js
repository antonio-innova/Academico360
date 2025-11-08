import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import dbConnection from '../../../../database/db';
import Aula from '../../../../database/models/Aula';

export async function POST(request) {
  try {
    // Verificar permisos - solo control de estudios puede modificar puntos extras
    const cookieStore = cookies();
    const userType = cookieStore.get('userType')?.value;
    
    if (userType !== 'control') {
      return NextResponse.json({ 
        success: false, 
        message: 'Acceso denegado. Solo el control de estudios puede modificar puntos extras.' 
      }, { status: 403 });
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const { puntos, aulaId, materiaId, momento, alumnoId } = await request.json();
    
    // Validar que se hayan enviado los datos necesarios
    if (puntos === undefined || puntos === null || !aulaId || !materiaId || !momento || !alumnoId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Datos incompletos o inválidos' 
      }, { status: 400 });
    }
    
    // Validar que el momento sea válido
    if (!['momento1', 'momento2', 'momento3'].includes(momento)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Momento inválido. Debe ser momento1, momento2 o momento3' 
      }, { status: 400 });
    }
    
    // Validar que los puntos estén en el rango permitido
    if (isNaN(puntos) || puntos < 0 || puntos > 2) {
      return NextResponse.json({ 
        success: false, 
        message: 'Los puntos deben ser un número entre 0 y 2' 
      }, { status: 400 });
    }
    
    // Conectar a MongoDB
    await dbConnection.connectDB();
    
    // Preparar el punto a actualizar
    const puntoDatos = {
      alumnoId: alumnoId.toString(),
      puntos: Number(puntos),
      fechaActualizacion: new Date()
    };
    
    // Usar findOneAndUpdate con operadores atómicos para evitar problemas de concurrencia
    const resultado = await Aula.findOneAndUpdate(
      { 
        _id: aulaId,
        "asignaciones.materia.id": materiaId,
        [`asignaciones.puntosPorMomento.${momento}.alumnoId`]: alumnoId
      },
      { 
        $set: { 
          [`asignaciones.$[asig].puntosPorMomento.${momento}.$[punto]`]: puntoDatos 
        }
      },
      {
        arrayFilters: [
          { "asig.materia.id": materiaId },
          { "punto.alumnoId": alumnoId }
        ],
        new: true
      }
    );
    
    // Si no se actualizó ningún documento (el alumno no tenía puntos previos)
    if (!resultado) {
      // Intentar agregar un nuevo punto
      const resultadoNuevo = await Aula.findOneAndUpdate(
        { 
          _id: aulaId,
          "asignaciones.materia.id": materiaId
        },
        { 
          $push: { 
            [`asignaciones.$[asig].puntosPorMomento.${momento}`]: puntoDatos 
          }
        },
        {
          arrayFilters: [
            { "asig.materia.id": materiaId }
          ],
          new: true,
          upsert: true
        }
      );
      
      // Si aún no se actualizó, es posible que no exista la estructura puntosPorMomento
      if (!resultadoNuevo) {
        // Inicializar la estructura puntosPorMomento
        await Aula.findOneAndUpdate(
          { 
            _id: aulaId,
            "asignaciones.materia.id": materiaId
          },
          { 
            $set: { 
              [`asignaciones.$[asig].puntosPorMomento`]: {
                momento1: [],
                momento2: [],
                momento3: []
              }
            }
          },
          {
            arrayFilters: [
              { "asig.materia.id": materiaId }
            ]
          }
        );
        
        // Ahora agregar el punto
        await Aula.findOneAndUpdate(
          { 
            _id: aulaId,
            "asignaciones.materia.id": materiaId
          },
          { 
            $push: { 
              [`asignaciones.$[asig].puntosPorMomento.${momento}`]: puntoDatos 
            }
          },
          {
            arrayFilters: [
              { "asig.materia.id": materiaId }
            ]
          }
        );
      }
    }
    
    // Devolver respuesta exitosa
    return NextResponse.json({ 
      success: true, 
      message: `Puntos extras para ${momento} actualizados correctamente`
    });
    
  } catch (error) {
    console.error('Error al guardar puntos extras por momento:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al procesar la solicitud: ' + error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const aulaId = searchParams.get('aulaId');
    const materiaId = searchParams.get('materiaId');
    const momento = searchParams.get('momento');
    
    // Validar que se hayan enviado los datos necesarios
    if (!aulaId || !materiaId || !momento) {
      return NextResponse.json({ 
        success: false, 
        message: 'Parámetros incompletos' 
      }, { status: 400 });
    }
    
    // Validar que el momento sea válido
    if (!['momento1', 'momento2', 'momento3'].includes(momento)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Momento inválido. Debe ser momento1, momento2 o momento3' 
      }, { status: 400 });
    }
    
    // Conectar a MongoDB
    await dbConnection.connectDB();
    
    // Buscar el aula
    const aula = await Aula.findById(aulaId);
    if (!aula) {
      return NextResponse.json({ 
        success: false, 
        message: 'Aula no encontrada' 
      }, { status: 404 });
    }
    
    // Buscar la asignación correspondiente a la materia
    const asignacion = aula.asignaciones.find(asig => 
      asig.materia.id.toString() === materiaId.toString()
    );
    
    if (!asignacion) {
      return NextResponse.json({ 
        success: false, 
        message: 'Asignación no encontrada para la materia especificada' 
      }, { status: 404 });
    }
    
    // Verificar si la asignación tiene la estructura puntosPorMomento
    if (!asignacion.puntosPorMomento || !asignacion.puntosPorMomento[momento]) {
      // Si no existe, devolver array vacío
      return NextResponse.json([]);
    }
    
    // Devolver directamente el array de puntos para el momento específico
    return NextResponse.json(asignacion.puntosPorMomento[momento]);
    
  } catch (error) {
    console.error('Error al obtener puntos extras por momento:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener puntos extras: ' + error.message 
    }, { status: 500 });
  }
}
