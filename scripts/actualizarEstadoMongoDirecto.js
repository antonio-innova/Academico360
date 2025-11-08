// Script para actualizar directamente la colección de profesores en MongoDB
// Este script añade el campo estado a todos los profesores

// Ejecutar este script con: node actualizarEstadoMongoDirecto.js

// Importar las dependencias necesarias
const { MongoClient } = require('mongodb');

// URL de conexión a MongoDB
const uri = 'mongodb://localhost:27017/';
const dbName = 'DBAcademico';

async function actualizarEstadoProfesores() {
  const client = new MongoClient(uri);
  
  try {
    // Conectar al servidor de MongoDB
    await client.connect();
    console.log('Conectado correctamente a MongoDB');
    
    // Seleccionar la base de datos
    const db = client.db(dbName);
    
    // Listar todas las colecciones para encontrar la colección de profesores
    const collections = await db.listCollections().toArray();
    console.log('Colecciones disponibles:', collections.map(c => c.name).join(', '));
    
    // Buscar la colección de profesores (puede tener diferentes nombres)
    const profesoresCollectionNames = ['profesores', 'profesors', 'Profesores', 'Profesors'];
    let collectionName = null;
    
    for (const name of profesoresCollectionNames) {
      if (collections.some(c => c.name === name)) {
        collectionName = name;
        break;
      }
    }
    
    if (!collectionName) {
      console.error('No se encontró la colección de profesores');
      return;
    }
    
    console.log('Usando colección:', collectionName);
    const collection = db.collection(collectionName);
    
    // Contar cuántos documentos hay en total
    const totalDocs = await collection.countDocuments();
    console.log(`Total de profesores en la base de datos: ${totalDocs}`);
    
    // IMPORTANTE: Actualizar TODOS los documentos para asegurarse de que tengan el campo estado
    // Esto sobrescribirá cualquier valor existente del campo estado
    const resultado = await collection.updateMany(
      {}, // Actualizar todos los documentos
      { $set: { estado: 1 } }, // Establecer estado = 1 (activo) para todos
      { upsert: false } // No crear nuevos documentos
    );
    
    console.log(`Profesores actualizados: ${resultado.modifiedCount}`);
    console.log(`Profesores que coincidían con el criterio: ${resultado.matchedCount}`);
    
    // Verificar que todos los documentos ahora tienen el campo estado
    const profesoresSinEstado = await collection.countDocuments({ estado: { $exists: false } });
    console.log(`Profesores sin el campo estado después de la actualización: ${profesoresSinEstado}`);
    
    // Mostrar algunos ejemplos de profesores actualizados
    const ejemplos = await collection.find({}).limit(5).toArray();
    console.log('Ejemplos de profesores actualizados:');
    ejemplos.forEach(profesor => {
      console.log(`- ${profesor.nombre} ${profesor.apellido || ''}: estado = ${profesor.estado}`);
      console.log('  Campos disponibles:', Object.keys(profesor).join(', '));
    });
    
  } catch (error) {
    console.error('Error al actualizar los profesores:', error);
  } finally {
    // Cerrar la conexión
    await client.close();
    console.log('Conexión cerrada');
  }
}

// Ejecutar la función
actualizarEstadoProfesores();
