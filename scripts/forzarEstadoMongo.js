// Script para forzar el campo estado en todos los profesores en MongoDB
// Ejecutar este script con: node forzarEstadoMongo.js

const { MongoClient } = require('mongodb');

// URL de conexión a MongoDB
const uri = 'mongodb://localhost:27017/';
const dbName = 'DBAcademico';

async function forzarEstadoProfesores() {
  const client = new MongoClient(uri);
  
  try {
    // Conectar al servidor de MongoDB
    await client.connect();
    console.log('Conectado correctamente a MongoDB');
    
    // Seleccionar la base de datos
    const db = client.db(dbName);
    
    // Listar todas las colecciones
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
    
    // Mostrar todos los profesores antes de la actualización
    console.log('Profesores antes de la actualización:');
    const profesoresAntes = await collection.find({}).toArray();
    profesoresAntes.forEach(profesor => {
      console.log(`- ${profesor.nombre} ${profesor.apellido || ''}: estado = ${profesor.estado}, tipo = ${typeof profesor.estado}`);
    });
    
    // MÉTODO 1: Actualizar usando updateMany - FORZAR el campo estado como número
    const resultado1 = await collection.updateMany(
      {}, // Todos los documentos
      [{ $set: { estado: { $cond: [{ $eq: [{ $type: "$estado" }, "missing"] }, 1, { $toInt: { $ifNull: ["$estado", 1] } }] } } }],
      { upsert: false }
    );
    
    console.log(`Profesores actualizados (Método 1): ${resultado1.modifiedCount}`);
    
    // MÉTODO 2: Actualizar cada documento individualmente
    const profesores = await collection.find({}).toArray();
    let contadorActualizados = 0;
    
    for (const profesor of profesores) {
      // Forzar el campo estado como número
      const estadoNumero = typeof profesor.estado === 'number' ? profesor.estado : (Number(profesor.estado) || 1);
      
      // Actualizar el documento directamente
      const resultado = await collection.updateOne(
        { _id: profesor._id },
        { $set: { estado: estadoNumero } }
      );
      
      if (resultado.modifiedCount > 0) {
        contadorActualizados++;
      }
    }
    
    console.log(`Profesores actualizados (Método 2): ${contadorActualizados}`);
    
    // Verificar que todos los documentos ahora tienen el campo estado
    const profesoresSinEstado = await collection.countDocuments({ estado: { $exists: false } });
    console.log(`Profesores sin el campo estado después de la actualización: ${profesoresSinEstado}`);
    
    // Mostrar todos los profesores después de la actualización
    console.log('Profesores después de la actualización:');
    const profesoresDespues = await collection.find({}).toArray();
    profesoresDespues.forEach(profesor => {
      console.log(`- ${profesor.nombre} ${profesor.apellido || ''}: estado = ${profesor.estado}, tipo = ${typeof profesor.estado}`);
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
forzarEstadoProfesores();
