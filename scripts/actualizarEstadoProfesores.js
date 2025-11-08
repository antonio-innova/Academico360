// Script para actualizar todos los profesores existentes y asegurarse de que tengan el campo estado
import mongoose from 'mongoose';
import dbConnection from '../database/db.js';
import Profesor from '../database/models/Profesor.js';

async function actualizarEstadoProfesores() {
  try {
    // Conectar a la base de datos
    if (!dbConnection.isConnected()) {
      console.log('Conectando a MongoDB...');
      await dbConnection.connectDB();
      console.log('Conexión a MongoDB establecida');
    }

    // Buscar todos los profesores que no tienen el campo estado
    const profesoresSinEstado = await Profesor.find({ estado: { $exists: false } });
    console.log(`Se encontraron ${profesoresSinEstado.length} profesores sin el campo estado`);

    // Actualizar cada profesor para añadir el campo estado
    for (const profesor of profesoresSinEstado) {
      profesor.estado = 1; // Por defecto, todos los profesores están activos
      await profesor.save();
      console.log(`Profesor actualizado: ${profesor.nombre} ${profesor.apellido} (ID: ${profesor._id})`);
    }

    console.log('Todos los profesores han sido actualizados correctamente');
    
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    
    process.exit(0);
  } catch (error) {
    console.error('Error al actualizar profesores:', error);
    process.exit(1);
  }
}

// Ejecutar la función
actualizarEstadoProfesores();
