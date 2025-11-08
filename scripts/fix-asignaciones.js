// Script para diagnosticar y corregir problemas con el modelo de Asignacion
import mongoose from 'mongoose';
import dbConnection from '../database/db';
import Asignacion from '../database/models/Asignacion';
import Materia from '../database/models/Materia';
import Profesor from '../database/models/Profesor';
import Estudiante from '../database/models/Estudiante';

async function main() {
  try {
    // Conectar a la base de datos
    console.log('Conectando a MongoDB...');
    await dbConnection.connectDB();
    console.log('Conexión establecida');

    // Obtener todas las asignaciones
    const asignaciones = await Asignacion.find().lean();
    console.log(`Se encontraron ${asignaciones.length} asignaciones`);

    // Para cada asignación, obtener los datos relacionados y actualizar
    for (const asignacion of asignaciones) {
      console.log(`\nProcesando asignación: ${asignacion._id}`);
      
      try {
        // Obtener datos de la materia
        const materia = await Materia.findById(asignacion.materiaId).lean();
        if (materia) {
          console.log(`Materia encontrada: ${materia.nombre}`);
          
          // Obtener datos del profesor
          const profesor = await Profesor.findById(asignacion.profesorId).lean();
          if (profesor) {
            console.log(`Profesor encontrado: ${profesor.nombre} ${profesor.apellido}`);
            
            // Obtener datos de los alumnos
            let alumnosInfo = [];
            if (asignacion.alumnos && asignacion.alumnos.length > 0) {
              const alumnos = await Estudiante.find({
                _id: { $in: asignacion.alumnos }
              }).select('_id nombre').lean();
              
              alumnosInfo = alumnos.map(alumno => ({
                id: alumno._id,
                nombre: alumno.nombre
              }));
              console.log(`Se encontraron ${alumnosInfo.length} alumnos`);
            }
            
            // Actualizar la asignación directamente en MongoDB
            const resultado = await mongoose.connection.collection('asignacions').updateOne(
              { _id: new mongoose.Types.ObjectId(asignacion._id) },
              { 
                $set: { 
                  materiaNombre: materia.nombre,
                  profesorNombre: `${profesor.nombre} ${profesor.apellido}`,
                  alumnosInfo: alumnosInfo
                } 
              }
            );
            
            console.log(`Asignación actualizada: ${JSON.stringify(resultado)}`);
            
            // Verificar la actualización
            const asignacionActualizada = await Asignacion.findById(asignacion._id).lean();
            console.log('Datos actualizados:', {
              materiaNombre: asignacionActualizada.materiaNombre,
              profesorNombre: asignacionActualizada.profesorNombre,
              alumnosInfo: asignacionActualizada.alumnosInfo
            });
          } else {
            console.log(`No se encontró el profesor con ID: ${asignacion.profesorId}`);
          }
        } else {
          console.log(`No se encontró la materia con ID: ${asignacion.materiaId}`);
        }
      } catch (error) {
        console.error(`Error procesando asignación ${asignacion._id}:`, error);
      }
    }
    
    console.log('\nProceso completado');
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    // Cerrar la conexión
    mongoose.connection.close();
    console.log('Conexión cerrada');
  }
}

// Ejecutar el script
main();
