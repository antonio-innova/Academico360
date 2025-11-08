// Script para actualizar directamente la colección de profesores en MongoDB usando la configuración de la aplicación

// Importar las dependencias necesarias
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Leer la configuración de conexión desde el archivo .env o usar valores predeterminados
let MONGODB_URI = 'mongodb://localhost:27017/DBAcademico';
try {
  // Intentar leer el archivo .env si existe
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      if (line.startsWith('MONGODB_URI=')) {
        MONGODB_URI = line.split('=')[1].trim();
        break;
      }
    }
  }
} catch (error) {
  console.error('Error al leer la configuración:', error);
}

console.log('Usando URI de MongoDB:', MONGODB_URI);

async function actualizarEstadoProfesores() {
  let client = null;
  
  try {
    // Conectar al servidor de MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Conectado correctamente a MongoDB');
    
    // Obtener el nombre de la base de datos desde la URI
    const dbName = MONGODB_URI.split('/').pop().split('?')[0];
    console.log('Nombre de la base de datos:', dbName);
    
    // Seleccionar la base de datos y la colección
    const db = client.db(dbName);
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
    
    if (totalDocs === 0) {
      console.log('No hay profesores para actualizar');
      return;
    }
    
    // Verificar cuántos documentos no tienen el campo estado
    const sinEstado = await collection.countDocuments({ estado: { $exists: false } });
    console.log(`Profesores sin el campo estado: ${sinEstado}`);
    
    // Actualizar todos los documentos para asegurarse de que tengan el campo estado
    const resultado = await collection.updateMany(
      { estado: { $exists: false } }, // Actualizar solo los que no tienen estado
      { $set: { estado: 1 } }, // Establecer estado = 1 (activo)
      { upsert: false } // No crear nuevos documentos
    );
    
    console.log(`Profesores actualizados: ${resultado.modifiedCount}`);
    
    // Actualizar también los que ya tienen el campo estado para asegurarse de que sea un número
    const resultadoTipoNumero = await collection.updateMany(
      { estado: { $exists: true }, $or: [{ estado: "1" }, { estado: "0" }] }, // Actualizar los que tienen estado como string
      [{ $set: { estado: { $toInt: "$estado" } } }], // Convertir a número
      { upsert: false }
    );
    
    console.log(`Profesores con estado convertido a número: ${resultadoTipoNumero.modifiedCount}`);
    
    // Verificar que todos los documentos ahora tienen el campo estado
    const profesoresSinEstado = await collection.countDocuments({ estado: { $exists: false } });
    console.log(`Profesores sin el campo estado después de la actualización: ${profesoresSinEstado}`);
    
    // Mostrar algunos ejemplos de profesores actualizados
    const ejemplos = await collection.find({}).limit(5).toArray();
    console.log('Ejemplos de profesores actualizados:');
    ejemplos.forEach(profesor => {
      console.log(`- ${profesor.nombre} ${profesor.apellido || ''}: estado = ${profesor.estado}, tipo = ${typeof profesor.estado}`);
    });
    
  } catch (error) {
    console.error('Error al actualizar los profesores:', error);
  } finally {
    // Cerrar la conexión
    if (client) {
      await client.close();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar la función
actualizarEstadoProfesores();
