import { NextResponse } from 'next/server';
import dbConnection from '../../../../database/db';
import Aula from '../../../../database/models/Aula';
import Estudiante from '../../../../database/models/Estudiante';

export async function POST(request) {
  try {
    await dbConnection.connectDB();
    
    // Obtener datos de la solicitud
    const data = await request.json();
    const { aulaId, nuevoAnio, nuevaSeccion } = data;
    
    // Validar datos de entrada
    if (!aulaId || !nuevoAnio || !nuevaSeccion) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el ID del aula, el nuevo año y la nueva sección'
      }, { status: 400 });
    }
    
    // Buscar el aula por ID
    const aula = await Aula.findById(aulaId);
    
    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }
    
    // Verificar si hay alumnos en el aula
    if (!aula.alumnos || aula.alumnos.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'El aula no tiene estudiantes asignados'
      }, { status: 400 });
    }
    
    // Actualizar directamente los estudiantes por año y sección actual
    const resultado = await Estudiante.updateMany(
      { 
        anio: aula.anio.toString(),
        seccion: aula.seccion
      },
      { 
        $set: { 
          anio: nuevoAnio.toString(), 
          seccion: nuevaSeccion 
        } 
      }
    );
    
    // Si no se actualizó ningún estudiante, intentar con un enfoque alternativo
    if (resultado.modifiedCount === 0) {
      // Crear un array con los criterios de búsqueda para cada alumno
      const criteriosBusqueda = aula.alumnos.map(alumno => ({
        $and: [
          { nombre: { $regex: new RegExp('^' + alumno.nombre + '$', 'i') } },
          { apellido: { $regex: new RegExp('^' + alumno.apellido + '$', 'i') } }
        ]
      }));
      
      // Buscar todos los estudiantes que coincidan con alguno de los criterios
      const estudiantesEncontrados = await Estudiante.find({ $or: criteriosBusqueda });
      
      if (estudiantesEncontrados.length === 0) {
        // Intentar un último enfoque: buscar todos los estudiantes y mostrar algunos para depuración
        const todosEstudiantes = await Estudiante.find().limit(5);
        
        return NextResponse.json({
          success: false,
          message: 'No se encontraron estudiantes para actualizar',
          aulaInfo: {
            id: aula._id.toString(),
            nombre: aula.nombre,
            anio: aula.anio,
            seccion: aula.seccion,
            alumnos: aula.alumnos.slice(0, 3)
          },
          muestraEstudiantes: todosEstudiantes.map(e => ({ 
            id: e._id.toString(),
            nombre: e.nombre, 
            apellido: e.apellido,
            anio: e.anio,
            seccion: e.seccion
          }))
        }, { status: 404 });
      }
      
      // Actualizar los estudiantes encontrados
      const resultadoAlternativo = await Estudiante.updateMany(
        { $or: criteriosBusqueda },
        { $set: { anio: nuevoAnio.toString(), seccion: nuevaSeccion } }
      );
      
      if (resultadoAlternativo.modifiedCount === 0) {
        return NextResponse.json({
          success: false,
          message: 'No se pudo actualizar ningún estudiante',
          estudiantesEncontrados: estudiantesEncontrados.length,
          estudiantesInfo: estudiantesEncontrados.slice(0, 3).map(est => ({
            id: est._id.toString(),
            nombre: est.nombre,
            apellido: est.apellido,
            anioActual: est.anio,
            seccionActual: est.seccion
          }))
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Se actualizaron ${resultadoAlternativo.modifiedCount} estudiantes al año ${nuevoAnio}, sección ${nuevaSeccion}`,
        modifiedCount: resultadoAlternativo.modifiedCount
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Se actualizaron ${resultado.modifiedCount} estudiantes al año ${nuevoAnio}, sección ${nuevaSeccion}`,
      modifiedCount: resultado.modifiedCount
    });
    
  } catch (error) {
    console.error('Error al avanzar de grado:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al procesar la solicitud: ' + error.message
    }, { status: 500 });
  }
}
