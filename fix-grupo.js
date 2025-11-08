// Script para arreglar el problema del campo grupo
// Este script modifica directamente la base de datos para asegurar que el campo grupo esté correctamente definido

// Importar mongoose
const mongoose = require('mongoose');
const { connectDB } = require('./database/db');

// Definir el modelo de Estudiante
const estudianteSchema = new mongoose.Schema({
  idU: {
    type: String,
    required: false,
    default: 'N/P'
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  fechaNacimiento: {
    type: Date,
    required: true
  },
  lugarNacimiento: {
    type: String,
    required: false,
    default: ''
  },
  sexo: {
    type: String,
    enum: ['M', 'F', 'Otro'],
    required: false,
    default: 'Otro'
  },
  grupo: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  ef: {
    type: String,
    required: false,
    default: ''
  },
  edad: {
    type: Number,
    required: true
  },
  esMenorDeEdad: {
    type: Boolean,
    required: true
  },
  // Otros campos del modelo...
});

// Crear el modelo si no existe
let Estudiante;
try {
  Estudiante = mongoose.model('Estudiante');
} catch (error) {
  Estudiante = mongoose.model('Estudiante', estudianteSchema);
}

// Función principal para arreglar el campo grupo
async function fixGrupoField() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('Conexión a MongoDB establecida');

    // Obtener todos los estudiantes
    const estudiantes = await Estudiante.find({});
    console.log(`Encontrados ${estudiantes.length} estudiantes`);

    // Actualizar cada estudiante para asegurar que el campo grupo esté correctamente definido
    let actualizados = 0;
    for (const estudiante of estudiantes) {
      // Asegurar que el campo grupo sea un string
      if (estudiante.grupo === undefined || estudiante.grupo === null) {
        estudiante.grupo = '';
        await estudiante.save();
        actualizados++;
      } else if (typeof estudiante.grupo !== 'string') {
        estudiante.grupo = String(estudiante.grupo);
        await estudiante.save();
        actualizados++;
      }
    }

    console.log(`Actualizados ${actualizados} estudiantes`);
    console.log('Proceso completado exitosamente');

  } catch (error) {
    console.error('Error al arreglar el campo grupo:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar la función principal
fixGrupoField();
