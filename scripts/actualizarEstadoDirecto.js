// Script para actualizar directamente la colección de profesores en MongoDB
// Este script añade el campo estado a todos los profesores que no lo tienen

// Importar las dependencias necesarias
const { MongoClient } = require('mongodb');

// URL de conexión a MongoDB (ajusta según tu configuración)
const uri = 'mongodb://localhost:27017/';
const dbName = 'DBAcademico';
const collectionName = 'profesores';

async function actualizarEstadoProfesores() {
  const client = new MongoClient(uri);
  
  try {
    // Conectar al servidor de MongoDB
    await client.connect();
    
    // Seleccionar la base de datos y la colección
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Contar cuántos documentos hay en total
    const totalDocs = await collection.countDocuments();
    
    // Actualizar todos los documentos para asegurarse de que tengan el campo estado
    const resultado = await collection.updateMany(
      {}, // Actualizar todos los documentos
      { $set: { estado: 1 } }, // Establecer estado = 1 (activo) para todos
      { upsert: false } // No crear nuevos documentos
    );
    
    // Verificar que todos los documentos ahora tienen el campo estado
    const profesoresSinEstado = await collection.countDocuments({ estado: { $exists: false } });
    
    if (profesoresSinEstado > 0) {
      console.error(`ADVERTENCIA: Aún hay ${profesoresSinEstado} profesores sin el campo estado`);
    }
    
  } catch (error) {
    console.error('Error al actualizar los profesores:', error);
  } finally {
    // Cerrar la conexión
    await client.close();
  }
}

// Ejecutar la función
actualizarEstadoProfesores();
