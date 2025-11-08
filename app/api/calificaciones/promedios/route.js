import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import dbConnection from '../../../../database/db';

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
    const { promedios, puntosExtras, aulaId, materiaId, momento } = await request.json();
    
    // Validar que se hayan enviado los datos necesarios
    if (!promedios || !Array.isArray(promedios) || !aulaId || !materiaId || !momento) {
      return NextResponse.json({ 
        success: false, 
        message: 'Datos incompletos o inválidos' 
      }, { status: 400 });
    }

    // Conectar a MongoDB
    await dbConnection.connectDB();
    const db = dbConnection.getDb();
    const aulasCollection = db.collection('aulas');
    
    // Buscar el aula
    let aulaObjectId;
    try {
      aulaObjectId = new ObjectId(aulaId);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de aula inválido' 
      }, { status: 400 });
    }
    
    const aula = await aulasCollection.findOne({ _id: aulaObjectId });
    
    if (!aula) {
      return NextResponse.json({ 
        success: false, 
        message: 'Aula no encontrada' 
      }, { status: 404 });
    }

    // Buscar la asignación de la materia en el aula
    const materiaIdStr = materiaId.toString();
    
    // Hacer la búsqueda más flexible para manejar diferentes formatos de ID
    const asignacionIndex = aula.asignaciones?.findIndex(asig => {
      if (!asig.materia) return false;
      
      // Intentar diferentes formatos de ID
      const materiaIdInAsig = asig.materia.id || asig.materia._id;
      if (!materiaIdInAsig) return false;
      
      return materiaIdInAsig.toString() === materiaIdStr;
    });
    
    if (asignacionIndex === -1 || asignacionIndex === undefined) {
      return NextResponse.json({ 
        success: false, 
        message: 'Asignación no encontrada en el aula' 
      }, { status: 404 });
    }
    
    // Inicializar el array de promedios si no existe
    if (!aula.asignaciones[asignacionIndex].promedios) {
      aula.asignaciones[asignacionIndex].promedios = [];
    }
    
    // Crear una copia del array de promedios para trabajar con él
    let promediosActualizados = [...aula.asignaciones[asignacionIndex].promedios];

    // Verificar que la estructura de asignaciones sea correcta
    if (!aula.asignaciones[asignacionIndex]) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error en la estructura de datos: asignación no encontrada' 
      }, { status: 500 });
    }
    
    // Actualizar o crear los promedios para cada alumno
    try {
      for (const promedio of promedios) {
        const { alumnoId, promedioOriginal, puntosAdicionales, promedioFinal, momento } = promedio;
        
        if (!alumnoId) {
          continue; // Saltar este alumno si no tiene ID válido
        }
        
        // Verificar si estamos procesando el promedio total
        const esMomentoTotal = momento === 'total';
        
        if (esMomentoTotal) {
          // Inicializar el array de puntosExtras si no existe
          if (!aula.asignaciones[asignacionIndex].puntosExtras) {
            aula.asignaciones[asignacionIndex].puntosExtras = [];
          }
          
          // Si recibimos la nueva estructura de puntosExtras, la procesamos
          if (puntosExtras && Array.isArray(puntosExtras) && puntosExtras.length > 0) {
            // Para cada punto extra recibido, actualizamos o agregamos
            for (const puntoExtra of puntosExtras) {
              const { alumnoId, puntos, fechaActualizacion } = puntoExtra;
              
              if (!alumnoId) {
                continue; // Saltar este alumno si no tiene ID válido
              }
              
              // Buscar si ya existe un registro de puntos extras para este alumno
              const puntosExtrasIndex = aula.asignaciones[asignacionIndex].puntosExtras.findIndex(
                p => p.alumnoId === alumnoId
              );
              
              // Crear el objeto de puntos extras actualizado
              const puntosExtrasActualizados = {
                alumnoId,
                puntos,
                fechaActualizacion: fechaActualizacion || new Date()
              };
              
              // Actualizar o agregar los puntos extras
              if (puntosExtrasIndex !== -1) {
                aula.asignaciones[asignacionIndex].puntosExtras[puntosExtrasIndex] = puntosExtrasActualizados;
              } else {
                aula.asignaciones[asignacionIndex].puntosExtras.push(puntosExtrasActualizados);
              }
            }
          } else {
            // Mantener el comportamiento anterior para compatibilidad
            // Buscar si ya existe un registro de puntos extras para este alumno
            const puntosExtrasIndex = aula.asignaciones[asignacionIndex].puntosExtras.findIndex(
              p => p.alumnoId === alumnoId
            );
            
            // Crear el objeto de puntos extras actualizado
            const puntosExtrasActualizados = {
              alumnoId,
              puntos: puntosAdicionales,
              fechaActualizacion: new Date()
            };
            
            // Actualizar o agregar los puntos extras
            if (puntosExtrasIndex !== -1) {
              aula.asignaciones[asignacionIndex].puntosExtras[puntosExtrasIndex] = puntosExtrasActualizados;
            } else {
              aula.asignaciones[asignacionIndex].puntosExtras.push(puntosExtrasActualizados);
            }
          }
        }
        
        // Buscar si ya existe un registro para este alumno
        const promedioIndex = aula.asignaciones[asignacionIndex].promedios?.findIndex(
          p => p.alumnoId === alumnoId && (esMomentoTotal ? p.momento === 'total' : p.momento === momento)
        ) || -1;
      
        // Crear el objeto de promedio actualizado
        const promedioActualizado = {
          alumnoId,
          momento: esMomentoTotal ? 'total' : momento,
          promedioOriginal,
          puntosAdicionales,
          promedioFinal,
          fechaActualizacion: new Date()
        };
        
        // Actualizar o agregar el promedio
        if (promedioIndex !== -1) {
          aula.asignaciones[asignacionIndex].promedios[promedioIndex] = promedioActualizado;
        } else {
          aula.asignaciones[asignacionIndex].promedios.push(promedioActualizado);
        }
      }
    } catch (error) {
      console.error('Error al procesar promedios:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Error al procesar promedios: ' + error.message 
      }, { status: 500 });
    }

    // Guardar los cambios en la base de datos
    if (!aula.asignaciones[asignacionIndex].puntosExtras || !Array.isArray(aula.asignaciones[asignacionIndex].puntosExtras)) {
      aula.asignaciones[asignacionIndex].puntosExtras = [];
    }
    
    try {
      // Crear la consulta de actualización
      const updateQuery = {};
      updateQuery[`asignaciones.${asignacionIndex}.puntosExtras`] = aula.asignaciones[asignacionIndex].puntosExtras;
      
      const resultado = await aulasCollection.updateOne(
        { _id: aulaObjectId },
        { $set: updateQuery }
      );
      
      if (resultado.matchedCount === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'No se encontró el aula para actualizar' 
        }, { status: 404 });
      }
      
    } catch (updateError) {
      console.error('Error durante la operación de actualización:', updateError);
      return NextResponse.json({ 
        success: false, 
        message: 'Error durante la operación de actualización: ' + updateError.message
      }, { status: 500 });
    }

    // Devolver respuesta exitosa
    return NextResponse.json({ 
      success: true, 
      message: 'Puntos extras actualizados correctamente',
      puntosExtrasActualizados: aula.asignaciones[asignacionIndex].puntosExtras.length
    });
    
  } catch (error) {
    console.error('Error al guardar puntos extras:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al procesar la solicitud',
      error: error.message
    }, { status: 500 });
  }
}
